# FarmPrism — Farmer Profile
## Detailed UX Action & Navigation Handoff

**Platform:** React Native / Expo  
**Target:** Android-first  
**Visual reference:** 1080 × 2340 px (9:19.5)

---

## 1. Purpose

Profile is the farmer's **account, identity, preferences and support center**.

Core question:

> Who am I, what information is connected to my FarmPrism account, and how do I manage it?

Profile owns:

- Personal information
- Farm profile access
- Farmer verification status
- Language preference
- Notification preferences
- Help & support
- About FarmPrism
- Privacy & security
- Logout

Profile does NOT own:

- Crop management → My Farm
- Market information → Insights
- Produce listings/offers → Sell
- Orders/logistics/payment execution → Orders

---

# 2. Bottom Navigation

```text
Home | My Farm | Sell | Insights | Profile
                                      ↑
                                   Selected
```

The Profile tab is the canonical entry point for account/settings functionality.

---

# 3. Complete Action Map

```text
PROFILE
│
├── Profile Header
│      ├── Profile Photo → Change Profile Photo
│      └── Edit Profile → Edit Personal Profile
│
├── Personal Information → Personal Information
│
├── Farm Details → My Farm / Farm Details
│
├── Farmer Verification → Verification Details
│
├── Language → Language Selection
│
├── Notifications → Notification Preferences
│
├── Help & Support → Help & Support
│
├── About FarmPrism → About FarmPrism
│
├── Privacy & Security → Privacy & Security
│
├── Logout → Logout Confirmation → Login / Role Entry
│
└── Bottom Navigation
       ├── Home
       ├── My Farm
       ├── Sell
       ├── Insights
       └── Profile
```

---

# 4. Profile Header

Recommended:

```text
FarmPrism logo
Notification bell

My Profile

Manage your details, preferences
and account settings.
```

The scenic FarmPrism artwork is decorative/background content.

### Logo

Tap:

```text
No navigation
```

### Notification Bell

Tap:

```text
Notifications
```

Notification items can deep-link to the relevant feature.

---

# 5. Farmer Profile Card

Example:

```text
[Ramesh Patil photo]

Ramesh Patil
✓ Verified Farmer
Wagholi, Pune, Maharashtra

2 Crops     5.0 Acres     12 Quintals

[ Edit Profile ]
```

All values must come from the authenticated farmer profile.

Do not bake farmer-specific text into the artwork.

---

# 6. Profile Photo

Tap the camera/photo control:

```text
Change Profile Photo
```

Recommended options:

```text
Take Photo
Choose from Gallery
Remove Photo
Cancel
```

### Validation

- Accept supported image formats.
- Compress before upload where appropriate.
- Enforce reasonable file-size limits.
- Show upload progress.
- Keep the previous image if upload fails.

### Security

The backend must associate uploaded profile media with the authenticated farmer.

---

# 7. Edit Profile

Tap:

```text
Edit Profile
```

Destination:

```text
Edit Personal Profile
```

Editable fields may include:

```text
Full Name
Mobile Number
Preferred Language
Profile Photo
```

Fields controlled by verification should not be freely editable without the appropriate verification flow.

After editing:

```text
[ Save Changes ]
```

Success:

```text
Profile updated successfully.
```

---

# 8. Personal Information

Tap:

```text
Personal Information
```

Destination:

```text
Personal Information
```

Suggested information:

```text
Full Name
Mobile Number
Farmer ID
Preferred Language
Account Status
```

Primary action:

```text
[ Edit ]
```

Sensitive information should be partially masked where appropriate.

Example:

```text
+91 ******3210
```

---

# 9. Farm Details

Tap:

```text
Farm Details
```

Destination:

```text
Farm Details
```

Possible information:

```text
Farm Location
State
District
Taluka
Village
Land Area
```

For detailed crop information:

```text
Farm Details
 ↓
My Farm
```

Do not duplicate the complete My Farm dashboard inside Profile.

