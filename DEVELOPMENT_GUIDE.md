# FarmPrism Development Guide

## Prerequisites

- Node.js with npm. Use a current LTS Node.js release compatible with Expo SDK 57.
- Git.
- Android Studio and an Android emulator or device for Android development.
- macOS with Xcode for iOS development.
- Expo Go or an Expo development build where appropriate.

The project is not a Python project and does not use a Python environment or `requirements.txt`.

## Technology Versions

The versions below come from `package.json` and the installed lockfile:

- Expo: `~57.0.20`
- React: `19.2.3`
- React Native: `0.86.3`
- TypeScript: `~6.0.3` (`6.0.3` installed)
- Supabase JS: `^2.115.0` (`2.115.0` installed)
- React Navigation: `@react-navigation/native` `7.3.18`; `@react-navigation/native-stack` `7.18.10`
- AsyncStorage: `3.1.1`
- Safe area context: `5.9.1`
- React Native Screens: `4.27.0`
- Expo Status Bar: `57.0.1`
- React type definitions: `@types/react` `~19.2.2` (`19.2.18` installed)

## Setup

1. Install Node.js and npm.
2. Clone the repository.
3. Check out the Development branch:

   ```powershell
   git checkout Development
   ```

4. Install dependencies:

   ```powershell
   npm install
   ```

5. Copy `.env.example` to a local `.env` file and fill in the public Supabase values.
6. Start Expo:

   ```powershell
   npm start
   ```

The repository's dependency source of truth is `package.json` and `package-lock.json`.

## Environment Variables

Required public variables:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`EXPO_PUBLIC_SUPABASE_ANON_KEY` remains supported as a compatibility fallback by the environment adapter, but new local configuration should use the publishable key name.

Never commit `.env`, real credentials, service-role keys, private API keys, or generated secrets. The mobile application must never use a service-role key.

## Run Commands

```powershell
npm start
npm run android
npm run ios
npm run web
```

Android requires an emulator/device. iOS requires macOS and Xcode. Web is supported by the current Expo project configuration.

## Validation

TypeScript:

```powershell
npm run typecheck
```

Expo bundle validation:

```powershell
npx expo export --platform android
```

Linting is not currently configured. Testing is not currently configured. Do not report either as passing until scripts are added.

## Architecture

```text
src/
  app/          composition root and providers
  components/   reusable UI components
  config/       environment and role configuration
  hooks/        React state access hooks
  lib/          Supabase client and helpers
  navigation/  root, auth, onboarding, and protected navigation
  screens/      common flow and placeholder screens
  services/     Auth, preferences, and role data access
  types/        shared TypeScript types
  utils/        utility exports
  styles/       shared theme exports
```

The app uses explicit React Navigation. The Expo package may mention an optional router integration in its dependency metadata, but Expo Router is not an application dependency or routing implementation here.

## Supabase Configuration

Supabase is already provisioned separately. Do not create tables, migrations, SQL, or RLS changes from this repository. Use the existing service layer and the authenticated Supabase client. The frontend relies on Supabase Auth, `user_preferences`, `roles`, and `user_roles` for the current foundation.

## Branch Workflow

- Development work belongs on the `Development` branch.
- Review the current worktree before editing.
- Keep commits focused and do not commit generated secrets.
- Do not perform destructive refactors or history operations without explicit approval.

## Debugging

Use the Expo terminal output and device logs for runtime issues. Start with:

```powershell
npm run typecheck
npx expo config --type public
npx expo export --platform android
```

For authentication and role issues, verify the local public environment values, Supabase Auth configuration, assigned `user_roles`, and the existing RLS policies without modifying them.
