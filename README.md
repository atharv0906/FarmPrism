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
2.4 Buyer Walkthrough
Buyer onboarding: Select Buyer → choose subtype: Restaurant / Wholesaler / FPO / Other → complete required profile/verification information.
Buyer dashboard: View marketplace auctions, recommendations, active bids, orders, payments, logistics and trust score.
Browse auctions: Filter by crop, location/region, quality, quantity, auction state and other available marketplace information.
Auction detail: See produce information, media, AI quality result, quantity available, auction timing, price information and farmer trust information.
Bid: Enter desired bid quantity (partial quantities allowed) and price → submit bid → update/withdraw as permitted.
Repeated bidding: Multiple bids by the same buyer remain in history. The latest active bid replaces the previous active bid for current ranking/logic.
Winning/allocation: Farmer can accept any buyer bid and can accept it partially. Accepted allocation becomes an order.
Payment: Pay agreed advance and later balance. Logistics fee is separate if applicable.
Delivery: Receive pickup/delivery status and confirm delivery as required.
Feedback/dispute: Rate seller after delivery and optionally attach photos/text. Raise a dispute for quality, quantity, payment, delivery, damage or other issues.
2.5 FPO Buyer Walkthrough
FPO is a Buyer subtype. Its marketplace behavior is the same buyer flow, but the profile includes organization/registration credentials.
•	CIN
•	PAN (stored; masked in public display)
•	GSTIN
•	SFAC FPO ID
•	NABARD FPO ID
•	NCDC FPO ID
•	e-NAM Registration ID
•	At least one valid FPO registration/license identity
Admin verifies FPO details. A public verification view can show CIN, GSTIN, FPO IDs and e-NAM ID, with PAN masked, plus “Verify on Blockchain”.
2.6 Logistics Walkthrough
Availability: Logistics partner manages availability.
Vehicle: Register/manage vehicle number, vehicle type, capacity and availability.
Jobs: View suitable logistics jobs and accept/reject them.
Agreement: Farmer and buyer mutually decide whether logistics is needed, partner selection and logistics fee.
Pickup: Accepted job → navigate to pickup → confirm pickup.
Tracking: Use live GPS/navigation if feasible; otherwise simplify/simulate for prototype.
Delivery: Navigate to buyer → delivery confirmation by driver and buyer; geofence/GPS where feasible.
Earnings: View logistics fee/payment. Driver receives 100% of the mutually agreed logistics fee.
2.7 Admin/Government Walkthrough
•	Admin login
•	Overview KPIs
•	Farmer management and verification
•	Buyer/FPO management and FPO verification
•	Logistics and vehicle management
•	Auction monitoring
•	Order/transaction monitoring
•	Live operations map and GPS/delivery monitoring
•	Dispute management and resolution
•	MSP analytics
•	Mandi analytics
•	Supply/demand analytics
•	Farmer income impact
•	Blockchain audit
•	AI analytics
•	Reports
•	Profile/settings
Admin can suspend/block farmer, buyer/FPO, logistics, auction or order as appropriate. Every suspension/block action requires a reason, notice and audit record.
3. DETAILED WALKTHROUGH ARCHITECTURE DIAGRAMS
These diagrams describe product behavior, not infrastructure.
3.1 End-to-End Marketplace Flow
Complete Business Flow
Farmer Login
  ↓
Farmer Dashboard
  ↓
Create Physical Batch
  ↓
Upload Media
  ↓
AI Quality Assessment
  ↓
Price Recommendation
  ↓
Create Auction for selected quantity
  ↓
Buyers Discover Auction
  ↓
Buyer Places Bid (full or partial)
  ↓
Bid Ranking + Trust Signals + Anti-Snipe
  ↓
Farmer Accepts / Rejects / Partially Accepts / Closes
  ↓
Accepted Allocation → Order
  ↓
Advance Payment
  ↓
Logistics Agreement (optional)
  ↓
Pickup
  ↓
Balance Payment / Settlement
  ↓
Delivery Confirmation
  ↓
Buyer Feedback
  ↓
Trust Score Update
  ↓
