-- Phase 2.0.19: Auction-only, immutable partial-sale policy.
-- Function bodies taken from the deployed definitions; existing lifecycle remains intact.
ALTER TABLE public.demo_auctions ADD COLUMN allow_partial_sale boolean NOT NULL DEFAULT true;

CREATE FUNCTION public.demo_auction_partial_sale_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $function$
BEGIN
  IF NEW.allow_partial_sale IS DISTINCT FROM OLD.allow_partial_sale THEN
    RAISE EXCEPTION 'AUCTION_PARTIAL_SALE_IMMUTABLE';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.demo_auction_partial_sale_immutable() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER demo_auction_partial_sale_immutable
BEFORE UPDATE OF allow_partial_sale ON public.demo_auctions
FOR EACH ROW EXECUTE FUNCTION public.demo_auction_partial_sale_immutable();

-- Replace the old signature (no ambiguous overload). Old five-argument callers default ON.
DROP FUNCTION public.demo_create_auction(uuid, uuid, numeric, numeric, integer);
CREATE OR REPLACE FUNCTION public.demo_create_auction(p_farmer_account_id uuid, p_batch_id uuid, p_quantity_kg numeric, p_reserve_price_per_kg numeric, p_duration_hours integer, p_allow_partial_sale boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_batch public.demo_inventory_batches%rowtype;
  v_id uuid;
begin
  if p_allow_partial_sale is null then raise exception 'INVALID_INPUT'; end if;
  if p_quantity_kg <= 0 or p_reserve_price_per_kg <= 0 or p_duration_hours not in (6,12,24) then
    raise exception 'INVALID_INPUT';
  end if;

  if not exists(select 1 from public.demo_accounts where id=p_farmer_account_id and role_code='farmer' and is_enabled=true) then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_batch from public.demo_inventory_batches where id=p_batch_id for update;
  if not found then raise exception 'BATCH_NOT_FOUND'; end if;
  if v_batch.farmer_account_id <> p_farmer_account_id then raise exception 'FORBIDDEN'; end if;
  if v_batch.status <> 'available' or v_batch.remaining_quantity_kg < p_quantity_kg then raise exception 'INSUFFICIENT_AVAILABLE_QUANTITY'; end if;
  if v_batch.quality_grade is null then raise exception 'QUALITY_GRADE_REQUIRED'; end if;

  perform public.demo_expire_marketplace();
  if exists(select 1 from public.demo_auctions where batch_id=p_batch_id and status in ('open','partially_sold'))
     or exists(select 1 from public.demo_fixed_price_listings where batch_id=p_batch_id and status in ('active','partially_sold')) then
    raise exception 'BATCH_ALREADY_LISTED';
  end if;

  insert into public.demo_auctions(batch_id,offered_quantity_kg,remaining_quantity_kg,reserve_price_per_kg,duration_hours,starts_at,ends_at,status,allow_partial_sale)
  values(p_batch_id,p_quantity_kg,p_quantity_kg,p_reserve_price_per_kg,p_duration_hours,now(),now()+make_interval(hours=>p_duration_hours),'open',p_allow_partial_sale)
  returning id into v_id;

  insert into public.demo_notifications(account_id,notification_type,title,body,entity_type,entity_key,data)
  select id,'new_auction','New auction available',v_batch.crop_name||' is available in a new auction.','auction',v_id::text,
         jsonb_build_object('auctionId',v_id,'crop',v_batch.crop_name,'quantityKg',p_quantity_kg)
  from public.demo_accounts where role_code='buyer' and is_enabled=true;

  return jsonb_build_object('auctionId',v_id,'status','open');
end;
$function$
;
CREATE OR REPLACE FUNCTION public.demo_place_or_revise_bid(p_buyer_account_id uuid, p_auction_id uuid, p_quantity_kg numeric, p_price_per_kg numeric, p_advance_percent numeric, p_delivery_label text, p_delivery_latitude numeric DEFAULT NULL::numeric, p_delivery_longitude numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_a public.demo_auctions%rowtype; v_old public.demo_bids%rowtype; v_new uuid; v_farmer uuid;
begin
  if p_quantity_kg<=0 or p_price_per_kg<=0 or p_advance_percent<10 or p_advance_percent>90 then raise exception 'INVALID_INPUT'; end if;
  if not exists(select 1 from public.demo_accounts a join public.demo_buyer_profiles bp on bp.account_id=a.id where a.id=p_buyer_account_id and a.role_code='buyer' and a.is_enabled=true and bp.verification_status='verified') then raise exception 'FORBIDDEN'; end if;
  perform public.demo_expire_marketplace();
  select * into v_a from public.demo_auctions where id=p_auction_id for update;
  if not found then raise exception 'AUCTION_NOT_FOUND'; end if;
  if v_a.status<>'open' or v_a.ends_at<=clock_timestamp() then raise exception 'AUCTION_NOT_OPEN'; end if;
  if not v_a.allow_partial_sale and p_quantity_kg is distinct from v_a.remaining_quantity_kg then raise exception 'FULL_LOT_REQUIRED'; end if;
  if p_quantity_kg>v_a.remaining_quantity_kg then raise exception 'QUANTITY_EXCEEDS_AVAILABLE'; end if;
  if p_price_per_kg<v_a.reserve_price_per_kg then raise exception 'PRICE_BELOW_RESERVE'; end if;

  select * into v_old from public.demo_bids where auction_id=p_auction_id and buyer_account_id=p_buyer_account_id and status='active' for update;
  if found then
    update public.demo_bids set status='replaced',updated_at=now() where id=v_old.id;
  end if;

  insert into public.demo_bids(auction_id,buyer_account_id,quantity_kg,price_per_kg,advance_percent,delivery_label,delivery_latitude,delivery_longitude,status,replaced_bid_id)
  values(p_auction_id,p_buyer_account_id,p_quantity_kg,p_price_per_kg,p_advance_percent,p_delivery_label,p_delivery_latitude,p_delivery_longitude,'active',case when v_old.id is null then null else v_old.id end)
  returning id into v_new;

  select b.farmer_account_id into v_farmer from public.demo_inventory_batches b where b.id=v_a.batch_id;
  perform public.demo_notify(v_farmer,case when v_old.id is null then 'new_bid' else 'bid_revised' end,
    case when v_old.id is null then 'New buyer bid' else 'Buyer revised bid' end,
    'A buyer submitted an offer on your auction.','bid',v_new::text,jsonb_build_object('bidId',v_new,'auctionId',p_auction_id));
  return jsonb_build_object('bidId',v_new,'status','active','revised',v_old.id is not null);
end;
$function$
;
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
  if not v_a.allow_partial_sale and (p_accept_quantity_kg is distinct from v_a.remaining_quantity_kg or p_accept_quantity_kg is distinct from v_bid_remaining) then raise exception 'FULL_LOT_REQUIRED'; end if;
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
REVOKE ALL ON FUNCTION public.demo_create_auction(uuid,uuid,numeric,numeric,integer,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.demo_create_auction(uuid,uuid,numeric,numeric,integer,boolean) TO service_role;
REVOKE ALL ON FUNCTION public.demo_place_or_revise_bid(uuid,uuid,numeric,numeric,numeric,text,numeric,numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.demo_place_or_revise_bid(uuid,uuid,numeric,numeric,numeric,text,numeric,numeric) TO service_role;
REVOKE ALL ON FUNCTION public.demo_accept_bid(uuid,uuid,numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.demo_accept_bid(uuid,uuid,numeric) TO service_role;
NOTIFY pgrst, 'reload schema';
