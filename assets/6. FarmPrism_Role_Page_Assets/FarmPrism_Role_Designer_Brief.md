# FarmPrism Role Selection — Designer / Developer Asset Brief

## Visual Master
- `role_reference_1080x2340.png`
- Exact size: **1080 × 2340 px**
- Use as a measurement/visual reference only.
- Do not use the complete screenshot as the production UI.

## Artwork Assets
- `role_farmprism_logo.png`
- `role_top_left_leaves.png`
- `role_top_right_leaves.png`
- `role_divider_sprout.png`
- `role_farmer_illustration.png`
- `role_fpo_illustration.png`
- `role_buyer_illustration.png`
- `role_logistics_illustration.png`
- `role_bottom_landscape.png`
- `role_bottom_leaf_cluster.png`

## Native UI — Build in Code
Do not bake these into image assets:
- “Choose Your Role”
- Subtitle text
- Farmer / FPO Dashboard / Buyer Marketplace / Logistics Console titles
- Role descriptions
- Circular role icons
- Select Role buttons
- “Together, let’s build a better tomorrow.” text
- Bottom support line
- Back and Continue buttons
- Card backgrounds, borders, rounded corners, shadows

## Layout Reference
- Warm cream background.
- Decorative leaves in both upper corners.
- Centered FarmPrism logo.
- Large centered heading/subtitle.
- Small leaf divider under subtitle.
- 2×2 grid of large role cards.
- Each card uses one role illustration across its upper section.
- Bottom information banner with decorative leaf artwork.
- Back and Continue buttons below the banner.
- Large farm landscape anchored to the bottom edge.

## Asset Rules
- Individual PNG artwork keeps its native aspect ratio.
- Transparent artwork must have true alpha transparency.
- Do not stretch individual assets to 1080×2340.
- Only the full reference screen is normalized to 1080×2340.
- No checkerboard pixels, white boxes, clipped shadows, or screenshot crops.

## Role Mapping
- Farmer → `role_farmer_illustration.png`
- FPO Dashboard → `role_fpo_illustration.png`
- Buyer Marketplace → `role_buyer_illustration.png`
- Logistics Console → `role_logistics_illustration.png`

## Developer Handoff
Use `role_reference_1080x2340.png` as a design-coordinate master. Measure the logo, heading, card grid, information banner, buttons, and landscape against a 1080×2340 canvas, then map those ratios responsively to the actual Android viewport.