Blockchain Audit Event(s)
3.2 Batch → Auction → Order Relationship
A physical batch can support multiple selling attempts. An auction represents only one selling attempt and may allocate quantity to multiple accepted orders.
Example
Batch TOM001 = 500 KG
  ↓
Auction A1 = 350 KG offered
  ↓
A1 accepted allocations = 200 KG + 150 KG
  ↓
Orders O1 + O2 created
  ↓
Batch remaining = 150 KG
  ↓
Auction A2 = 150 KG
  ↓
New accepted allocation(s) → new order(s)
3.3 Bid Lifecycle
Bid State Flow
ACTIVE
  ↓
New bid from same buyer → previous active bid becomes REPLACED
  ↓
Outbid by current market ranking → OUTBID where applicable
  ↓
Farmer accepts → ACCEPTED / PARTIALLY_ACCEPTED
  ↓
Farmer rejects → REJECTED
  ↓
Buyer withdraws where allowed → WITHDRAWN
3.4 Trust-Aware Farmer Decision
Decision Support
View bids
  ↓
Compare price
  ↓
Check buyer trust score
  ↓
Check relevant order/payment/dispute history signals
  ↓
Select bid or partial allocation
  ↓
Create order
4. TECHNICAL ARCHITECTURE
The technical architecture separates presentation clients, API/business logic, data services, AI services, external integrations and blockchain audit.
4.1 High-Level Technical Architecture Diagram
System Flow
Farmer / Buyer / Logistics Mobile (Flutter)
  ↓
              ↕
  ↓
React Admin Web
  ↓
              ↕
  ↓
Backend API — Node.js 20 + Express 4.x
  ↓
      ↙              ↓                 ↘
  ↓
Supabase Services   AI Service       External Services
  ↓
PostgreSQL/PostGIS  Python/FastAPI    Razorpay / Maps / FCM-SMS / e-NAM-Agmarknet
  ↓
Auth + Storage + Realtime
  ↓
              ↓
  ↓
Blockchain Adapter
  ↓
ethers.js 6 → EVM Network (Polygon Amoy/local)
  ↓
              ↓
  ↓
Blockchain Audit Events + IPFS metadata where required
4.2 Mobile Architecture
•	Flutter + Dart
•	Role-aware routing: Farmer / Buyer / Logistics
•	Remembered last-role state after authentication
•	Reusable theme/components
•	API/service layer for backend calls
•	Supabase Auth session handling
•	Realtime listeners for auction/bid/order updates where useful
•	Secure handling of authentication/session data
4.3 Backend Responsibilities
•	Authentication/session integration with Supabase Auth
•	Role and permission enforcement
•	Farmer/buyer/logistics profiles
•	Batch and media management
•	AI quality assessment orchestration
•	Price recommendation orchestration
•	Auction and bid rules
•	Anti-snipe extension
•	Partial allocation and re-auction rules
•	Order creation and state transitions
•	Payment orchestration and webhooks
•	Logistics assignment and delivery events
•	Trust-score calculation/update
•	Feedback and dispute management
•	Admin actions and audit records
•	Blockchain event publishing
4.4 Supabase Responsibilities
•	PostgreSQL — system of record
•	PostGIS — precise geographic data and spatial operations
•	Supabase Auth — authentication
•	Supabase Storage — images, videos, proofs and documents
•	Supabase Realtime — live marketplace/operation updates
•	Row Level Security — data access enforcement
4.5 AI Architecture
AI Quality Flow
Produce media uploaded
  ↓
Stored in Supabase Storage
  ↓
Backend sends media/reference to AI service
  ↓
Python + FastAPI service
  ↓
Open-source CV/model inference
  ↓
Score + grade + confidence + defects
  ↓
Persist quality_assessment
  ↓
Display result to farmer/buyer
  ↓