### Recommended relationship

Profile:

```text
Who owns the farm?
```

My Farm:

```text
What do I have on the farm?
```

---

# 10. Farmer Verification

Example profile row:

```text
Farmer Verification

View your verification status
and documents

✓ Verified
```

Tap:

```text
Verification Details
```

Possible content:

```text
Verification Status
Farmer ID
Verified Information
Verification Date
Documents, if applicable
```

Do not expose unnecessary identity documents.

### Important

A verified farmer status must come from backend verification state.

Never display:

```text
Verified
```

based only on a client-side flag.

---

# 11. Verification States

### Verified

```text
✓ Verified Farmer
```

### Pending

```text
Verification Pending
```

### Action Required

```text
Verification Needs Attention
[ Review ]
```

### Not Verified

```text
Not Yet Verified
[ Complete Verification ]
```

The exact states should follow the FarmPrism backend verification model.

---

# 12. Language

Tap:

```text
Language
```

Destination:

```text
Language Selection
```

Example:

```text
English
मराठी
हिन्दी
```

The selected language should be clearly marked.

After selection:

```text
Apply
```

The app should update user-facing strings without requiring the farmer to manually restart the application.

All Profile strings should be localization-ready.

---

# 13. Notifications

Tap:

```text
Notifications
```

Destination:

```text
Notification Preferences
```

Possible controls:

```text
Buyer Offers
Order Updates
Payment Updates
Logistics Updates
Market Opportunities
Price Alerts
General FarmPrism Updates
```

Use simple toggles.

Avoid overwhelming the farmer with technical notification categories.

---

# 14. Help & Support

Tap:

```text
Help & Support
```

Destination:

```text
Help & Support
```

Recommended sections:

```text
Frequently Asked Questions
How to Sell Produce
How Buyer Offers Work
Payments
Orders & Logistics
Account Help
```

Primary actions:

```text
Contact Support
```

and:

```text
Call Support
```

if supported by the product.

Support should not expose private farmer information unnecessarily.

---

# 15. About FarmPrism

Tap:

```text
About FarmPrism
```

Destination:

```text
About FarmPrism
```

Recommended content:

```text
FarmPrism
from soil to sell

What FarmPrism does
Our mission
How direct selling works
App version
Terms
Privacy Policy
```

Core mission wording:

> FarmPrism helps farmers understand the value of what they have grown, discover verified buyers, compare opportunities, and sell directly with greater transparency.

---

# 16. Privacy & Security

Tap:

```text
Privacy & Security
```

Destination:

```text
Privacy & Security
```

Recommended items:

```text
Account Security
Mobile Number
Login / OTP Security
Data & Privacy
Permissions
Privacy Policy
```

Where supported:

```text
Delete Account
```

Account deletion must require an explicit confirmation step.

---

# 17. Logout

Tap:

```text
Logout
```

Do NOT immediately log the farmer out.

Show:

```text
Log out?

Are you sure you want to log out
of FarmPrism?

[ Cancel ]    [ Log Out ]
```

After confirmation:

```text
Clear authenticated session
 ↓
Clear sensitive local state
 ↓
Navigate to authentication entry
```

Do not delete farmer data from the backend.

---

# 18. Logout Navigation

After logout:

```text
Authentication / Role Entry
```

The app may remember the previously selected role if that behavior is part of the existing FarmPrism authentication design, but the authenticated session/token must be cleared.

---

# 19. Bottom Navigation Actions

### Home

```text
Tap → Home
```

### My Farm

```text
Tap → My Farm
```

### Sell

```text
Tap → Sell
```

### Insights

```text
Tap → Insights
```

### Profile

```text
Tap → Profile
```

If already on Profile:

```text
Tap → Scroll to top
```

---

# 20. Canonical Destination Table

