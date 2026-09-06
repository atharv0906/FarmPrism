# FarmPrism Login — Designer / Developer Asset Brief

## Goal
Recreate the approved FarmPrism login screen with high visual fidelity while keeping the production app as real React Native / Flutter UI.

## Visual Master
- `login_reference_1080x2340.png`
- Exact size: **1080 × 2340 px**
- Use only as a visual/measurement reference.
- Do **not** render the complete reference screenshot as the live app UI.

## Individual Artwork Assets
- `login_farmprism_logo.png` — FarmPrism white circular logo badge; transparent outside the badge.
- `login_top_left_leaves.png` — top-left decorative foliage; transparent PNG.
- `login_top_right_leaves.png` — mirrored/complementary top-right foliage; transparent PNG.
- `login_background_farm_1080x2340.png` — full-screen farmland/sunrise background.
- `login_quote_better_farmers.png` — decorative “Better Farmers Brighter Tomorrows” quote artwork.
- `login_center_leaf_divider.png` — small centered leaf/sprout with horizontal divider lines.
- `login_secure_shield.png` — secure/trusted shield artwork.
- `login_secure_leaf_sprig.png` — small leaf sprig for the secure card.

## Native UI — Do Not Bake Into Artwork
Build these with real UI components:
- “Welcome to FarmPrism”
- “From Soil to Sell, We Grow Together.”
- Phone Number label
- India flag / +91 selector / chevron
- Mobile-number input
- Send OTP button and arrow
- OR divider text/lines
- Enter OTP label
- Six OTP boxes
- Resend countdown
- Login button
- Secure & Trusted text and description
- “Don’t have an account? Sign Up”
- Card background, borders, shadows and rounded corners

## Reference Layout
- Background: farmland fills the full 1080×2340 screen.
- Decorative foliage: anchored in the top-left and top-right corners.
- Quote artwork: small, top-right, above the main login card.
- Main card: centered vertically with a large rounded rectangle and warm-white fill.
- Logo: overlaps the top edge of the card.
- Heading/subtitle: centered below logo.
- Leaf divider: centered below subtitle.
- Phone/OTP/Login controls: aligned to consistent internal card margins.
- Secure card: pale warm-green panel near bottom of main card.
- Sign Up row: final content inside the main card.

## Visual Style
- Warm cream/off-white surfaces.
- Deep FarmPrism green for primary actions.
- Earthy brown accent in the logo/brand title.
- Dark navy/slate for headings and body text.
- Rounded corners and soft shadows.
- Farmer-friendly, trustworthy, premium-natural aesthetic.

## Sizing Rules
- Full visual reference and full-screen background: 1080×2340.
- Individual transparent artwork: keep native aspect ratio.
- Never stretch logos, leaves, divider, shield or quote artwork to 1080×2340.

## Transparency Rules
All foreground artwork PNGs must:
- have a true alpha channel;
- have no white rectangular background;
- have no checkerboard baked into the pixels;
- preserve soft antialiased edges;
- avoid clipped shadows.

## Implementation Note
Use the reference screen as a coordinate/proportion master. Measure the logo, card, divider, input, buttons, OTP boxes, secure panel and bottom spacing relative to a 1080×2340 design canvas, then scale those positions to the target Android viewport.

## Folder Naming
Keep the asset filenames exactly as delivered in this folder.