No manual override; retry assessment allowed
Price recommendation target: XGBoost + SHAP using mandi data, region, quality and related factors. Demand forecasting, fraud detection and advanced route optimization are later priorities.
4.6 Blockchain Architecture
1.	Backend creates a business event.
2.	Backend validates the event and creates a hash/proof payload.
3.	Blockchain adapter publishes the selected audit event.
4.	Transaction hash is stored in blockchain_events.
5.	Identifiers/proofs/hashes are recorded; raw KYC documents are not stored directly on-chain.
6.	IPFS may store off-chain metadata when needed.
Blockchain events: PRODUCT_REGISTERED, AUCTION_CREATED, WINNING_BID, ORDER_CREATED, PICKUP_CONFIRMED, DELIVERY_CONFIRMED, PAYMENT_SETTLED, FPO_VERIFIED.
5. DATABASE ARCHITECTURE
PostgreSQL in Supabase is the primary source of truth. Internal primary keys should use UUIDs. Government Farmer ID is a separate business identifier.
5.1 Database Architecture Diagram
Data Flow
Flutter / React clients
  ↓
↓
  ↓
Node.js API + authorization
  ↓
↓
  ↓
PostgreSQL + PostGIS
  ↓
├─ Identity & Profiles
  ↓
├─ Produce & Quality
  ↓
├─ Marketplace
  ↓
├─ Orders & Payments
  ↓
├─ Logistics & GPS
  ↓
├─ Reputation & Disputes
  ↓
├─ Government / Market Data
  ↓
├─ AI Recommendations
  ↓
└─ System / Blockchain Audit
  ↓
↕
  ↓
Supabase Storage + Realtime
5.2 Core Tables
Domain	Tables / purpose
Identity	profiles, farmer_profiles, buyer_profiles, logistics_profiles
Transport	vehicles
Master data	crops
Produce	batches, batch_media, quality_assessments
Marketplace	auctions, bids, orders
Transaction	payments, order_events
Logistics	logistics_assignments, gps_tracking
Reputation	feedback, feedback_media, trust_score_history
Disputes	disputes, dispute_media
Government/Market	mandi_prices, msp_prices, verification_records
AI	price_recommendations
System	notifications, blockchain_events
FPO	fpo_verifications
5.3 Entity Relationship Diagram — Logical
Identity Relationships
profiles
  ↓
├── farmer_profiles → batches
  ↓
├── buyer_profiles → bids / orders / feedback / disputes
  ↓
│                  └→ fpo_verifications (when buyer_type = FPO)
  ↓
└── logistics_profiles → vehicles / logistics_assignments
Marketplace Relationships
farmer_profiles
  ↓
↓
  ↓
batches
  ↓
↓
  ↓
batch_media + quality_assessments
  ↓
↓
  ↓
auctions
  ↓
↓
  ↓
bids
  ↓
↓
  ↓
orders
  ↓
↓
  ↓
payments + order_events
Logistics Relationships
orders
  ↓
↓
  ↓
logistics_assignments
  ↓
↓
  ↓
vehicles + gps_tracking
  ↓
↓
  ↓
pickup/delivery order_events
Reputation / Dispute Relationships
orders
  ↓
↓
  ↓
feedback + feedback_media
  ↓
↓
  ↓
trust_score_history
  ↓
or
  ↓
orders / payments / delivery
  ↓
↓
  ↓
