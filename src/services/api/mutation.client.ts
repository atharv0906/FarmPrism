import { apiClient } from './api.client';
import type { ApiSuccessEnvelope } from './api.types';
import type * as T from './mutation.types';

type Options = { bearerToken: string; headers?: Record<string, string> };

// Methods only: screen integration and session-token lifecycle remain outside this phase.
export const marketplaceMutations = {
  setBatchQuality(batchId: string, body: T.SetBatchQualityInput, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['setBatchQuality']>>(`/api/farmer/batches/${encodeURIComponent(batchId)}/quality`, body, options);
  },
  createAuction(body: T.CreateAuctionInput, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['createAuction']>>(`/api/farmer/auctions`, body, options);
  },
  closeAuction(auctionId: string, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['closeAuction']>>(`/api/farmer/auctions/${encodeURIComponent(auctionId)}/close`, {}, options);
  },
  createFixedListing(body: T.CreateFixedListingInput, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['createFixedListing']>>(`/api/farmer/fixed-listings`, body, options);
  },
  closeFixedListing(listingId: string, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['closeFixedListing']>>(`/api/farmer/fixed-listings/${encodeURIComponent(listingId)}/close`, {}, options);
  },
  placeOrReviseBid(auctionId: string, body: T.BidInput, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['placeOrReviseBid']>>(`/api/buyer/auctions/${encodeURIComponent(auctionId)}/bids`, body, options);
  },
  withdrawBid(bidId: string, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['withdrawBid']>>(`/api/buyer/bids/${encodeURIComponent(bidId)}/withdraw`, {}, options);
  },
  createPurchaseRequest(listingId: string, body: T.PurchaseRequestInput, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['createPurchaseRequest']>>(`/api/buyer/fixed-listings/${encodeURIComponent(listingId)}/requests`, body, options);
  },
  withdrawPurchaseRequest(requestId: string, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['withdrawPurchaseRequest']>>(`/api/buyer/purchase-requests/${encodeURIComponent(requestId)}/withdraw`, {}, options);
  },
  acceptBid(bidId: string, body: T.AcceptInput, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['acceptBid']>>(`/api/farmer/bids/${encodeURIComponent(bidId)}/accept`, body, options);
  },
  rejectBid(bidId: string, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['rejectBid']>>(`/api/farmer/bids/${encodeURIComponent(bidId)}/reject`, {}, options);
  },
  acceptPurchaseRequest(requestId: string, body: T.AcceptInput, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['acceptPurchaseRequest']>>(`/api/farmer/purchase-requests/${encodeURIComponent(requestId)}/accept`, body, options);
  },
  rejectPurchaseRequest(requestId: string, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['rejectPurchaseRequest']>>(`/api/farmer/purchase-requests/${encodeURIComponent(requestId)}/reject`, {}, options);
  },
  payFarmerAdvance(orderId: string, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['payFarmerAdvance']>>(`/api/buyer/orders/${encodeURIComponent(orderId)}/pay-farmer-advance`, {}, options);
  },
  claimLogisticsJob(jobId: string, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['claimLogisticsJob']>>(`/api/logistics/jobs/${encodeURIComponent(jobId)}/claim`, {}, options);
  },
  proposeLogisticsFee(jobId: string, body: T.FeeInput, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['proposeLogisticsFee']>>(`/api/logistics/jobs/${encodeURIComponent(jobId)}/fee`, body, options);
  },
  respondLogisticsFee(jobId: string, body: T.FeeResponseInput, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['respondLogisticsFee']>>(`/api/buyer/logistics-jobs/${encodeURIComponent(jobId)}/fee-response`, body, options);
  },
  payLogisticsAdvance(orderId: string, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['payLogisticsAdvance']>>(`/api/buyer/orders/${encodeURIComponent(orderId)}/pay-logistics-advance`, {}, options);
  },
  confirmPickup(jobId: string, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['confirmPickup']>>(`/api/logistics/jobs/${encodeURIComponent(jobId)}/pickup`, {}, options);
  },
  updateTracking(jobId: string, body: T.TrackingInput, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['updateTracking']>>(`/api/logistics/jobs/${encodeURIComponent(jobId)}/location`, body, options);
  },
  generateDeliveryOtp(orderId: string, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['generateDeliveryOtp']>>(`/api/buyer/orders/${encodeURIComponent(orderId)}/delivery-otp`, {}, options);
  },
  verifyDeliveryOtp(orderId: string, body: T.VerifyDeliveryInput, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['verifyDeliveryOtp']>>(`/api/logistics/orders/${encodeURIComponent(orderId)}/verify-delivery`, body, options);
  },
  payFinalBalances(orderId: string, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['payFinalBalances']>>(`/api/buyer/orders/${encodeURIComponent(orderId)}/pay-final-balances`, {}, options);
  },
  submitFeedback(orderId: string, body: T.FeedbackInput, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['submitFeedback']>>(`/api/orders/${encodeURIComponent(orderId)}/feedback`, body, options);
  },
  raiseDispute(orderId: string, body: T.DisputeInput, options: Options) {
    return apiClient.post<ApiSuccessEnvelope<T.MutationResults['raiseDispute']>>(`/api/orders/${encodeURIComponent(orderId)}/disputes`, body, options);
  },
};
