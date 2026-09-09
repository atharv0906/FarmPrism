import type { DemoRole } from '../types/domain.js';
import type { MutationResults, OrderContract } from '../types/mutations.js';
import { executeRpc, readCreatedOrder, type RpcExecutor, type RpcArguments } from '../repositories/mutation.repository.js';
import { ApiError } from '../utils/apiError.js';
import * as v from '../utils/mutationValidation.js';

type Actor = { accountId: string; role: DemoRole };
type Command = {
  role: DemoRole | null;
  rpc: string;
  params: (actor: Actor, id: unknown, body: unknown) => RpcArguments;
};

// Each command validates only API input. All state transitions stay inside its one RPC.
export const commands: Record<keyof MutationResults, Command> = {
  createAuction: {
    role: 'farmer', rpc: 'demo_create_auction',
    params: (actor, id, body) => {
      const input = v.object(body ?? {}, ['batchId', 'quantityKg', 'reservePricePerKg', 'durationHours']);
      return {
        p_farmer_account_id: v.uuid(actor.accountId),
        p_batch_id: v.uuid(input.batchId),
        p_quantity_kg: v.positive(input.quantityKg),
        p_reserve_price_per_kg: v.positive(input.reservePricePerKg),
        p_duration_hours: v.duration(input.durationHours),
      };
    },
  },
  closeAuction: {
    role: 'farmer', rpc: 'demo_close_auction',
    params: (actor, id, body) => {
      v.object(body ?? {}, []);
      return {
        p_farmer_account_id: v.uuid(actor.accountId),
        p_auction_id: v.uuid(id),
      };
    },
  },
  createFixedListing: {
    role: 'farmer', rpc: 'demo_create_fixed_listing',
    params: (actor, id, body) => {
      const input = v.object(body ?? {}, ['batchId', 'quantityKg', 'fixedPricePerKg']);
      return {
        p_farmer_account_id: v.uuid(actor.accountId),
        p_batch_id: v.uuid(input.batchId),
        p_quantity_kg: v.positive(input.quantityKg),
        p_fixed_price_per_kg: v.positive(input.fixedPricePerKg),
      };
    },
  },
  closeFixedListing: {
    role: 'farmer', rpc: 'demo_close_fixed_listing',
    params: (actor, id, body) => {
      v.object(body ?? {}, []);
      return {
        p_farmer_account_id: v.uuid(actor.accountId),
        p_listing_id: v.uuid(id),
      };
    },
  },
  placeOrReviseBid: {
    role: 'buyer', rpc: 'demo_place_or_revise_bid',
    params: (actor, id, body) => {
      const input = v.object(body ?? {}, ['quantityKg', 'pricePerKg', 'advancePercent', 'delivery']);
      return {
        p_buyer_account_id: v.uuid(actor.accountId),
        p_auction_id: v.uuid(id),
        p_quantity_kg: v.positive(input.quantityKg),
        p_price_per_kg: v.positive(input.pricePerKg),
        p_advance_percent: v.number(input.advancePercent, 10, 90),
        ...v.delivery(input.delivery),
      };
    },
  },
  withdrawBid: {
    role: 'buyer', rpc: 'demo_withdraw_bid',
    params: (actor, id, body) => {
      v.object(body ?? {}, []);
      return {
        p_buyer_account_id: v.uuid(actor.accountId),
        p_bid_id: v.uuid(id),
      };
    },
  },
  createPurchaseRequest: {
    role: 'buyer', rpc: 'demo_create_purchase_request',
    params: (actor, id, body) => {
      const input = v.object(body ?? {}, ['quantityKg', 'advancePercent', 'delivery']);
      return {
        p_buyer_account_id: v.uuid(actor.accountId),
        p_listing_id: v.uuid(id),
        p_quantity_kg: v.positive(input.quantityKg),
        p_advance_percent: v.number(input.advancePercent, 10, 90),
        ...v.delivery(input.delivery),
      };
    },
  },
  withdrawPurchaseRequest: {
    role: 'buyer', rpc: 'demo_withdraw_purchase_request',
    params: (actor, id, body) => {
      v.object(body ?? {}, []);
      return {
        p_buyer_account_id: v.uuid(actor.accountId),
        p_request_id: v.uuid(id),
      };
    },
  },
  acceptBid: {
    role: 'farmer', rpc: 'demo_accept_bid',
    params: (actor, id, body) => {
      const input = v.object(body ?? {}, ['quantityKg']);
      return {
        p_farmer_account_id: v.uuid(actor.accountId),
        p_bid_id: v.uuid(id),
        p_accept_quantity_kg: v.positive(input.quantityKg),
      };
    },
  },
  acceptPurchaseRequest: {
    role: 'farmer', rpc: 'demo_accept_purchase_request',
    params: (actor, id, body) => {
      const input = v.object(body ?? {}, ['quantityKg']);
      return {
        p_farmer_account_id: v.uuid(actor.accountId),
        p_request_id: v.uuid(id),
        p_accept_quantity_kg: v.positive(input.quantityKg),
      };
    },
  },
  payFarmerAdvance: {
    role: 'buyer', rpc: 'demo_pay_farmer_advance',
    params: (actor, id, body) => {
      v.object(body ?? {}, []);
      return {
        p_buyer_account_id: v.uuid(actor.accountId),
        p_order_id: v.uuid(id),
      };
    },
  },
  claimLogisticsJob: {
    role: 'logistics', rpc: 'demo_claim_logistics_job',
    params: (actor, id, body) => {
      v.object(body ?? {}, []);
      return {
        p_logistics_account_id: v.uuid(actor.accountId),
        p_job_id: v.uuid(id),
      };
    },
  },
  proposeLogisticsFee: {
    role: 'logistics', rpc: 'demo_propose_logistics_fee',
    params: (actor, id, body) => {
      const input = v.object(body ?? {}, ['fee']);
      return {
        p_logistics_account_id: v.uuid(actor.accountId),
        p_job_id: v.uuid(id),
        p_fee: v.positive(input.fee),
      };
    },
  },
  respondLogisticsFee: {
    role: 'buyer', rpc: 'demo_respond_logistics_fee',
    params: (actor, id, body) => {
      const input = v.object(body ?? {}, ['accept']);
      return {
        p_buyer_account_id: v.uuid(actor.accountId),
        p_job_id: v.uuid(id),
        p_accept: v.boolean(input.accept),
      };
    },
  },
  payLogisticsAdvance: {
    role: 'buyer', rpc: 'demo_pay_logistics_advance',
    params: (actor, id, body) => {
      v.object(body ?? {}, []);
      return {
        p_buyer_account_id: v.uuid(actor.accountId),
        p_order_id: v.uuid(id),
      };
    },
  },
  confirmPickup: {
    role: 'logistics', rpc: 'demo_confirm_pickup',
    params: (actor, id, body) => {
      v.object(body ?? {}, []);
      return {
        p_logistics_account_id: v.uuid(actor.accountId),
        p_job_id: v.uuid(id),
      };
    },
  },
  updateTracking: {
    role: 'logistics', rpc: 'demo_update_tracking',
    params: (actor, id, body) => {
      const input = v.object(body ?? {}, ['latitude', 'longitude', 'source']);
      return {
        p_logistics_account_id: v.uuid(actor.accountId),
        p_job_id: v.uuid(id),
        p_latitude: v.number(input.latitude, -90, 90),
        p_longitude: v.number(input.longitude, -180, 180),
        p_source: v.source(input.source),
      };
    },
  },
  generateDeliveryOtp: {
    role: 'buyer', rpc: 'demo_generate_delivery_otp',
    params: (actor, id, body) => {
      v.object(body ?? {}, []);
      return {
        p_buyer_account_id: v.uuid(actor.accountId),
        p_order_id: v.uuid(id),
      };
    },
  },
  verifyDeliveryOtp: {
    role: 'logistics', rpc: 'demo_verify_delivery_otp',
    params: (actor, id, body) => {
      const input = v.object(body ?? {}, ['otp']);
      return {
        p_logistics_account_id: v.uuid(actor.accountId),
        p_order_id: v.uuid(id),
        p_otp: v.otp(input.otp),
      };
    },
  },
  payFinalBalances: {
    role: 'buyer', rpc: 'demo_pay_final_balances',
    params: (actor, id, body) => {
      v.object(body ?? {}, []);
      return {
        p_buyer_account_id: v.uuid(actor.accountId),
        p_order_id: v.uuid(id),
      };
    },
  },
  submitFeedback: {
    role: null, rpc: 'demo_submit_feedback',
    params: (actor, id, body) => {
      const input = v.object(body ?? {}, ['toAccountId', 'rating', 'comment']);
      return {
        p_from_account_id: v.uuid(actor.accountId),
        p_order_id: v.uuid(id),
        p_to_account_id: v.uuid(input.toAccountId),
        p_rating: v.rating(input.rating),
        p_comment: v.nullableText(input.comment),
      };
    },
  },
  raiseDispute: {
    role: null, rpc: 'demo_raise_dispute',
    params: (actor, id, body) => {
      const input = v.object(body ?? {}, ['againstAccountId', 'reason', 'description']);
      return {
        p_from_account_id: v.uuid(actor.accountId),
        p_order_id: v.uuid(id),
        p_against_account_id: input.againstAccountId === null ? null : v.uuid(input.againstAccountId),
        p_reason: v.text(input.reason),
        p_description: v.nullableText(input.description),
      };
    },
  },
};

