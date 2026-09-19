-- Phase 2.0.17: inspected live FarmPrism schema; no business-data reset/backfill.
-- Application baseline fe52152b235eb4f6fdf0444524e9178e5c43687c.
-- Apply as one transaction. Preserve all existing Delivery OTP definitions.
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create table public.demo_pickup_otps (
  order_id uuid primary key references public.demo_orders(id) on delete cascade,
  code_hash text not null check (code_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  attempt_count integer not null default 0 check (attempt_count between 0 and 5),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);
alter table public.demo_pickup_otps enable row level security;
revoke all on table public.demo_pickup_otps from public, anon, authenticated;
grant select, insert, update, delete on table public.demo_pickup_otps to service_role;

alter table public.demo_bids drop constraint demo_bids_status_check;
alter table public.demo_bids add constraint demo_bids_status_check
  check (status in ('active','replaced','outbid','accepted','partially_accepted','rejected','withdrawn','expired'));
alter table public.demo_purchase_requests drop constraint demo_purchase_requests_status_check;
alter table public.demo_purchase_requests add constraint demo_purchase_requests_status_check
  check (status in ('pending','accepted','partially_accepted','rejected','withdrawn','expired'));

-- Only these two notification types acquire a uniqueness rule; other notifications stay unchanged.
create unique index demo_auction_lifecycle_notification_once
  on public.demo_notifications(account_id, notification_type, entity_type, entity_key)
  where entity_type = 'auction' and notification_type in ('auction_expiring','auction_expired');

create or replace function public.demo_generate_pickup_otp(p_farmer_account_id uuid, p_order_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  v_o public.demo_orders%rowtype;
  v_j public.demo_logistics_jobs%rowtype;
  v_old_hash text; v_hash text; v_code text; v_bytes bytea; v_number integer;
  v_created timestamptz; v_exp timestamptz;
begin
  if not exists (select 1 from public.demo_accounts where id=p_farmer_account_id and role_code='farmer' and is_enabled) then
    raise exception 'FORBIDDEN';
  end if;
  select * into v_o from public.demo_orders where id=p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_o.farmer_account_id is distinct from p_farmer_account_id then raise exception 'FORBIDDEN'; end if;
  if v_o.status <> 'logistics_advance_paid' then raise exception 'INVALID_ORDER_STATE'; end if;
  select * into v_j from public.demo_logistics_jobs where order_id=v_o.id for update;
  if not found or v_j.logistics_account_id is null then raise exception 'LOGISTICS_NOT_ASSIGNED'; end if;
  if v_j.status <> 'advance_paid' then raise exception 'INVALID_JOB_STATE'; end if;
  select code_hash into v_old_hash from public.demo_pickup_otps where order_id=v_o.id for update;
  -- CSPRNG with rejection sampling avoids modulo bias and guarantees regeneration changes the code.
  loop
    v_bytes := extensions.gen_random_bytes(3);
    v_number := get_byte(v_bytes,0)*65536 + get_byte(v_bytes,1)*256 + get_byte(v_bytes,2);
    if v_number >= 16000000 then continue; end if;
    v_code := lpad((v_number % 1000000)::text,6,'0');
    v_hash := encode(extensions.digest(v_code,'sha256'),'hex');
    exit when v_hash is distinct from v_old_hash;
  end loop;
  v_created := clock_timestamp();
  v_exp := v_created + interval '15 minutes';
  insert into public.demo_pickup_otps(order_id,code_hash,expires_at,attempt_count,verified_at,created_at)
  values(v_o.id,v_hash,v_exp,0,null,v_created)
  on conflict(order_id) do update set code_hash=excluded.code_hash, expires_at=excluded.expires_at,
    attempt_count=0, verified_at=null, created_at=excluded.created_at;
  insert into public.demo_order_events(order_id,event_type,actor_account_id,data)
  values(v_o.id,'pickup_otp_generated',p_farmer_account_id,jsonb_build_object('expiresAt',v_exp));
  return jsonb_build_object('orderId',v_o.id,'otp',v_code,'expiresAt',v_exp);
end;
$function$;

create or replace function public.demo_verify_pickup_otp_v2(p_logistics_account_id uuid, p_order_id uuid, p_otp text)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  v_o public.demo_orders%rowtype;
  v_j public.demo_logistics_jobs%rowtype;
  v_p public.demo_pickup_otps%rowtype;
  v_attempts integer;
begin
  if p_otp is null or p_otp !~ '^[0-9]{6}$' then raise exception 'INVALID_INPUT'; end if;
  if not exists (select 1 from public.demo_accounts where id=p_logistics_account_id and role_code='logistics' and is_enabled) then
    raise exception 'FORBIDDEN';
  end if;
  select * into v_o from public.demo_orders where id=p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_o.status <> 'logistics_advance_paid' then raise exception 'INVALID_ORDER_STATE'; end if;
  select * into v_j from public.demo_logistics_jobs where order_id=v_o.id for update;
  if not found or v_j.logistics_account_id is null or v_j.logistics_account_id is distinct from p_logistics_account_id then
    raise exception 'FORBIDDEN';
  end if;
  if v_j.status <> 'advance_paid' then raise exception 'INVALID_JOB_STATE'; end if;
  select * into v_p from public.demo_pickup_otps where order_id=v_o.id for update;
  if not found or v_p.verified_at is not null then raise exception 'OTP_NOT_AVAILABLE'; end if;
  if v_p.expires_at <= clock_timestamp() then raise exception 'OTP_EXPIRED'; end if;
  if v_p.attempt_count >= 5 then
    return jsonb_build_object('verified',false,'errorCode','OTP_ATTEMPTS_EXCEEDED','attemptCount',v_p.attempt_count,'attemptsRemaining',0);
  end if;
  v_attempts := v_p.attempt_count + 1;
  if encode(extensions.digest(p_otp,'sha256'),'hex') <> v_p.code_hash then
    update public.demo_pickup_otps set attempt_count=v_attempts where order_id=v_o.id;
    -- Return instead of raising: the failed attempt must survive this RPC call.
    return jsonb_build_object('verified',false,'errorCode',case when v_attempts>=5 then 'OTP_ATTEMPTS_EXCEEDED' else 'INVALID_OTP' end,
      'attemptCount',v_attempts,'attemptsRemaining',greatest(0,5-v_attempts));
  end if;
  update public.demo_pickup_otps set verified_at=clock_timestamp(),attempt_count=v_attempts where order_id=v_o.id;
  update public.demo_orders set status='pickup_confirmed',updated_at=now() where id=v_o.id;
  update public.demo_logistics_jobs set status='pickup_confirmed',updated_at=now() where id=v_j.id;
  -- Allocation was deducted at acceptance. Never update the source physical batch here.
  insert into public.demo_order_events(order_id,event_type,actor_account_id,data)
  values(v_o.id,'pickup_confirmed',p_logistics_account_id,jsonb_build_object('jobId',v_j.id,'otpVerified',true));
  perform public.demo_notify(v_o.farmer_account_id,'pickup_confirmed','Produce picked up',
    'Farmer handoff verified by Pickup OTP.','order',v_o.id::text,jsonb_build_object('orderId',v_o.id));
  perform public.demo_notify(v_o.buyer_account_id,'pickup_confirmed','Produce picked up',
    'Farmer handoff verified by Pickup OTP.','order',v_o.id::text,jsonb_build_object('orderId',v_o.id));
  return jsonb_build_object('verified',true,'orderId',v_o.id,'status','pickup_confirmed',
    'attemptCount',v_attempts,'attemptsRemaining',greatest(0,5-v_attempts));
end;
$function$;

-- No application, SQL-source or catalog caller was found. Preserve the signature as a disabled stub.
create or replace function public.demo_confirm_pickup(p_logistics_account_id uuid, p_job_id uuid)
returns jsonb language plpgsql security invoker set search_path = ''
as $function$
begin
  raise exception 'PICKUP_OTP_REQUIRED';
end;
$function$;
revoke all on function public.demo_confirm_pickup(uuid,uuid) from public, anon, authenticated, service_role;

-- Preserve acceptance logic; check wall-clock deadline after bid/listing/batch locks.
CREATE OR REPLACE FUNCTION public.demo_accept_bid(p_farmer_account_id uuid, p_bid_id uuid, p_accept_quantity_kg numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_bid public.demo_bids%rowtype; v_a public.demo_auctions%rowtype; v_batch public.demo_inventory_batches%rowtype;
  v_already numeric; v_bid_remaining numeric; v_order_id uuid; v_order_code text; v_total numeric; v_new_auction_remaining numeric; v_new_batch_remaining numeric;
begin
  if p_accept_quantity_kg<=0 then raise exception 'INVALID_INPUT'; end if;
  select * into v_bid from public.demo_bids where id=p_bid_id for update;
  if not found then raise exception 'BID_NOT_FOUND'; end if;
  if v_bid.status not in ('active','partially_accepted') then raise exception 'BID_NOT_ACCEPTABLE'; end if;
  select * into v_a from public.demo_auctions where id=v_bid.auction_id for update;
  if not found then raise exception 'AUCTION_NOT_FOUND'; end if;
  select * into v_batch from public.demo_inventory_batches where id=v_a.batch_id for update;
  if v_batch.farmer_account_id<>p_farmer_account_id then raise exception 'FORBIDDEN'; end if;
  if v_a.status not in ('open','closed','partially_sold') or v_a.ends_at <= clock_timestamp() then raise exception 'AUCTION_NOT_ACCEPTABLE'; end if;
  select coalesce(sum(allocated_quantity_kg),0) into v_already from public.demo_orders where accepted_bid_id=p_bid_id and status<>'cancelled';
  v_bid_remaining:=v_bid.quantity_kg-v_already;
  if p_accept_quantity_kg>v_bid_remaining or p_accept_quantity_kg>v_a.remaining_quantity_kg or p_accept_quantity_kg>v_batch.remaining_quantity_kg then raise exception 'QUANTITY_EXCEEDS_AVAILABLE'; end if;
  v_order_id:=gen_random_uuid();
  v_order_code:='FP-'||upper(substr(replace(v_order_id::text,'-',''),1,10));
  v_total:=round(p_accept_quantity_kg*v_bid.price_per_kg,2);
  insert into public.demo_orders(id,order_code,source_type,auction_id,accepted_bid_id,batch_id,farmer_account_id,buyer_account_id,allocated_quantity_kg,unit_price_per_kg,total_amount,farmer_advance_percent,delivery_label,delivery_latitude,delivery_longitude,status)
  values(v_order_id,v_order_code,'auction',v_a.id,v_bid.id,v_batch.id,p_farmer_account_id,v_bid.buyer_account_id,p_accept_quantity_kg,v_bid.price_per_kg,v_total,v_bid.advance_percent,v_bid.delivery_label,v_bid.delivery_latitude,v_bid.delivery_longitude,'farmer_advance_pending');
  v_new_auction_remaining:=v_a.remaining_quantity_kg-p_accept_quantity_kg;
  v_new_batch_remaining:=v_batch.remaining_quantity_kg-p_accept_quantity_kg;
  update public.demo_auctions set remaining_quantity_kg=v_new_auction_remaining,status=case when v_new_auction_remaining=0 then 'completed' else 'partially_sold' end,updated_at=now() where id=v_a.id;
  update public.demo_inventory_batches set remaining_quantity_kg=v_new_batch_remaining,status=case when v_new_batch_remaining=0 then 'sold' else 'available' end,updated_at=now() where id=v_batch.id;
  v_already:=v_already+p_accept_quantity_kg;
  update public.demo_bids set status=case when v_already>=v_bid.quantity_kg then 'accepted' else 'partially_accepted' end,updated_at=now() where id=v_bid.id;
  insert into public.demo_order_events(order_id,event_type,actor_account_id,data) values(v_order_id,'order_created',p_farmer_account_id,jsonb_build_object('source','auction','bidId',p_bid_id));
  perform public.demo_notify(v_bid.buyer_account_id,'bid_accepted','Your bid was accepted','The farmer accepted all or part of your bid.','order',v_order_id::text,jsonb_build_object('orderId',v_order_id,'orderCode',v_order_code));
  return jsonb_build_object('orderId',v_order_id,'orderCode',v_order_code,'status','farmer_advance_pending','acceptedQuantityKg',p_accept_quantity_kg,'totalAmount',v_total);
end;
$function$
;

-- Preserve acceptance logic; check wall-clock deadline after bid/listing/batch locks.
CREATE OR REPLACE FUNCTION public.demo_accept_purchase_request(p_farmer_account_id uuid, p_request_id uuid, p_accept_quantity_kg numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_req public.demo_purchase_requests%rowtype; v_l public.demo_fixed_price_listings%rowtype; v_batch public.demo_inventory_batches%rowtype;
  v_already numeric; v_req_remaining numeric; v_order_id uuid; v_order_code text; v_total numeric; v_new_listing_remaining numeric; v_new_batch_remaining numeric;
begin
  if p_accept_quantity_kg<=0 then raise exception 'INVALID_INPUT'; end if;
  select * into v_req from public.demo_purchase_requests where id=p_request_id for update;
  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
  if v_req.status not in ('pending','partially_accepted') then raise exception 'REQUEST_NOT_ACCEPTABLE'; end if;
  select * into v_l from public.demo_fixed_price_listings where id=v_req.listing_id for update;
  select * into v_batch from public.demo_inventory_batches where id=v_l.batch_id for update;
  if v_batch.farmer_account_id<>p_farmer_account_id then raise exception 'FORBIDDEN'; end if;
  if v_l.status not in ('active','partially_sold','closed') or v_l.expires_at <= clock_timestamp() then raise exception 'LISTING_NOT_ACCEPTABLE'; end if;
  select coalesce(sum(allocated_quantity_kg),0) into v_already from public.demo_orders where purchase_request_id=p_request_id and status<>'cancelled';
  v_req_remaining:=v_req.quantity_kg-v_already;
  if p_accept_quantity_kg>v_req_remaining or p_accept_quantity_kg>v_l.remaining_quantity_kg or p_accept_quantity_kg>v_batch.remaining_quantity_kg then raise exception 'QUANTITY_EXCEEDS_AVAILABLE'; end if;
  v_order_id:=gen_random_uuid();
  v_order_code:='FP-'||upper(substr(replace(v_order_id::text,'-',''),1,10));
  v_total:=round(p_accept_quantity_kg*v_l.fixed_price_per_kg,2);
  insert into public.demo_orders(id,order_code,source_type,fixed_price_listing_id,purchase_request_id,batch_id,farmer_account_id,buyer_account_id,allocated_quantity_kg,unit_price_per_kg,total_amount,farmer_advance_percent,delivery_label,delivery_latitude,delivery_longitude,status)
  values(v_order_id,v_order_code,'fixed_price',v_l.id,v_req.id,v_batch.id,p_farmer_account_id,v_req.buyer_account_id,p_accept_quantity_kg,v_l.fixed_price_per_kg,v_total,v_req.advance_percent,v_req.delivery_label,v_req.delivery_latitude,v_req.delivery_longitude,'farmer_advance_pending');
  v_new_listing_remaining:=v_l.remaining_quantity_kg-p_accept_quantity_kg;
  v_new_batch_remaining:=v_batch.remaining_quantity_kg-p_accept_quantity_kg;
  update public.demo_fixed_price_listings set remaining_quantity_kg=v_new_listing_remaining,status=case when v_new_listing_remaining=0 then 'sold' else 'partially_sold' end,updated_at=now() where id=v_l.id;
  update public.demo_inventory_batches set remaining_quantity_kg=v_new_batch_remaining,status=case when v_new_batch_remaining=0 then 'sold' else 'available' end,updated_at=now() where id=v_batch.id;
  v_already:=v_already+p_accept_quantity_kg;
  update public.demo_purchase_requests set status=case when v_already>=v_req.quantity_kg then 'accepted' else 'partially_accepted' end,updated_at=now() where id=v_req.id;
  insert into public.demo_order_events(order_id,event_type,actor_account_id,data) values(v_order_id,'order_created',p_farmer_account_id,jsonb_build_object('source','fixed_price','requestId',p_request_id));
  perform public.demo_notify(v_req.buyer_account_id,'purchase_request_accepted','Purchase request accepted','The farmer accepted all or part of your fixed-price request.','order',v_order_id::text,jsonb_build_object('orderId',v_order_id,'orderCode',v_order_code));
  return jsonb_build_object('orderId',v_order_id,'orderCode',v_order_code,'status','farmer_advance_pending','acceptedQuantityKg',p_accept_quantity_kg,'totalAmount',v_total);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.demo_recalculate_trust(p_account_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_role text;
  v_rating_count int;
  v_avg_rating numeric;
  v_completed int;
  v_quality numeric;
  v_payment numeric;
  v_delivery numeric;
  v_score numeric;
begin
  select role_code into v_role from public.demo_accounts where id = p_account_id;
  if v_role is null then raise exception 'ACCOUNT_NOT_FOUND'; end if;

  select count(*), avg(rating::numeric)
    into v_rating_count, v_avg_rating
  from public.demo_feedback
  where to_account_id = p_account_id;

  select count(*) into v_completed
  from public.demo_orders o
  left join public.demo_logistics_jobs j on j.order_id = o.id
  where o.status = 'completed'
    and (
      o.farmer_account_id = p_account_id
      or o.buyer_account_id = p_account_id
      or j.logistics_account_id = p_account_id
    );

  if v_role = 'farmer' then
    /* Trust should reward complete, consistent declaration history, not punish honest Grade C produce. */
    select case
      when count(*) = 0 then null
      else round(100.0 * count(*) filter (
        where quality_grade in ('A','B','C') and quality_source = 'farmer_declared'
      ) / count(*), 2)
    end
    into v_quality
    from public.demo_inventory_batches b
    where b.farmer_account_id = p_account_id
      and (
        exists(select 1 from public.demo_auctions a where a.batch_id=b.id)
        or exists(select 1 from public.demo_fixed_price_listings l where l.batch_id=b.id)
        or exists(select 1 from public.demo_orders o where o.batch_id=b.id)
      );
  elsif v_role = 'buyer' then
    select case
      when count(*) = 0 then null
      else round(100.0 * count(*) filter (where status = 'paid') / count(*), 2)
    end
    into v_payment
    from public.demo_payments
    where buyer_account_id = p_account_id;
  elsif v_role = 'logistics' then
    select case
      when count(*) = 0 then null
      else round(100.0 * count(*) filter (where status in ('delivered','completed')) / count(*), 2)
    end
    into v_delivery
    from public.demo_logistics_jobs
    where logistics_account_id = p_account_id;
  end if;

  v_score := round(least(100, greatest(0,
    coalesce((v_avg_rating / 5.0) * 70, 70)
    + case v_role
        when 'farmer' then coalesce(v_quality, 80) * 0.20
        when 'buyer' then coalesce(v_payment, 80) * 0.20
        else coalesce(v_delivery, 80) * 0.20
      end
    + least(v_completed, 10)
  )), 2);

  insert into public.demo_trust_scores(
    account_id, score, rating_count, completed_transactions,
    quality_consistency_score, payment_reliability_score,
    delivery_reliability_score, updated_at
  ) values (
    p_account_id, v_score, v_rating_count, v_completed,
    case when v_role = 'farmer' then v_quality else null end,
    case when v_role = 'buyer' then v_payment else null end,
    case when v_role = 'logistics' then v_delivery else null end,
    now()
  )
  on conflict(account_id) do update set
    score = excluded.score,
    rating_count = excluded.rating_count,
    completed_transactions = excluded.completed_transactions,
    quality_consistency_score = excluded.quality_consistency_score,
    payment_reliability_score = excluded.payment_reliability_score,
    delivery_reliability_score = excluded.delivery_reliability_score,
    updated_at = now();

  return jsonb_build_object(
    'accountId', p_account_id,
    'score', v_score,
    'ratingCount', v_rating_count,
    'completedTransactions', v_completed
  );
end;
$function$
;

create or replace function public.demo_expire_marketplace()
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  v_a public.demo_auctions%rowtype;
  v_now timestamptz; v_farmer uuid; v_physical numeric;
  v_auctions integer := 0; v_listings integer := 0;
  v_bids integer := 0; v_requests integer := 0;
begin
  -- Skip busy parent rows. Acceptance keeps its existing bid -> parent -> batch lock order.
  -- Never wait on a bid while holding its auction: the cleanup below also uses SKIP LOCKED.
  for v_a in
    select * from public.demo_auctions
    where status in ('open','partially_sold') and ends_at <= clock_timestamp()+interval '1 hour'
    order by id for update skip locked
  loop
    v_now := clock_timestamp();
    select farmer_account_id,remaining_quantity_kg into v_farmer,v_physical
      from public.demo_inventory_batches where id=v_a.batch_id;
    if v_a.ends_at <= v_now then
      update public.demo_auctions set status='expired',updated_at=v_now where id=v_a.id;
      v_auctions := v_auctions+1;
      if v_a.remaining_quantity_kg > 0 then
        insert into public.demo_notifications(account_id,notification_type,title,body,entity_type,entity_key,data)
        values(v_farmer,'auction_expired','Auction expired',
          'Your auction has ended. Remaining produce is available to list again.',
          'auction',v_a.id::text,jsonb_build_object('auctionId',v_a.id))
        on conflict do nothing;
      end if;
    elsif v_a.remaining_quantity_kg > 0 and v_physical > 0 and exists (
      select 1 from public.demo_bids b
      where b.auction_id=v_a.id and b.status in ('active','partially_accepted')
        and b.quantity_kg > coalesce((select sum(o.allocated_quantity_kg) from public.demo_orders o
          where o.accepted_bid_id=b.id and o.status<>'cancelled'),0)
    ) then
      insert into public.demo_notifications(account_id,notification_type,title,body,entity_type,entity_key,data)
      values(v_farmer,'auction_expiring','Auction ending soon',
        'You still have unaccepted buyer offers. Review them before this auction expires.',
        'auction',v_a.id::text,jsonb_build_object('auctionId',v_a.id))
      on conflict do nothing;
    end if;
  end loop;

  with due as (
    select id from public.demo_fixed_price_listings
    where status in ('active','partially_sold') and expires_at <= clock_timestamp()
    order by id for update skip locked
  )
  update public.demo_fixed_price_listings l set status='expired',updated_at=clock_timestamp()
  from due where l.id=due.id;
  get diagnostics v_listings = row_count;

  -- Include previously expired parents so a skipped busy child is cleaned up on the next invocation.
  with due as (
    select b.id from public.demo_bids b join public.demo_auctions a on a.id=b.auction_id
    where a.status='expired' and b.status in ('active','partially_accepted')
      and b.quantity_kg > coalesce((select sum(o.allocated_quantity_kg) from public.demo_orders o
        where o.accepted_bid_id=b.id and o.status<>'cancelled'),0)
    order by b.id for update of b skip locked
  )
  update public.demo_bids b set status='expired',updated_at=clock_timestamp() from due where b.id=due.id;
  get diagnostics v_bids = row_count;

  with due as (
    select r.id from public.demo_purchase_requests r join public.demo_fixed_price_listings l on l.id=r.listing_id
    where l.status='expired' and r.status in ('pending','partially_accepted')
      and r.quantity_kg > coalesce((select sum(o.allocated_quantity_kg) from public.demo_orders o
        where o.purchase_request_id=r.id and o.status<>'cancelled'),0)
    order by r.id for update of r skip locked
  )
  update public.demo_purchase_requests r set status='expired',updated_at=clock_timestamp() from due where r.id=due.id;
  get diagnostics v_requests = row_count;

  -- No inventory/order writes: expiry releases listing exclusivity, not another allocation.
  return jsonb_build_object('expiredAuctions',v_auctions,'expiredListings',v_listings,
    'expiredBids',v_bids,'expiredRequests',v_requests);
end;
$function$;

-- Explicit backend-only privileges, including PUBLIC's inherited default EXECUTE.
revoke all on function public.demo_generate_pickup_otp(uuid,uuid),
  public.demo_verify_pickup_otp_v2(uuid,uuid,text),
  public.demo_accept_bid(uuid,uuid,numeric),
  public.demo_accept_purchase_request(uuid,uuid,numeric),
  public.demo_expire_marketplace(),
  public.demo_recalculate_trust(uuid) from public, anon, authenticated;
grant execute on function public.demo_generate_pickup_otp(uuid,uuid),
  public.demo_verify_pickup_otp_v2(uuid,uuid,text),
  public.demo_accept_bid(uuid,uuid,numeric),
  public.demo_accept_purchase_request(uuid,uuid,numeric),
  public.demo_expire_marketplace(),
  public.demo_recalculate_trust(uuid) to service_role;
