-- Isolated live fixtures: always roll back. Never reset or seed retained data.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';
SET LOCAL ROLE service_role;
DO $test$
DECLARE
 f uuid; buyers uuid[]; b uuid; batch uuid; a uuid; bid uuid; old_bid uuid; r jsonb;
 on_batch uuid; on_a uuid; on_bid uuid; fixed_batch uuid; fixed_id uuid; req uuid;
 before_batch jsonb; before_orders bigint; before_bids bigint;
BEGIN
 SELECT id INTO f FROM public.demo_accounts WHERE role_code='farmer' AND is_enabled ORDER BY id LIMIT 1;
 SELECT array_agg(a.id ORDER BY a.id) INTO buyers FROM public.demo_accounts a
 JOIN public.demo_buyer_profiles p ON p.account_id=a.id
 WHERE a.role_code='buyer' AND a.is_enabled AND p.verification_status='verified';
 IF array_length(buyers,1)<3 THEN RAISE EXCEPTION 'Need three existing verified Buyers'; END IF;

 -- Existing/default rows and the old five-argument call retain ON behavior.
 on_batch:=gen_random_uuid();
 INSERT INTO public.demo_inventory_batches(id,farmer_account_id,batch_code,crop_name,original_quantity_kg,remaining_quantity_kg,quality_grade,status)
 VALUES(on_batch,f,'P19-'||on_batch,'Tomato',20,20,'A','available');
 r:=public.demo_create_auction(f,on_batch,10,20,6); on_a:=(r->>'auctionId')::uuid;
 IF NOT (SELECT allow_partial_sale FROM public.demo_auctions WHERE id=on_a) THEN RAISE EXCEPTION 'Default is not ON'; END IF;
 r:=public.demo_place_or_revise_bid(buyers[1],on_a,4,20,30,'Rollback fixture',18,73); on_bid:=(r->>'bidId')::uuid;
 r:=public.demo_accept_bid(f,on_bid,2);
 IF (r->>'acceptedQuantityKg')::numeric<>2
 OR (SELECT remaining_quantity_kg FROM public.demo_auctions WHERE id=on_a)<>8
 OR (SELECT status FROM public.demo_auctions WHERE id=on_a)<>'partially_sold'
 OR (SELECT status FROM public.demo_bids WHERE id=on_bid)<>'partially_accepted'
 OR (SELECT remaining_quantity_kg FROM public.demo_inventory_batches WHERE id=on_batch)<>18 THEN RAISE EXCEPTION 'ON partial regression'; END IF;
 -- Preserve the observed baseline re-entry limitation (not implemented in starting HEAD).
 BEGIN
  PERFORM public.demo_place_or_revise_bid(buyers[1],on_a,2,21,30,'Rollback fixture',18,73);
  RAISE EXCEPTION 'Unexpected change to baseline re-entry';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'AUCTION_NOT_OPEN' THEN RAISE; END IF; END;

 batch:=gen_random_uuid();
 INSERT INTO public.demo_inventory_batches(id,farmer_account_id,batch_code,crop_name,original_quantity_kg,remaining_quantity_kg,quality_grade,status)
 VALUES(batch,f,'P19-'||batch,'Tomato',20,20,'C','available');
 BEGIN
  PERFORM public.demo_create_auction(f,batch,10,20,6,null);
  RAISE EXCEPTION 'Null policy accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'INVALID_INPUT' THEN RAISE; END IF; END;
 r:=public.demo_create_auction(f,batch,10,20,6,false); a:=(r->>'auctionId')::uuid;
 IF (SELECT allow_partial_sale FROM public.demo_auctions WHERE id=a) IS DISTINCT FROM false THEN RAISE EXCEPTION 'OFF not persisted'; END IF;
 SELECT count(*) INTO before_bids FROM public.demo_bids WHERE auction_id=a;
 BEGIN
  PERFORM public.demo_place_or_revise_bid(buyers[1],a,5,20,30,'Rollback fixture',18,73);
  RAISE EXCEPTION 'Partial bid accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'FULL_LOT_REQUIRED' THEN RAISE; END IF; END;
 IF (SELECT count(*) FROM public.demo_bids WHERE auction_id=a)<>before_bids THEN RAISE EXCEPTION 'Rejected bid inserted'; END IF;
 FOREACH b IN ARRAY buyers LOOP
  r:=public.demo_place_or_revise_bid(b,a,10,20+array_position(buyers,b),30,'Rollback fixture',18,73);
 END LOOP;
 IF (SELECT count(*) FROM public.demo_bids WHERE auction_id=a AND status='active')<>array_length(buyers,1)
 OR (SELECT status FROM public.demo_auctions WHERE id=a)<>'open' THEN RAISE EXCEPTION 'Competing bids failed'; END IF;
 SELECT id INTO old_bid FROM public.demo_bids WHERE auction_id=a AND buyer_account_id=buyers[1] AND status='active';
 r:=public.demo_place_or_revise_bid(buyers[1],a,10,25,40,'Revised fixture',19,74); bid:=(r->>'bidId')::uuid;
 IF (SELECT status FROM public.demo_bids WHERE id=old_bid)<>'replaced'
 OR (SELECT replaced_bid_id FROM public.demo_bids WHERE id=bid)<>old_bid
 OR (SELECT advance_percent FROM public.demo_bids WHERE id=bid)<>40 THEN RAISE EXCEPTION 'Revision history failed'; END IF;
 BEGIN
  PERFORM public.demo_place_or_revise_bid(buyers[1],a,5,26,40,'Rollback fixture',18,73);
  RAISE EXCEPTION 'Partial revision accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'FULL_LOT_REQUIRED' THEN RAISE; END IF; END;
 IF (SELECT status FROM public.demo_bids WHERE id=bid)<>'active' THEN RAISE EXCEPTION 'Invalid revision changed old bid'; END IF;
 SELECT to_jsonb(x) INTO before_batch FROM public.demo_inventory_batches x WHERE id=batch;
 SELECT count(*) INTO before_orders FROM public.demo_orders WHERE auction_id=a;
 BEGIN
  PERFORM public.demo_accept_bid(f,bid,5);
  RAISE EXCEPTION 'Partial acceptance accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'FULL_LOT_REQUIRED' THEN RAISE; END IF; END;
 IF (SELECT count(*) FROM public.demo_orders WHERE auction_id=a)<>before_orders
 OR (SELECT to_jsonb(x) FROM public.demo_inventory_batches x WHERE id=batch)<>before_batch
 OR (SELECT remaining_quantity_kg FROM public.demo_auctions WHERE id=a)<>10 THEN RAISE EXCEPTION 'Rejected acceptance mutated allocation'; END IF;
 BEGIN
  UPDATE public.demo_auctions SET allow_partial_sale=true WHERE id=a;
  RAISE EXCEPTION 'OFF changed to ON';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'AUCTION_PARTIAL_SALE_IMMUTABLE' THEN RAISE; END IF; END;
 BEGIN
  UPDATE public.demo_auctions SET allow_partial_sale=false WHERE id=on_a;
  RAISE EXCEPTION 'ON changed to OFF';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'AUCTION_PARTIAL_SALE_IMMUTABLE' THEN RAISE; END IF; END;
 -- Farmer deliberately chooses a lower-priced competitor.
 SELECT id INTO bid FROM public.demo_bids WHERE auction_id=a AND buyer_account_id=buyers[2] AND status='active';
 r:=public.demo_accept_bid(f,bid,10);
 IF (r->>'acceptedQuantityKg')::numeric<>10
 OR (SELECT allocated_quantity_kg FROM public.demo_orders WHERE id=(r->>'orderId')::uuid)<>10
 OR (SELECT remaining_quantity_kg FROM public.demo_auctions WHERE id=a)<>0
 OR (SELECT status FROM public.demo_auctions WHERE id=a)<>'completed'
 OR (SELECT remaining_quantity_kg FROM public.demo_inventory_batches WHERE id=batch)<>10 THEN RAISE EXCEPTION 'Full allocation failed'; END IF;
 BEGIN
  PERFORM public.demo_place_or_revise_bid(buyers[3],a,10,30,30,'Rollback fixture',18,73);
  RAISE EXCEPTION 'Sold lot accepted bid';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'AUCTION_NOT_OPEN' THEN RAISE; END IF; END;
 -- New OFF lot: a deadline passing inside the transaction still blocks bid/accept.
 r:=public.demo_create_auction(f,batch,10,20,6,false); a:=(r->>'auctionId')::uuid;
 r:=public.demo_place_or_revise_bid(buyers[1],a,10,20,30,'Rollback fixture',18,73); bid:=(r->>'bidId')::uuid;
 UPDATE public.demo_auctions SET ends_at=clock_timestamp()+interval '30 milliseconds' WHERE id=a;
 PERFORM pg_sleep(0.06);
 BEGIN
  PERFORM public.demo_place_or_revise_bid(buyers[2],a,10,22,30,'Rollback fixture',18,73);
  RAISE EXCEPTION 'Late full bid accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'AUCTION_NOT_OPEN' THEN RAISE; END IF; END;
 BEGIN
  PERFORM public.demo_accept_bid(f,bid,10);
  RAISE EXCEPTION 'Late acceptance succeeded';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'AUCTION_NOT_ACCEPTABLE' THEN RAISE; END IF; END;
 PERFORM public.demo_expire_marketplace();
 IF (SELECT status FROM public.demo_auctions WHERE id=a)<>'expired' THEN RAISE EXCEPTION 'OFF expiry failed'; END IF;

 -- Fixed Price still permits partial quantities and acceptance.
 fixed_batch:=gen_random_uuid();
 INSERT INTO public.demo_inventory_batches(id,farmer_account_id,batch_code,crop_name,original_quantity_kg,remaining_quantity_kg,quality_grade,status)
 VALUES(fixed_batch,f,'P19-'||fixed_batch,'Onion',20,20,'B','available');
 r:=public.demo_create_fixed_listing(f,fixed_batch,10,20); fixed_id:=(r->>'listingId')::uuid;
 r:=public.demo_create_purchase_request(buyers[1],fixed_id,4,30,'Rollback fixture',18,73); req:=(r->>'requestId')::uuid;
 r:=public.demo_accept_purchase_request(f,req,2);
 IF (r->>'acceptedQuantityKg')::numeric<>2
 OR (SELECT remaining_quantity_kg FROM public.demo_fixed_price_listings WHERE id=fixed_id)<>8 THEN RAISE EXCEPTION 'Fixed Price regression'; END IF;
END;
$test$;
SELECT 'PASS: default ON, OFF, competing bids, revisions, strict full allocation, immutable policy, expiry, Fixed Price; baseline re-entry limitation preserved' AS result;
ROLLBACK;