export function createMutationService(
  rpc: RpcExecutor = executeRpc,
  readOrder: (id: string) => Promise<OrderContract> = readCreatedOrder,
) {
  return {
    async execute<K extends keyof MutationResults>(command: K, actor: Actor, id: unknown, body: unknown): Promise<MutationResults[K]> {
      const definition = commands[command];
      if (!actor.accountId) throw new ApiError(401, 'invalid_session', 'Missing or invalid demo session.');
      if (definition.role && definition.role !== actor.role) throw new ApiError(403, 'FORBIDDEN', 'This action is not allowed.');
      const args = definition.params(actor, id, body);
      const raw = await rpc(definition.rpc, args);
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new ApiError(500, 'server_error', 'Invalid server response.');
      // Only fields in the verified RPC response contract are exposed.
      const result: Record<string, unknown> = {};
      for (const key of responseFields[command]) {
        const value = (raw as Record<string, unknown>)[key];
        const expected = numericFields.has(key) ? 'number' : booleanFields.has(key) ? 'boolean' : 'string';
        if (typeof value !== expected || (typeof value === 'number' && !Number.isFinite(value))) {
          throw new ApiError(500, 'server_error', 'Invalid server response.');
        }
        result[key] = value;
      }
      if (command === 'acceptBid' || command === 'acceptPurchaseRequest') {
        if (typeof result.orderId !== 'string') throw new ApiError(500, 'server_error', 'Invalid server response.');
        result.order = await readOrder(result.orderId);
      }
      if (command === 'payFarmerAdvance' || command === 'payLogisticsAdvance' || command === 'payFinalBalances') result.simulated = true;
      return result as MutationResults[K];
    },
  };
}

