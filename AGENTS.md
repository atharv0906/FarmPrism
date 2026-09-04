# FarmPrism Agent Rules

- Read `PROJECT_REQUIREMENTS.md` first.
- Read `DEVELOPMENT_GUIDE.md` before changing architecture.
- Inspect existing code before creating files or functionality.
- Preserve the existing Expo/React Native/TypeScript architecture.
- Do not recreate existing functionality or invent requirements.
- FarmPrism has exactly three roles: `farmer`, `buyer`, and `logistics`.
- Supabase is the source of truth for Auth, roles, preferences, and application data.
- Do not modify Supabase, create SQL migrations, change tables, or change RLS without explicit human approval.
- Never expose service-role, private, or secret API credentials in frontend code.
- Do not store passwords or authentication tokens manually.
- Do not use fake data when implementing real features.
- Do not implement final UI designs before approved designs are supplied.
- Maintain strict TypeScript and existing service/provider/navigation boundaries.
- Run `npm run typecheck` after meaningful changes.
- Use `npm install` and the appropriate Expo validation/build command when dependencies or app configuration change.
- Do not perform destructive refactors or history operations without approval.
