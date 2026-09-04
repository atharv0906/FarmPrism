# FarmPrism Project Requirements

## 1. Project Overview
FarmPrism is a mobile agricultural marketplace that connects farmers, buyers, and logistics partners through a trusted workflow. The current repository contains the Expo/React Native foundation and common application flow; business modules remain placeholders.

## 2. Product Goal
Improve agricultural price transparency and coordinate trusted produce, marketplace, and logistics workflows through one mobile application.

## 3. Application Roles
FarmPrism has exactly three application roles:

- `farmer` - Farmer
- `buyer` - Buyer
- `logistics` - Logistics

No additional application roles are supported.

## 4. Role Permissions Concept
Supabase `user_roles` is the source of a user's assigned roles. A user may have more than one role. The client displays only assigned, recognized roles and persists the selected role through `user_preferences.last_role_id`. Supabase RLS remains the authorization boundary.

## 5. Common User Flow
First-time flow:

`Splash -> Get Started -> Language Selection -> Authentication -> Role Selection -> Role-specific flow`

Returning flow:

`Splash -> Restore authentication -> Restore language -> Restore valid last role -> Role-specific flow`

Splash is a state-restoration surface, not a business-logic screen.

## 6. Authentication
Authentication uses Supabase Auth for sign-up, login, logout, session restoration, auth state changes, password reset, and email verification handling. Passwords are sent only to Supabase Auth and are not stored by the application. The existing backend trigger creates the application user record; the client does not duplicate that insert.

## 7. Language
The initial supported language is `en`. Before authentication, the language is stored locally through AsyncStorage. After authentication, it synchronizes with `user_preferences.language_code`. The supported-language registry is designed for future additions.

## 8. Role Persistence
The application loads assigned roles, reads `user_preferences.last_role_id`, validates that the role is still assigned, and ignores stale values. A single assigned role is selected automatically. Multiple roles use a valid saved role or require selection. Every selected role is verified against `roles` and `user_roles` before persistence.

## 9. Supabase Architecture
Supabase is the backend and source of truth. The frontend uses one typed Supabase client in `src/lib/supabase/client.ts` with AsyncStorage-backed Auth sessions and AppState token refresh. Data access is isolated in services under `src/services/`.

The mobile client may use only the public/publishable Supabase key. A service-role credential must never be present in frontend code or environment files used by the app.

## 10. Database Tables
The existing database contains:

- `users`
- `roles`
- `user_roles`
- `user_preferences`
- `user_sessions`
- `farmer_profiles`
- `farm_locations`
- `farms`
- `categories`
- `units`
- `produce`
- `produce_quality`
- `physical_batches`
- `produce_activity`
- `produce_media`

The database was created separately. The frontend must not create tables, migrations, or local fake database records.

## 11. Farmer Module Roadmap
Future work includes farmer profile completion, identity verification, farm information, produce batches, quality submission, auctions, orders, payments, and delivery coordination. The current farmer destination is a placeholder only.

## 12. Buyer Module Roadmap
Future work includes buyer profile setup, produce discovery, bidding or purchasing workflows, orders, payments, delivery coordination, and feedback. The current buyer destination is a placeholder only.

## 13. Logistics Module Roadmap
Future work includes logistics profile setup, available delivery jobs, acceptance, pickup, navigation support, delivery confirmation, and logistics fees. The current logistics destination is a placeholder only.

## 14. Produce Concept
Produce represents an agricultural product or crop category used by later marketplace and batch workflows. Concrete business screens and field mappings are not part of the current phase.

## 15. Produce Activity Concept
Produce activity represents future activity history associated with produce and farmer workflows. Do not add unspecified date fields to the current requirements or implementation.

## 16. Physical Batch Concept
A physical batch represents a quantity of produce prepared for later marketplace workflows. Do not add unspecified date fields to the current requirements or implementation.

## 17. Media Concept
Produce media represents images or other media associated with produce quality and batch workflows. Upload and assessment behavior is future scope.

## 18. Trust Score - Future / Not Current Phase
Trust scoring is future scope. It is not part of the current database or application implementation.

## 19. Auction - Future / Not Current Phase
Auctions are future scope. Auction rules, timers, bidding, and auction screens are not part of the current implementation.

## 20. Explicitly Excluded Features
The current phase excludes:

- Business dashboard implementation
- Produce, batch, media, payment, delivery, auction, and trust-score workflows
- Additional application roles
- Client-side database or schema creation
- Custom password storage or authentication
- Unapproved final visual design

## 21. Security Rules

- Use Supabase Auth; do not implement custom authentication.
- Never expose service-role or private API credentials in the app.
- Do not store passwords manually.
- Do not trust local state as authorization.
- Protect authenticated flows with session state and assigned-role checks.
- Scope all protected data access to the authenticated Supabase user.
- Keep Supabase RLS as the backend security boundary.
- Do not modify Supabase from frontend work.

## 22. Development Rules

- Preserve the existing Expo/React Native/TypeScript architecture.
- Inspect existing code before creating or moving files.
- Keep services, providers, hooks, navigation, and screens separated.
- Do not invent database columns or product requirements.
- Do not add final visual designs before approval.
- Run `npm install`, `npm run typecheck`, and the relevant Expo validation after meaningful changes.
- Keep documentation aligned with the actual repository.

## 23. Current Development Phase
Phase 1B foundation is complete: common flow routing, Supabase Auth integration, language persistence, role persistence, reusable common UI, protected placeholder destinations, and project documentation. Farmer, buyer, and logistics business modules are not implemented.