const numericFields = new Set(['acceptedQuantityKg', 'totalAmount', 'amount', 'fee', 'farmerBalance', 'logisticsBalance', 'rating']);
const booleanFields = new Set(['revised', 'accepted']);

const responseFields: Record<keyof MutationResults, readonly string[]> = {
  createAuction: ['auctionId', 'status'],
  closeAuction: ['auctionId', 'status'],
  createFixedListing: ['listingId', 'status', 'expiresAt'],
  closeFixedListing: ['listingId', 'status'],
  placeOrReviseBid: ['bidId', 'status', 'revised'],
  withdrawBid: ['bidId', 'status'],
  createPurchaseRequest: ['requestId', 'status'],
  withdrawPurchaseRequest: ['requestId', 'status'],
  acceptBid: ['orderId', 'orderCode', 'status', 'acceptedQuantityKg', 'totalAmount'],
  acceptPurchaseRequest: ['orderId', 'orderCode', 'status', 'acceptedQuantityKg', 'totalAmount'],
  payFarmerAdvance: ['orderId', 'paymentId', 'amount', 'status'],
  claimLogisticsJob: ['jobId', 'orderId', 'status'],
  proposeLogisticsFee: ['jobId', 'fee', 'feeStatus'],
  respondLogisticsFee: ['jobId', 'accepted', 'status'],
  payLogisticsAdvance: ['orderId', 'amount', 'status'],
  confirmPickup: ['jobId', 'orderId', 'status'],
  updateTracking: ['trackingPointId', 'jobId', 'source'],
  generateDeliveryOtp: ['orderId', 'otp', 'expiresAt'],
  verifyDeliveryOtp: ['orderId', 'status'],
  payFinalBalances: ['orderId', 'status', 'farmerBalance', 'logisticsBalance'],
  submitFeedback: ['orderId', 'toAccountId', 'rating'],
  raiseDispute: ['disputeId', 'orderId', 'status'],
};
