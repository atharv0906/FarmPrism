import type { RequestHandler, Router } from 'express';
import { requireDemoSession, requireDemoRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { commands, createMutationService } from '../services/mutation.service.js';
import type { MutationResults } from '../types/mutations.js';
import { ApiError } from '../utils/apiError.js';

export const mutationRoutes: Array<{ path: string; command: keyof MutationResults; id?: string }> = [
  { path: '/api/farmer/batches/:batchId/quality', command: 'setBatchQuality', id: 'batchId' },
  { path: '/api/farmer/auctions', command: 'createAuction' },
  { path: '/api/farmer/auctions/:auctionId/close', command: 'closeAuction', id: 'auctionId' },
  { path: '/api/farmer/fixed-listings', command: 'createFixedListing' },
  { path: '/api/farmer/fixed-listings/:listingId/close', command: 'closeFixedListing', id: 'listingId' },
  { path: '/api/buyer/auctions/:auctionId/bids', command: 'placeOrReviseBid', id: 'auctionId' },
  { path: '/api/buyer/bids/:bidId/withdraw', command: 'withdrawBid', id: 'bidId' },
  { path: '/api/buyer/fixed-listings/:listingId/requests', command: 'createPurchaseRequest', id: 'listingId' },
  { path: '/api/buyer/purchase-requests/:requestId/withdraw', command: 'withdrawPurchaseRequest', id: 'requestId' },
  { path: '/api/farmer/bids/:bidId/accept', command: 'acceptBid', id: 'bidId' },
  { path: '/api/farmer/bids/:bidId/reject', command: 'rejectBid', id: 'bidId' },
  { path: '/api/farmer/purchase-requests/:requestId/accept', command: 'acceptPurchaseRequest', id: 'requestId' },
  { path: '/api/farmer/purchase-requests/:requestId/reject', command: 'rejectPurchaseRequest', id: 'requestId' },
  { path: '/api/buyer/orders/:orderId/pay-farmer-advance', command: 'payFarmerAdvance', id: 'orderId' },
  { path: '/api/logistics/jobs/:jobId/claim', command: 'claimLogisticsJob', id: 'jobId' },
  { path: '/api/logistics/jobs/:jobId/fee', command: 'proposeLogisticsFee', id: 'jobId' },
  { path: '/api/buyer/logistics-jobs/:jobId/fee-response', command: 'respondLogisticsFee', id: 'jobId' },
  { path: '/api/buyer/orders/:orderId/pay-logistics-advance', command: 'payLogisticsAdvance', id: 'orderId' },
  { path: '/api/logistics/jobs/:jobId/pickup', command: 'confirmPickup', id: 'jobId' },
  { path: '/api/logistics/jobs/:jobId/location', command: 'updateTracking', id: 'jobId' },
  { path: '/api/buyer/orders/:orderId/delivery-otp', command: 'generateDeliveryOtp', id: 'orderId' },
  { path: '/api/logistics/orders/:orderId/verify-delivery', command: 'verifyDeliveryOtp', id: 'orderId' },
  { path: '/api/buyer/orders/:orderId/pay-final-balances', command: 'payFinalBalances', id: 'orderId' },
  { path: '/api/orders/:orderId/feedback', command: 'submitFeedback', id: 'orderId' },
  { path: '/api/orders/:orderId/disputes', command: 'raiseDispute', id: 'orderId' },
];

// Dependencies are injectable for tests; production always uses persisted demo sessions and RPCs.
export function registerMutationRoutes(router: Router, service = createMutationService(), authenticate: RequestHandler = requireDemoSession) {
  for (const route of mutationRoutes) {
    const role = commands[route.command].role;
    router.post(route.path, authenticate, ...(role ? [requireDemoRole(role)] : []), (req: AuthenticatedRequest, res, next) => {
      void (async () => {
        if (!req.demoSession) throw new ApiError(401, 'invalid_session', 'Missing or invalid demo session.');
        const result = await service.execute(route.command, req.demoSession, route.id ? req.params[route.id] : undefined, req.body);
        res.setHeader('Cache-Control', 'no-store');
        res.json({ data: result });
      })().catch(next);
    });
  }
}