disputes + dispute_media
5.4 Key Table Fields
Table	Important fields
profiles	id UUID, role, auth linkage, created_at, updated_at
farmer_profiles	profile_id, 11-digit government farmer_id, farm info, district, taluka, precise location, verification status
buyer_profiles	profile_id, buyer_type, organization/business details, trust score
fpo_verifications	buyer_id, CIN/PAN/GSTIN flags, SFAC/NABARD/NCDC/e-NAM flags, status, verified_by, verified_at, blockchain_tx_hash, record_hash
batches	farmer_id, crop_id, quantity_kg, remaining_quantity_kg, location, status, timestamps
batch_media	batch_id, storage path, media type, metadata
quality_assessments	batch_id, model/version, score, grade, confidence, defects, status, timestamps
auctions	batch_id, offered_quantity_kg, start/end time, status, rules
bids	auction_id, buyer_id, quantity_kg, price, status, timestamps
orders	auction_id, batch_id, buyer_id, seller/farmer_id, allocated_quantity_kg, status
payments	order_id, payer/payee, type, amount, status, provider reference, timestamps
logistics_assignments	order_id, logistics_id, vehicle_id, agreed_fee, status
gps_tracking	assignment/order reference, precise coordinates, timestamp
feedback	order_id, buyer_id, seller/farmer_id, rating, text, timestamps
disputes	order_id, raised_by, category, description, status, resolution/audit fields
blockchain_events	event_type, entity reference, payload hash/proof, tx hash, status, timestamps
5.5 Important Data Rules
•	Batch, auction and order must be separate records.
•	All produce quantities use KG internally.
•	A batch can have remaining quantity after an auction and can be re-auctioned.
•	One auction can create multiple orders through multiple accepted allocations.
•	A buyer can have multiple historical bids but only one current active bid per auction under the latest-bid rule.
•	Farmer ID is a unique government identifier, not the database primary key.
•	Raw KYC documents remain off-chain in secure storage.
•	RLS policies must prevent users from reading/modifying records outside their permissions.
•	Precise location is stored using PostGIS; access should be restricted to the relevant business context even though precise location is intentionally supported.
6. SERVICE / MODULE ARCHITECTURE
Module	Primary responsibilities
Auth & Role	Supabase Auth, OTP/session, remembered last role, authorization
Farmer	Profile, Farmer ID, batches, media, auctions, bid decisions
Buyer	Buyer subtype, browsing, bidding, orders, payment, feedback
FPO	Credential capture, admin verification, blockchain verification proof
Quality	Media intake, AI inference, assessment history, retry
Marketplace	Auction state, bids, anti-snipe, partial allocation, re-auction
Order	Allocation, order state, order events
Payment	Advance, balance, logistics, refund, provider integration
Logistics	Partner, vehicle, assignment, pickup, delivery, GPS
Trust	Ratings, trust calculation/history
Dispute	Evidence, lifecycle, admin resolution
Blockchain	Audit event creation, hashing, transaction tracking
Admin	Management, analytics, suspension/block audit
Notification	In-app/push/SMS integration
7. CORE STATE MACHINES
7.1 Auction States
Recommended: DRAFT → OPEN → CLOSED → AWARDED/PARTIALLY_SOLD → COMPLETED, with CANCELLED available where applicable.
7.2 Order States
Recommended lifecycle: CREATED → ADVANCE_PENDING/PAID → LOGISTICS_PENDING/ASSIGNED (if needed) → PICKUP_CONFIRMED → BALANCE_PENDING/PAID → DELIVERY_CONFIRMED → COMPLETED. Dispute/refund paths branch from applicable states.
7.3 Dispute States
Recommended: OPEN → UNDER_REVIEW → RESOLVED / REJECTED / ESCALATED, with resolution and audit information.
8. SECURITY AND GOVERNANCE
•	Supabase Auth for authentication; do not implement a separate custom JWT system unless a later requirement explicitly demands it.
•	Use RLS for farmer/buyer/logistics data isolation.
•	Use backend authorization for business rules; never trust mobile UI checks alone.
•	Keep KYC documents in private Supabase Storage buckets.
•	Do not place raw KYC documents on blockchain.
•	Mask PAN in public FPO verification views.
•	Record admin suspension/block actions with reason, notice and audit information.
•	Use precise GPS only in relevant operational contexts and protect it with authorization.
9. SCOPE AND PRIORITY
Priority	Scope
P1 — Foundation	Supabase, DB, Auth, roles, Storage, RLS, backend structure
P2 — Core marketplace	Batch, media, quality, price recommendation, auction, live bidding, anti-snipe, partial allocation, re-auction, orders
P3 — Transactions	Payments, logistics agreement, vehicles, pickup, GPS if feasible, delivery, feedback, trust, disputes
P4 — WOW	Blockchain, FPO blockchain verification, AI analytics, MSP/mandi/admin analytics
P5 — Later	Demand forecasting, fraud detection, advanced route optimization, real external integrations, cold-chain, advanced multilingual
Cold-chain is a later/finale SIH feature, not an early core dependency. GPS may be simplified if implementation becomes a timeline risk. External integrations should be mocked first.
10. README
10.1 Project Summary
FarmPrism is a government-governed agricultural marketplace for transparent farmer-to-buyer transactions, optional logistics, quality assessment, reputation, payments and blockchain-backed auditability.
10.2 Repository / Development Model
Recommended branch model:
Git Flow
main
  ↓