| Profile element | Action | Destination |
|---|---|---|
| Logo | Tap | No navigation |
| Notification | Tap | Notifications |
| Profile photo | Tap | Change Profile Photo |
| Edit Profile | Tap | Edit Personal Profile |
| Personal Information | Tap | Personal Information |
| Farm Details | Tap | Farm Details / My Farm |
| Farmer Verification | Tap | Verification Details |
| Language | Tap | Language Selection |
| Notifications | Tap | Notification Preferences |
| Help & Support | Tap | Help & Support |
| About FarmPrism | Tap | About FarmPrism |
| Privacy & Security | Tap | Privacy & Security |
| Logout | Tap | Logout Confirmation |
| Log Out confirmation | Confirm | Authentication Entry |
| Bottom Home | Tap | Home |
| Bottom My Farm | Tap | My Farm |
| Bottom Sell | Tap | Sell |
| Bottom Insights | Tap | Insights |
| Bottom Profile | Tap | Profile |

---

# 21. Back Navigation

Follow the real navigation stack.

Examples:

```text
Profile
 ↓
Personal Information
 ↓
Back → Profile
```

```text
Profile
 ↓
Farm Details
 ↓
Back → Profile
```

```text
Profile
 ↓
Language
 ↓
Back → Profile
```

```text
Profile
 ↓
Privacy & Security
 ↓
Back → Profile
```

Do not force every Back action to Home.

---

# 22. Loading States

Use skeletons for profile data.

Example:

```text
████████████
████████

████████████████
████████████

████████
████████
```

Do not temporarily show another farmer's data.

---

# 23. Empty States

### Missing profile photo

```text
Add a profile photo
```

### Missing farm details

```text
Add your farm details
to complete your profile.

[ Add Farm Details ]
```

### Missing verification

```text
Your farmer verification
is not complete yet.

[ Complete Verification ]
```

Only show actions supported by the actual backend flow.

---

# 24. Error States

If profile loading fails:

```text
We couldn't load your profile.

Please check your connection
and try again.

[ Try Again ]
```

If a single preference fails to load, do not unnecessarily block the entire Profile page.

---

# 25. Save / Update States

For editable settings:

```text
Idle
 ↓
Editing
 ↓
Saving
 ↓
Success
```

Saving button:

```text
Saving...
```

Prevent accidental duplicate submissions.

---

# 26. Animation

Keep Profile animation subtle.

### Screen entry

```text
250–300ms
Fade + translateY 8–12dp
```

### Settings cards

```text
Optional 40–60ms stagger
```

### Button press

```text
100–150ms
scale ≈ 0.97
```

Avoid:

```text
Bouncing settings cards
Continuous leaf animation
Large parallax effects
Long transitions
```

---

# 27. Accessibility

Minimum interactive target:

**48 × 48 dp-equivalent**

Requirements:

- Every icon-only button has an accessible label.
- Verification status must not rely only on color.
- Support larger text.
- Avoid clipping names, locations or Farmer IDs.
- Decorative illustrations should be marked decorative.
- All strings must be localization-ready.
- Logout must have a clear confirmation state.
- Screen-reader labels should describe the actual action.

Example:

```text
"Edit profile"
"Change profile photo"
"Open notification preferences"
"Open privacy and security"
```

---

# 28. Responsive Design

Reference visual:

```text
1080 × 2340 px
```

React Native must NOT hard-code the reference dimensions.

Use:

```text
Flexbox
useWindowDimensions()
Safe-area insets
ScrollView
Responsive sizing
```

Recommended starting tokens:

```text
Horizontal padding: 20–24dp
Card radius: 16–20dp
Card padding: 16–20dp
Section gap: 16–24dp
Touch target: ≥48dp
```

The bottom navigation should use normal React Native layout plus safe-area inset, not a fixed 460px-style runtime height.

---

# 29. Data Ownership

Profile reads/writes:

```text
Farmer Profile
Account Preferences
Verification State
Notification Preferences
Language Preference
```

Profile does NOT own:

```text
Crop records → My Farm
Produce listings → Sell
Buyer offers → Sell
Orders → Orders
Market data → Insights
```

