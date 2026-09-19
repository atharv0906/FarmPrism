-- Live integration assertions with isolated fixtures; NEVER remove ROLLBACK.
begin;
set local lock_timeout='3s';
set local statement_timeout='30s';
set local role service_role;
do $test$
declare
 f uuid; b uuid; batch uuid; parent uuid; offer uuid; ord uuid;
 source_before jsonb; order_before jsonb; r jsonb; kind text; st text; grade text;
 tf uuid; tb uuid:=gen_random_uuid(); unlisted uuid:=gen_random_uuid(); ta uuid:=gen_random_uuid();
 baseline jsonb; scored jsonb; cscore numeric;
begin
 select id into f from public.demo_accounts where role_code='farmer' and is_enabled order by id limit 1;
 select id into b from public.demo_accounts where role_code='buyer' and is_enabled order by id limit 1;
 foreach kind in array array['auction','fixed'] loop
  batch:=gen_random_uuid(); parent:=gen_random_uuid(); offer:=gen_random_uuid();
  insert into public.demo_inventory_batches(id,farmer_account_id,batch_code,crop_name,original_quantity_kg,remaining_quantity_kg,quality_grade,status)
   values(batch,f,'P17-'||batch::text,'Onion',100,100,'C','available');
  if kind='auction' then
   insert into public.demo_auctions(id,batch_id,offered_quantity_kg,remaining_quantity_kg,reserve_price_per_kg,duration_hours,starts_at,ends_at,status)
    values(parent,batch,100,100,25,6,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '30 minutes','open');
   insert into public.demo_bids(id,auction_id,buyer_account_id,quantity_kg,price_per_kg,advance_percent,status)
    values(offer,parent,b,50,25,30,'active');
   r:=public.demo_accept_bid(f,offer,30);
  else
   insert into public.demo_fixed_price_listings(id,batch_id,offered_quantity_kg,remaining_quantity_kg,fixed_price_per_kg,starts_at,expires_at,status)
    values(parent,batch,100,100,25,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '30 minutes','active');
   insert into public.demo_purchase_requests(id,listing_id,buyer_account_id,quantity_kg,advance_percent,status)
    values(offer,parent,b,50,30,'pending');
   r:=public.demo_accept_purchase_request(f,offer,30);
  end if;
  ord:=(r->>'orderId')::uuid;
  select to_jsonb(x) into source_before from public.demo_inventory_batches x where id=batch;
  select to_jsonb(x) into order_before from public.demo_orders x where id=ord;
  if (source_before->>'remaining_quantity_kg')::numeric<>70 or source_before->>'status'<>'available' then raise exception 'Bad partial allocation %',kind; end if;
  perform public.demo_expire_marketplace(); perform public.demo_expire_marketplace();
  if kind='auction' and (select count(*) from public.demo_notifications where entity_type='auction' and entity_key=parent::text and notification_type='auction_expiring')<>1 then
   raise exception 'Missing/duplicate actionable warning'; end if;
  -- The deadline passes DURING this transaction; now() alone would be insufficient.
  if kind='auction' then update public.demo_auctions set ends_at=clock_timestamp()+interval '50 milliseconds' where id=parent;
  else update public.demo_fixed_price_listings set expires_at=clock_timestamp()+interval '50 milliseconds' where id=parent; end if;
  perform pg_sleep(0.1);
  begin
   if kind='auction' then perform public.demo_accept_bid(f,offer,10);
   else perform public.demo_accept_purchase_request(f,offer,10); end if;
   raise exception 'Expired partial acceptance succeeded %',kind;
  exception when others then
   if sqlerrm<>(case when kind='auction' then 'AUCTION_NOT_ACCEPTABLE' else 'LISTING_NOT_ACCEPTABLE' end) then raise; end if;
  end;
  -- Also reject an unswept open/active parent.
  if kind='auction' then update public.demo_auctions set status='open' where id=parent;
  else update public.demo_fixed_price_listings set status='active' where id=parent; end if;
  begin
   if kind='auction' then perform public.demo_accept_bid(f,offer,10);
   else perform public.demo_accept_purchase_request(f,offer,10); end if;
   raise exception 'Expired active acceptance succeeded %',kind;
  exception when others then
   if sqlerrm<>(case when kind='auction' then 'AUCTION_NOT_ACCEPTABLE' else 'LISTING_NOT_ACCEPTABLE' end) then raise; end if;
  end;
  if kind='auction' then update public.demo_auctions set status='partially_sold' where id=parent;
  else update public.demo_fixed_price_listings set status='partially_sold' where id=parent; end if;
  perform public.demo_expire_marketplace(); perform public.demo_expire_marketplace();
  if kind='auction' then
   if (select status from public.demo_auctions where id=parent)<>'expired' or (select status from public.demo_bids where id=offer)<>'expired' then raise exception 'Auction remainder not expired'; end if;
   if (select count(*) from public.demo_notifications where entity_type='auction' and entity_key=parent::text and notification_type='auction_expired' and data->>'auctionId'=parent::text)<>1 then raise exception 'Missing/duplicate expiry deep link'; end if;
  else
   if (select status from public.demo_fixed_price_listings where id=parent)<>'expired' or (select status from public.demo_purchase_requests where id=offer)<>'expired' then raise exception 'Fixed remainder not expired'; end if;
  end if;
  if (select to_jsonb(x) from public.demo_orders x where id=ord)<>order_before then raise exception 'Accepted order altered by expiry'; end if;
  if (select to_jsonb(x) from public.demo_inventory_batches x where id=batch)<>source_before then raise exception 'Source altered by expiry'; end if;
  -- Existing production relisting RPC must accept the unsold remainder.
  if kind='auction' then perform public.demo_create_auction(f,batch,70,25,6);
  else perform public.demo_create_fixed_listing(f,batch,70,25); end if;
 end loop;

 -- No bids means no actionable warning; open expiry still emits exactly one notification.
 batch:=gen_random_uuid(); parent:=gen_random_uuid();
 insert into public.demo_inventory_batches(id,farmer_account_id,batch_code,crop_name,original_quantity_kg,remaining_quantity_kg,quality_grade,status)
  values(batch,f,'P17-'||batch::text,'Potato',100,100,'A','available');
 insert into public.demo_auctions(id,batch_id,offered_quantity_kg,remaining_quantity_kg,reserve_price_per_kg,duration_hours,starts_at,ends_at,status)
  values(parent,batch,100,100,25,6,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '30 minutes','open');
 perform public.demo_expire_marketplace();
 if exists(select 1 from public.demo_notifications where entity_key=parent::text and notification_type='auction_expiring') then raise exception 'No-bid warning'; end if;
 update public.demo_auctions set ends_at=clock_timestamp()-interval '1 second' where id=parent;
 perform public.demo_expire_marketplace(); perform public.demo_expire_marketplace();
 if (select status from public.demo_auctions where id=parent)<>'expired' or
  (select count(*) from public.demo_notifications where entity_key=parent::text and notification_type='auction_expired')<>1 then raise exception 'Open expiry failed'; end if;

 -- Fully accepted offers have no actionable remainder even when the parent has stock.
 foreach kind in array array['auction','fixed'] loop
  batch:=gen_random_uuid(); parent:=gen_random_uuid(); offer:=gen_random_uuid();
  insert into public.demo_inventory_batches(id,farmer_account_id,batch_code,crop_name,original_quantity_kg,remaining_quantity_kg,quality_grade,status)
   values(batch,f,'P17-'||batch::text,'Onion',100,100,'C','available');
  if kind='auction' then
   insert into public.demo_auctions(id,batch_id,offered_quantity_kg,remaining_quantity_kg,reserve_price_per_kg,duration_hours,starts_at,ends_at,status)
    values(parent,batch,100,100,25,6,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '30 minutes','open');
   insert into public.demo_bids(id,auction_id,buyer_account_id,quantity_kg,price_per_kg,advance_percent,status)
    values(offer,parent,b,30,25,30,'active');
   r:=public.demo_accept_bid(f,offer,30);
  else
   insert into public.demo_fixed_price_listings(id,batch_id,offered_quantity_kg,remaining_quantity_kg,fixed_price_per_kg,starts_at,expires_at,status)
    values(parent,batch,100,100,25,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '30 minutes','active');
   insert into public.demo_purchase_requests(id,listing_id,buyer_account_id,quantity_kg,advance_percent,status)
    values(offer,parent,b,30,30,'pending');
   r:=public.demo_accept_purchase_request(f,offer,30);
  end if;
  ord:=(r->>'orderId')::uuid;
  select to_jsonb(x) into order_before from public.demo_orders x where id=ord;
  perform public.demo_expire_marketplace();
  if exists(select 1 from public.demo_notifications where entity_key=parent::text and notification_type='auction_expiring') then raise exception 'Fully allocated offer warning'; end if;
  if kind='auction' then update public.demo_auctions set ends_at=clock_timestamp()-interval '1 second',status='open' where id=parent;
  else update public.demo_fixed_price_listings set expires_at=clock_timestamp()-interval '1 second',status='active' where id=parent; end if;
  perform public.demo_expire_marketplace();
  if kind='auction' then
   if (select status from public.demo_auctions where id=parent)<>'expired' or (select status from public.demo_bids where id=offer)<>'accepted' then raise exception 'Accepted bid invalidated'; end if;
  else
   if (select status from public.demo_fixed_price_listings where id=parent)<>'expired' or (select status from public.demo_purchase_requests where id=offer)<>'accepted' then raise exception 'Accepted request invalidated'; end if;
  end if;
  if (select to_jsonb(x) from public.demo_orders x where id=ord)<>order_before then raise exception 'Fully accepted order invalidated'; end if;
 end loop;

 -- Choose an existing enabled farmer with no inventory; all added records roll back.
 select a.id into tf from public.demo_accounts a where role_code='farmer' and is_enabled
  and not exists(select 1 from public.demo_inventory_batches x where x.farmer_account_id=a.id) order by id limit 1;
 if tf is null then raise exception 'Isolated trust account unavailable'; end if;
 baseline:=public.demo_recalculate_trust(tf);
 insert into public.demo_inventory_batches(id,farmer_account_id,batch_code,crop_name,original_quantity_kg,remaining_quantity_kg,quality_grade,status)
  values(unlisted,tf,'P17-'||unlisted::text,'Tomato',100,100,null,'available');
 scored:=public.demo_recalculate_trust(tf);
 if scored<>baseline or (select quality_consistency_score from public.demo_trust_scores where account_id=tf) is not null then raise exception 'Unlisted null grade changes trust'; end if;
 insert into public.demo_inventory_batches(id,farmer_account_id,batch_code,crop_name,original_quantity_kg,remaining_quantity_kg,quality_grade,quality_source,status)
  values(tb,tf,'P17-'||tb::text,'Onion',100,100,'C','farmer_declared','available');
 insert into public.demo_auctions(id,batch_id,offered_quantity_kg,remaining_quantity_kg,reserve_price_per_kg,duration_hours,starts_at,ends_at,status)
  values(ta,tb,100,100,25,6,clock_timestamp(),clock_timestamp()+interval '6 hours','open');
 foreach grade in array array['C','A','B'] loop
  update public.demo_inventory_batches set quality_grade=grade where id=tb;
  scored:=public.demo_recalculate_trust(tf);
  if (select quality_consistency_score from public.demo_trust_scores where account_id=tf)<>100 then raise exception 'Grade penalized %',grade; end if;
  if cscore is not null and (scored->>'score')::numeric<>cscore then raise exception 'Grade changes score'; end if;
  cscore:=(scored->>'score')::numeric;
 end loop;
 -- Enter the previously unlisted null-grade batch into authoritative listing scope.
 insert into public.demo_fixed_price_listings(batch_id,offered_quantity_kg,remaining_quantity_kg,fixed_price_per_kg,expires_at,status)
  values(unlisted,100,100,25,clock_timestamp()+interval '6 hours','active');
 perform public.demo_recalculate_trust(tf);
 if (select quality_consistency_score from public.demo_trust_scores where account_id=tf)<>50 then raise exception 'Listed undeclared produce absent from denominator'; end if;
 -- A second listing relationship for the same declared batch must not double count it.
 insert into public.demo_fixed_price_listings(batch_id,offered_quantity_kg,remaining_quantity_kg,fixed_price_per_kg,expires_at,status)
  values(tb,100,100,25,clock_timestamp()+interval '6 hours','expired');
 perform public.demo_recalculate_trust(tf);
 if (select quality_consistency_score from public.demo_trust_scores where account_id=tf)<>50 then raise exception 'Duplicate listing inflated declaration denominator'; end if;
end;
$test$;
select 'PASS: atomic auction/fixed deadlines, partial expiry, notifications, relisting and declaration trust' as validation;
rollback;