↓
  ↓
development
  ↓
├── feature/auth
  ↓
├── feature/auction
  ↓
├── feature/bidding
  ↓
├── feature/orders
  ↓
└── feature/logistics
Development loop: feature → DB → API → UI → test → fix → commit → PR to development → shared development deployment → tester verification → stable milestone → main.
10.3 Team Workflow
The user is the primary/sole developer. The tester owns the repository and performs continuous testing on the available mobile devices/laptops. The tester should not directly push development to origin/main; stable promotion is controlled through the agreed workflow.
10.4 Technology Stack
•	Flutter + Dart
•	React 18 + Vite + Recharts
•	Node.js 20 LTS + Express 4.x
•	Supabase PostgreSQL + PostGIS + Auth + Storage + Realtime
•	Python 3.12 + FastAPI
•	Solidity 0.8.20 + ethers.js 6 + Hardhat/Remix
•	Polygon Amoy or local EVM network
•	IPFS for suitable off-chain metadata
•	Razorpay sandbox/test mode
•	Docker / Docker Compose / GitHub Actions
11. DESIGNER HANDOFF NOTES
The visual theme already exists separately. Preserve the established agricultural/natural visual language: green and earthy brown, cream/off-white, rounded cards, soft shadows, agriculture imagery, modern marketplace/dashboard components, and a trustworthy government/agri-tech feel.
The designer should create states as well as happy-path screens: empty states, loading, errors, validation, no bids, partial allocation, unsold quantity, payment pending/failed, logistics unavailable, delivery pending, dispute open/resolved, verification pending/rejected, AI retry and auction closing/closed states.
12. SIH DEMO STORY
Recommended Demo
Farmer logs in
  ↓
FarmPrism remembers Farmer role / opens Farmer Dashboard
  ↓
Farmer creates Tomato batch
  ↓
Uploads media
  ↓
AI quality result appears
  ↓
Price recommendation appears
  ↓
Farmer opens auction
  ↓
Buyer logs in; Buyer role opens directly
  ↓
Buyer views auction and trust information
  ↓
Buyer places partial bid
  ↓
Another buyer bids
  ↓
Anti-snipe/auction activity demonstrated
  ↓
Farmer accepts selected bid partially
  ↓
Order is created
  ↓
Advance payment demonstrated
  ↓
Optional logistics partner accepts job
  ↓
Pickup and delivery status demonstrated
  ↓
Buyer confirms delivery and rates farmer
  ↓
Trust score updates
  ↓
Admin opens blockchain audit and operations dashboard
This story demonstrates the core differentiator: transparent marketplace behavior from produce creation through bidding, allocation, transaction, delivery, reputation and audit.
13. Final Product Decisions Checklist
•	One Flutter mobile app for all three operational roles.
•	Admin remains a separate React web dashboard.
•	First-time users select a role; returning users open the remembered last-role dashboard after login.
•	Buyer types are Restaurant, Wholesaler, FPO and Other.
•	FPO is a Buyer subtype with registration credentials and admin verification.
•	Government Farmer ID is the original 11-digit identifier.
•	Demo crops are Onion, Tomato and Potato.
•	Precise location is stored and can be shown where relevant.
•	Batch, Auction and Order remain distinct entities.
•	Partial bids and partial acceptance are supported.
•	Re-auction of remaining physical batch quantity is supported.
•	Advance + balance payment model is used.
•	Logistics is optional and mutually agreed; driver gets 100% of logistics fee.
•	AI quality cannot be manually overridden; assessment can be retried.
•	Farmer and Buyer trust scores are public to relevant marketplace participants.
•	Disputes support evidence and admin resolution.
•	Blockchain is an audit/trust layer.
•	QR traceability is excluded from current scope.

FarmPrism • Detailed Working Specification • SIH 2026