---

# 30. Backend Responsibilities

Backend must control:

- Authenticated farmer identity
- Farmer ID
- Verification state
- Profile ownership
- Language preference
- Notification preferences
- Account status
- Privacy/security state

The client must not be able to set itself as:

```text
Verified Farmer
```

or alter protected identity fields without server authorization.

---

# 31. Suggested Profile Data Model

```ts
type FarmerProfile = {
  id: string;
  farmerId: string;
  fullName: string;
  mobileNumber: string;
  profilePhotoUrl?: string;

  location?: {
    state?: string;
    district?: string;
    taluka?: string;
    village?: string;
  };

  preferredLanguage: string;

  verificationStatus:
    | "verified"
    | "pending"
    | "action_required"
    | "not_verified";

  accountStatus:
    | "active"
    | "suspended"
    | "pending";

  notificationPreferences?: {
    buyerOffers: boolean;
    orderUpdates: boolean;
    paymentUpdates: boolean;
    logisticsUpdates: boolean;
    marketOpportunities: boolean;
    priceAlerts: boolean;
    generalUpdates: boolean;
  };
};
```

Adapt this to the existing FarmPrism database schema rather than creating duplicate tables.

---

# 32. Suggested React Native Structure

```text
src/
├── screens/
│   └── farmer/
│       ├── ProfileScreen.tsx
│       ├── EditProfileScreen.tsx
│       ├── PersonalInformationScreen.tsx
│       ├── FarmDetailsScreen.tsx
│       ├── VerificationDetailsScreen.tsx
│       ├── LanguageSelectionScreen.tsx
│       ├── NotificationPreferencesScreen.tsx
│       ├── HelpSupportScreen.tsx
│       ├── AboutFarmPrismScreen.tsx
│       └── PrivacySecurityScreen.tsx
│
├── components/
│   └── profile/
│       ├── ProfileHeader.tsx
│       ├── FarmerProfileCard.tsx
│       ├── ProfileMenuItem.tsx
│       ├── VerificationBadge.tsx
│       └── LogoutConfirmation.tsx
│
└── services/
    ├── profileService.ts
    ├── verificationService.ts
    └── preferencesService.ts
```

Adapt to the existing FarmPrism project structure.

---

# 33. Security

Important:

- Use authenticated API requests.
- Never trust Farmer ID supplied by the client.
- Enforce farmer ownership server-side.
- Protect profile photo upload endpoints.
- Do not expose verification documents publicly.
- Do not store authentication tokens in ordinary unencrypted storage where secure storage is available.
- Clear sensitive local session data on logout.
- Validate all profile updates server-side.
- Apply authorization checks to every profile endpoint.

---

# 34. Performance

- Load profile summary in one primary request where possible.
- Lazy-load secondary settings pages.
- Cache non-sensitive preferences appropriately.
- Compress profile photos before upload.
- Avoid loading large decorative artwork repeatedly.
- Keep Profile scrolling smooth on lower-end Android devices.

---

# 35. Analytics

Useful product events:

```text
profile_opened
profile_edit_started
profile_updated
profile_photo_changed
verification_opened
language_changed
notification_preferences_updated
help_opened
support_contact_started
privacy_security_opened
logout_started
logout_confirmed
```

Do not send sensitive personal information as analytics event properties.

---

# 36. Final UX Principle

Profile should remain a **simple account/settings center**, not another dashboard.

The farmer should quickly understand:

```text
MY IDENTITY
    ↓
MY FARM INFORMATION
    ↓
MY VERIFICATION
    ↓
MY PREFERENCES
    ↓
HELP & SECURITY
    ↓
ACCOUNT CONTROL
```

FarmPrism's main product loop remains:

```text
KNOW
 ↓
DECIDE
 ↓
SELL DIRECTLY
 ↓
GET BETTER VALUE
```

Profile supports that loop by keeping the farmer's account, identity and preferences trustworthy and easy to manage.
