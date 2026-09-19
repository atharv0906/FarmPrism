-- Explicit integration validation. Fixtures and all side effects roll back.
-- Never remove the final ROLLBACK or run this file as a migration.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';
set local role service_role;
do $test$
declare
  f uuid; f_other uuid; b uuid; l uuid; l_other uuid;
  batch_id uuid := gen_random_uuid(); auction_id uuid := gen_random_uuid(); bid_id uuid := gen_random_uuid();
  order_id uuid; job_id uuid := gen_random_uuid();
  r jsonb; generated jsonb; code text; old_code text; wrong text; delivery_code text;
  source_before jsonb; pickup_before jsonb; i integer; saved_count integer;
begin
  select id into f from public.demo_accounts where role_code='farmer' and is_enabled order by id limit 1;
  select id into f_other from public.demo_accounts where role_code='farmer' and is_enabled and id<>f order by id limit 1;
  select id into b from public.demo_accounts where role_code='buyer' and is_enabled order by id limit 1;
  select id into l from public.demo_accounts where role_code='logistics' and is_enabled order by id limit 1;
  select id into l_other from public.demo_accounts where role_code='logistics' and is_enabled and id<>l order by id limit 1;
  if f is null or f_other is null or b is null or l is null or l_other is null then raise exception 'Fixture accounts unavailable'; end if;
  insert into public.demo_inventory_batches(id,farmer_account_id,batch_code,crop_name,original_quantity_kg,remaining_quantity_kg,quality_grade,status)
    values(batch_id,f,'P17-'||batch_id::text,'Onion',100,100,'C','available');
  insert into public.demo_auctions(id,batch_id,offered_quantity_kg,remaining_quantity_kg,reserve_price_per_kg,duration_hours,starts_at,ends_at,status)
    values(auction_id,batch_id,100,100,25,6,clock_timestamp(),clock_timestamp()+interval '6 hours','open');
  insert into public.demo_bids(id,auction_id,buyer_account_id,quantity_kg,price_per_kg,advance_percent,status)
    values(bid_id,auction_id,b,50,25,30,'active');
  r := public.demo_accept_bid(f,bid_id,30);
  order_id := (r->>'orderId')::uuid;
  if r->>'status'<>'farmer_advance_pending' then raise exception 'Active acceptance regressed'; end if;
  select to_jsonb(x) into source_before from public.demo_inventory_batches x where id=batch_id;
  if (source_before->>'remaining_quantity_kg')::numeric<>70 or source_before->>'status'<>'available' then raise exception 'Acceptance remainder incorrect'; end if;

  begin perform public.demo_generate_pickup_otp(f,order_id); raise exception 'Expected unpaid-state rejection';
  exception when others then if sqlerrm<>'INVALID_ORDER_STATE' then raise; end if; end;
  update public.demo_orders set status='logistics_advance_paid' where id=order_id;
  begin perform public.demo_generate_pickup_otp(f,order_id); raise exception 'Expected missing-job rejection';
  exception when others then if sqlerrm<>'LOGISTICS_NOT_ASSIGNED' then raise; end if; end;
  insert into public.demo_logistics_jobs(id,order_id,status,fee_status) values(job_id,order_id,'advance_paid','accepted');
  begin perform public.demo_generate_pickup_otp(f,order_id); raise exception 'Expected unassigned rejection';
  exception when others then if sqlerrm<>'LOGISTICS_NOT_ASSIGNED' then raise; end if; end;
  update public.demo_logistics_jobs set logistics_account_id=l,status='fee_accepted' where id=job_id;
  begin perform public.demo_generate_pickup_otp(f,order_id); raise exception 'Expected unpaid-job rejection';
  exception when others then if sqlerrm<>'INVALID_JOB_STATE' then raise; end if; end;
  update public.demo_logistics_jobs set status='advance_paid' where id=job_id;
  begin perform public.demo_generate_pickup_otp(f_other,order_id); raise exception 'Expected foreign-farmer rejection';
  exception when others then if sqlerrm<>'FORBIDDEN' then raise; end if; end;
  begin perform public.demo_generate_pickup_otp(b,order_id); raise exception 'Expected buyer rejection';
  exception when others then if sqlerrm<>'FORBIDDEN' then raise; end if; end;
  begin perform public.demo_verify_pickup_otp_v2(l,order_id,'123456'); raise exception 'Expected missing-code rejection';
  exception when others then if sqlerrm<>'OTP_NOT_AVAILABLE' then raise; end if; end;

  generated := public.demo_generate_pickup_otp(f,order_id); code := generated->>'otp';
  if code !~ '^[0-9]{6}$' or (select count(*) from jsonb_object_keys(generated))<>3 or generated ? 'code_hash'
    then raise exception 'Unsafe generation response'; end if;
  if not exists (select 1 from public.demo_pickup_otps where demo_pickup_otps.order_id=(generated->>'orderId')::uuid
      and code_hash=encode(extensions.digest(code,'sha256'),'hex') and code_hash<>code
      and expires_at-created_at=interval '15 minutes' and attempt_count=0 and verified_at is null)
    then raise exception 'Pickup storage/expiry contract failed'; end if;

  begin perform public.demo_verify_pickup_otp_v2(l_other,order_id,code); raise exception 'Expected foreign-driver rejection';
  exception when others then if sqlerrm<>'FORBIDDEN' then raise; end if; end;
  begin perform public.demo_verify_pickup_otp_v2(null,order_id,code); raise exception 'Expected null-driver rejection';
  exception when others then if sqlerrm<>'FORBIDDEN' then raise; end if; end;
  begin perform public.demo_verify_pickup_otp_v2(l,order_id,null); raise exception 'Expected null-OTP rejection';
  exception when others then if sqlerrm<>'INVALID_INPUT' then raise; end if; end;
  begin perform public.demo_verify_pickup_otp_v2(l,order_id,'12345x'); raise exception 'Expected malformed-OTP rejection';
  exception when others then if sqlerrm<>'INVALID_INPUT' then raise; end if; end;
  update public.demo_pickup_otps set created_at=clock_timestamp()-interval '20 minutes',expires_at=clock_timestamp()-interval '5 minutes'
    where demo_pickup_otps.order_id=(generated->>'orderId')::uuid;
  begin perform public.demo_verify_pickup_otp_v2(l,order_id,code); raise exception 'Expected expired-code rejection';
  exception when others then if sqlerrm<>'OTP_EXPIRED' then raise; end if; end;

  generated := public.demo_generate_pickup_otp(f,order_id); code := generated->>'otp';
  wrong := case when code='000000' then '000001' else '000000' end;
  for i in 1..5 loop
    r := public.demo_verify_pickup_otp_v2(l,order_id,wrong);
    select attempt_count into saved_count from public.demo_pickup_otps where demo_pickup_otps.order_id=(generated->>'orderId')::uuid;
    if (r->>'verified')::boolean or (r->>'attemptCount')::int<>i or saved_count<>i
       or (r->>'attemptsRemaining')::int<>5-i
       or r->>'errorCode'<>(case when i=5 then 'OTP_ATTEMPTS_EXCEEDED' else 'INVALID_OTP' end)
      then raise exception 'Wrong-attempt persistence/exhaustion failed'; end if;
  end loop;
  r := public.demo_verify_pickup_otp_v2(l,order_id,code);
  if r->>'errorCode'<>'OTP_ATTEMPTS_EXCEEDED' or (r->>'attemptsRemaining')::int<>0
    then raise exception 'Correct code bypassed exhaustion'; end if;
  old_code := code; generated := public.demo_generate_pickup_otp(f,order_id); code := generated->>'otp';
  if code=old_code or (select attempt_count from public.demo_pickup_otps where demo_pickup_otps.order_id=(generated->>'orderId')::uuid)<>0
    then raise exception 'Regeneration did not replace/reset'; end if;
  r := public.demo_verify_pickup_otp_v2(l,order_id,old_code);
  if r->>'errorCode'<>'INVALID_OTP' then raise exception 'Previous code still works'; end if;
  generated := public.demo_generate_pickup_otp(f,order_id); code := generated->>'otp';
  r := public.demo_verify_pickup_otp_v2(l,order_id,code);
  if r<>jsonb_build_object('verified',true,'orderId',order_id,'status','pickup_confirmed','attemptCount',1,'attemptsRemaining',4)
    then raise exception 'Pickup success contract failed'; end if;
  if not exists(select 1 from public.demo_orders where id=order_id and status='pickup_confirmed')
     or not exists(select 1 from public.demo_logistics_jobs where id=job_id and status='pickup_confirmed')
     or not exists(select 1 from public.demo_pickup_otps where demo_pickup_otps.order_id=(generated->>'orderId')::uuid and verified_at is not null)
    then raise exception 'Atomic pickup state failed'; end if;
  if (select to_jsonb(x) from public.demo_inventory_batches x where id=batch_id) is distinct from source_before
    then raise exception 'Pickup mutated physical source remainder'; end if;
  if (select count(*) from public.demo_order_events e where e.order_id=(generated->>'orderId')::uuid and event_type='pickup_confirmed')<>1
     or (select count(*) from public.demo_notifications where entity_key=order_id::text and notification_type='pickup_confirmed' and account_id in (f,b))<>2
    then raise exception 'Pickup event/notifications failed'; end if;
  begin perform public.demo_generate_pickup_otp(f,order_id); raise exception 'Expected post-pickup generation rejection';
  exception when others then if sqlerrm<>'INVALID_ORDER_STATE' then raise; end if; end;
  begin perform public.demo_verify_pickup_otp_v2(l,order_id,code); raise exception 'Expected replay rejection';
  exception when others then if sqlerrm<>'INVALID_ORDER_STATE' then raise; end if; end;
  begin perform public.demo_confirm_pickup(l,job_id); raise exception 'Retired direct pickup was executable';
  exception when insufficient_privilege then null; end;

  -- Proven Delivery OTP definitions are executed unchanged on this disposable order.
  select to_jsonb(x) into pickup_before from public.demo_pickup_otps x where x.order_id=(generated->>'orderId')::uuid;
  update public.demo_orders set status='in_transit' where id=order_id;
  update public.demo_logistics_jobs set status='in_transit' where id=job_id;
  generated := public.demo_generate_delivery_otp(b,order_id); delivery_code := generated->>'otp';
  if delivery_code !~ '^[0-9]{6}$' then raise exception 'Delivery generation regressed'; end if;
  wrong := case when delivery_code='000000' then '000001' else '000000' end;
  for i in 1..5 loop
    r := public.demo_verify_delivery_otp_v2(l,order_id,wrong);
    if (r->>'attemptCount')::integer<>i or (r->>'attemptsRemaining')::integer<>5-i
      then raise exception 'Delivery attempts regressed'; end if;
  end loop;
  r := public.demo_verify_delivery_otp_v2(l,order_id,delivery_code);
  if r->>'errorCode'<>'OTP_ATTEMPTS_EXCEEDED' then raise exception 'Delivery exhaustion regressed'; end if;
  generated := public.demo_generate_delivery_otp(b,order_id); delivery_code := generated->>'otp';
  r := public.demo_verify_delivery_otp_v2(l,order_id,delivery_code);
  if not (r->>'verified')::boolean or r->>'status'<>'balance_pending'
     or not exists(select 1 from public.demo_logistics_jobs where id=job_id and status='delivered')
     or not exists(select 1 from public.demo_orders where id=order_id and status='balance_pending')
    then raise exception 'Delivery transition regressed'; end if;
  if (select to_jsonb(x) from public.demo_pickup_otps x where x.order_id=(generated->>'orderId')::uuid) is distinct from pickup_before
    then raise exception 'Delivery changed Pickup OTP'; end if;
  if not exists(select 1 from public.demo_inventory_batches where id=batch_id and remaining_quantity_kg=70 and status='available')
    then raise exception 'Delivery remainder regressed'; end if;
end;
$test$;
reset role;
do $test$
begin
  begin perform public.demo_confirm_pickup(null,null); raise exception 'Owner bypass remains';
  exception when others then if sqlerrm<>'PICKUP_OTP_REQUIRED' then raise; end if; end;
end;
$test$;
select 'PASS: pickup authorization, storage, expiry, regeneration, five persisted failed attempts, exhaustion, success, no source mutation, retired path, and independent Delivery OTP' as result;
rollback;
