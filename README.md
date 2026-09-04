FARMPRISM
Detailed Product Walkthrough
Technical Architecture
Database Architecture
README
SIH 2026 • SIH26033
Consolidated implementation specification
Document Purpose
This document is the detailed working specification for FarmPrism. It separates the three architecture views that are often mixed together: (1) product/walkthrough flow, (2) technical/system architecture, and (3) database/data architecture. It is intended to be usable by the developer, tester, designer and SIH presentation team.
1. Product Definition
FarmPrism is a government-governed agricultural marketplace focused on improving price transparency, reducing unnecessary intermediaries, and creating a trusted digital transaction flow between farmers, buyers and optional logistics partners.
Area	Current decision
Mobile application	One Flutter app for Farmer, Buyer and Logistics
Admin	Separate React web dashboard
Buyer types	Restaurant, Wholesaler, FPO, Other
Crops in demo	Onion, Tomato, Potato
Quantity unit	KG internally
Farmer ID	Original government-issued 11-digit Farmer ID
Location	Precise location stored; precise location can be shown where relevant
Payment	Advance + Balance; logistics fee mutually agreed
Platform logistics fee	₹0; driver/logistics partner receives 100% logistics fee
QR traceability	Removed from current scope
Blockchain	Audit/trust layer
2. DETAILED PRODUCT WALKTHROUGH
2.1 First-Time User Journey
Common Mobile Entry Flow
Splash / Welcome
  ↓
Normal Login
  ↓
Mobile number / credentials as applicable
  ↓
OTP verification
  ↓
Role Selection: Farmer / Buyer / Logistics
  ↓
Role profile setup / verification
  ↓
Role Dashboard
Role selection is required on first setup. FarmPrism stores the selected role for the authenticated account/device session. On subsequent logins, after authentication, the app remembers the last role and opens that role's dashboard directly instead of showing Role Selection every time.
2.2 Returning User Journey
Returning Mobile Flow
Splash / Welcome
  ↓
Normal Login
  ↓
OTP verification
  ↓
Read remembered last role
  ↓
Open remembered role dashboard directly
The implementation must not assume that every login requires role selection. The remembered-role behavior is part of the core UX.
2.3 Farmer Walkthrough
Farmer onboarding: Create/complete farmer profile → enter government 11-digit Farmer ID → farm information → district → taluka → precise location → verification status.
Farmer dashboard: Show profile/trust summary, produce activity, active auctions, orders, payments and relevant alerts.
Create batch: Select crop (Onion/Tomato/Potato) → enter quantity in KG → capture/upload produce media → create physical batch record.
Quality assessment: Submit images/videos → AI/CV quality assessment → display score/grade/confidence/defects → farmer cannot override result → farmer may retry with better/additional media.
Price recommendation: Show recommended price based on available mandi/market, region and quality inputs; prototype may use mocked data/model.
Create auction: Select batch quantity for the auction → set auction rules/time → publish auction.
Manage bids: See active bids/ranking → evaluate price plus buyer trust score → accept any bid, accept partial quantity, reject bids, or close auction early.
Unsold/re-auction: If quantity remains unsold, retain remaining quantity on the physical batch and allow a later auction.
Order: Accepted allocation creates an order. Order is distinct from both batch and auction.
Payment: Agree advance/balance arrangement with buyer → record/payment through Razorpay sandbox target or simulation.
Logistics: Mutually agree logistics partner and logistics fee with buyer. Admin does not assign the driver.
Pickup/delivery: Driver accepts job → pickup → GPS/navigation where feasible → delivery confirmation.
Feedback/dispute: Buyer gives rating/evidence/text after delivery. Farmer can participate in dispute resolution when a dispute is raised.
