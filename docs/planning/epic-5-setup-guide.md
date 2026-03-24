# Epic 5 Setup Guide — Premium & In-App Purchases for Outfinder

This guide covers everything you (Alejandro) need to set up manually in web consoles before the dev agent can start coding Epic 5. Steps are ordered by dependency — complete them top to bottom.

**Current state:** RevenueCat account created. No Apple Developer Program account yet.

---

## Table of Contents

1. [Apple Developer Program Enrollment](#1-apple-developer-program-enrollment)
2. [Bundle ID & App ID Registration](#2-bundle-id--app-id-registration)
3. [App Store Connect — Create the App](#3-app-store-connect--create-the-app)
4. [In-App Purchase Product Configuration](#4-in-app-purchase-product-configuration)
5. [RevenueCat Project Setup](#5-revenuecat-project-setup)
6. [API Keys & Credentials](#6-api-keys--credentials)
7. [Sandbox Testing Setup](#7-sandbox-testing-setup)
8. [EAS Build Considerations](#8-eas-build-considerations)
9. [Pre-Development Checklist](#9-pre-development-checklist)

---

## 1. Apple Developer Program Enrollment

### What it is

The Apple Developer Program gives you access to App Store Connect, provisioning profiles, and the ability to distribute apps and configure in-app purchases. Without it, you cannot test or sell IAPs.

### Cost & Timeline

- **Cost:** $99 USD/year (prices vary by region — you will see the local currency equivalent during enrollment).
- **Timeline:** Enrollment typically completes within a few hours, but can take up to 48 hours if Apple needs additional identity verification.

### Steps

1. Go to [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/).
2. Sign in with your Apple Account (the one you use on your Mac/iPhone). Make sure **two-factor authentication** is enabled on this account — it is required.
3. Select **Individual / Sole Proprietor** enrollment type (you are an individual developer, not an organization).
4. Review and accept the Apple Developer Agreement.
5. Pay the $99 USD annual fee.
6. Wait for the confirmation email. Once confirmed, you will have access to:
   - [App Store Connect](https://appstoreconnect.apple.com)
   - [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/)

### Important

- Your Apple Account email becomes the account holder email. Use a permanent one.
- Keep your enrollment active (annual renewal) or your app will be removed from the App Store.

---

## 2. Bundle ID & App ID Registration

### Why this matters

Your current `app.json` uses `com.anonymous.outfinder` as the bundle identifier. This is the Expo default placeholder and **cannot be used for App Store distribution or in-app purchases**. You need to choose a real, permanent bundle ID and register it with Apple.

### Choosing your Bundle ID

Recommended format: `com.alejandrocamps.outfinder`

> Once registered, a bundle ID **cannot be deleted** — only archived. Choose carefully.

### Steps

1. Go to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/).
2. Click **Identifiers** in the sidebar.
3. Click the **+** button (top left).
4. Select **App IDs** and click Continue.
5. Select **App** (not App Clip) and click Continue.
6. Fill in:
   - **Description:** `Outfinder`
   - **Bundle ID:** Select **Explicit**, then enter `com.alejandrocamps.outfinder`
7. Under **Capabilities**, scroll down and check **In-App Purchase** (it may already be enabled by default).
8. Click **Continue**, then **Register**.

### What the dev agent will do

The agent will update `app.json` to use the new bundle ID:

```json
"ios": {
  "bundleIdentifier": "com.alejandrocamps.outfinder"
}
```

---

## 3. App Store Connect — Create the App

### Steps

1. Go to [App Store Connect](https://appstoreconnect.apple.com).
2. Click **Apps** (or **My Apps**).
3. Click the **+** button, then **New App**.
4. Fill in:
   - **Platforms:** iOS
   - **Name:** `Outfinder` (this is the display name on the App Store — can be changed later)
   - **Primary Language:** English (U.S.) — or Spanish, your preference
   - **Bundle ID:** Select the `com.alejandrocamps.outfinder` you registered in step 2
   - **SKU:** `outfinder` (internal identifier, never shown to users — just needs to be unique in your account)
   - **User Access:** Full Access
5. Click **Create**.

Your app is now created in App Store Connect. You do not need to upload a build or fill in metadata yet — you just need the app to exist so you can configure in-app purchases.

---

## 4. In-App Purchase Product Configuration

### Recommendation: Non-Consumable (Lifetime Unlock) vs Subscription

For Outfinder, I recommend a **non-consumable (one-time purchase)** to unlock premium features. Here is why:

| Factor | Non-Consumable (Lifetime) | Auto-Renewable Subscription |
|--------|--------------------------|----------------------------|
| User expectation | Color reference app = one-time tool purchase | Subscriptions suit content that updates frequently |
| Revenue model | Simpler, one payment | Recurring revenue, but higher churn risk |
| Implementation complexity | Simpler — no renewal logic, no grace periods | More complex — renewal states, billing retry, cancellation |
| Apple review | Straightforward | Apple scrutinizes subscription justification |
| Restore purchases | Simple — just restore the non-consumable | Must handle expiration, renewal, cancellation states |

**Verdict:** A non-consumable lifetime unlock at a one-time price (e.g., $4.99 or $6.99) fits Outfinder's nature as a color reference tool with no ongoing content updates. RevenueCat fully supports non-consumables.

> If you later want to offer a subscription tier too, you can add it without changing the non-consumable setup.

### Create the Non-Consumable Product

1. In App Store Connect, go to your **Outfinder** app.
2. In the sidebar, under **Monetization**, click **In-App Purchases**.
3. Click the **+** button.
4. Select **Non-Consumable**.
5. Fill in:
   - **Reference Name:** `Outfinder Premium Lifetime` (internal only — not shown to users)
   - **Product ID:** `outfinder_premium_lifetime`
6. Click **Create**.

### Configure the Product

After creation, you will land on the product detail page:

1. **Price Schedule:**
   - Click **Add Pricing**.
   - Set your **base country** (e.g., United States).
   - Choose a price tier (e.g., $4.99 or $6.99 — Apple uses fixed price tiers).
   - Apple automatically calculates equivalent prices for other countries.
   - Click **Confirm**.

2. **App Store Localization:**
   - Click **Add Localization**.
   - Language: English (U.S.)
   - **Display Name:** `Outfinder Premium` (shown to users on the purchase sheet)
   - **Description:** `Unlock unlimited favorites, share outfits, and access all premium features.`
   - Click **Save**.

3. **Review Screenshot:** You will need to add a screenshot of the IAP in context before submitting for review, but this is NOT needed for sandbox testing. Skip for now.

4. Click **Save** at the top.

> It can take up to 1 hour for the product to appear in the sandbox environment after saving.

### Product ID Summary

| What | Value |
|------|-------|
| Product ID (App Store Connect) | `outfinder_premium_lifetime` |
| Product type | Non-Consumable |
| Entitlement identifier (RevenueCat) | `outfinder_premium` |
| Offering identifier (RevenueCat) | `default` |

---

## 5. RevenueCat Project Setup

You already have a RevenueCat account. Now connect it to Apple and configure the product hierarchy.

### 5.1 Create a Project

1. Log in to [RevenueCat Dashboard](https://app.revenuecat.com).
2. If you do not already have a project, click **Create New Project**.
3. **Project name:** `Outfinder`

### 5.2 Add an Apple App Store App

1. Inside your Outfinder project, go to **Apps & providers** (left sidebar under Project Settings).
2. Click **+ New App**.
3. Select **App Store**.
4. Fill in:
   - **App name:** `Outfinder`
   - **Bundle ID:** `com.alejandrocamps.outfinder` (must match exactly what you registered with Apple)
5. Click **Save**.

> You will come back to this app's settings later to add the In-App Purchase Key (Section 6).

### 5.3 Create an Entitlement

Entitlements are the "access rights" your app checks. The app code will check: "Does this user have the `outfinder_premium` entitlement?"

1. In RevenueCat, go to **Entitlements** (left sidebar under Product Catalog).
2. Click **+ New Entitlement**.
3. Fill in:
   - **Identifier:** `outfinder_premium`
   - **Description:** `Access to all premium features`
4. Click **Save**.

### 5.4 Create a Product

1. Go to **Products** (left sidebar under Product Catalog).
2. Click **+ New Product**.
3. Fill in:
   - **Store:** App Store
   - **Product Identifier:** `outfinder_premium_lifetime` (must match the Product ID you created in App Store Connect exactly)
4. Click **Save**.

### 5.5 Attach the Product to the Entitlement

1. Go back to **Entitlements**.
2. Click on `outfinder_premium`.
3. Click **Attach Product**.
4. Select `outfinder_premium_lifetime`.
5. Click **Save**.

Now when a user purchases `outfinder_premium_lifetime`, RevenueCat will automatically grant them the `outfinder_premium` entitlement.

### 5.6 Create an Offering

Offerings define what products to show users. Using an offering lets you change which products are displayed without an app update.

1. Go to **Offerings** (left sidebar under Product Catalog).
2. You should see a `default` offering already created. If not, click **+ New Offering**:
   - **Identifier:** `default`
   - **Description:** `Outfinder default offering`
3. Click into the `default` offering.
4. Click **+ New Package**.
5. Fill in:
   - **Identifier:** Select **Lifetime** from the dropdown (this is a pre-defined package type for non-consumables)
6. Click **Add**.
7. Inside the new Lifetime package, click **Attach Product**.
8. Select `outfinder_premium_lifetime`.
9. Click **Save**.

---

## 6. API Keys & Credentials

Three pieces need connecting: (A) RevenueCat public API key for the app, (B) In-App Purchase Key from Apple to RevenueCat, (C) App Store Connect API key (optional but recommended).

### 6.A RevenueCat Public API Key (for the app code)

1. In RevenueCat Dashboard, go to **Apps & providers** > click your Outfinder iOS app.
2. Find **Public app-specific API key** (also labeled "Apple API Key" in the app settings).
3. Copy this key. It looks like: `appl_aBcDeFgHiJkLmNoPqRsTuVwXyZ`

**Where it goes:** The dev agent will use this key in the app code to initialize RevenueCat:

```typescript
Purchases.configure({ apiKey: "appl_XXXX..." });
```

> This is a PUBLIC key — safe to include in client code. It cannot be used to grant entitlements or access sensitive data.

**Action:** Save this key somewhere you can share with the dev agent (e.g., paste it in the story ticket or a `.env.local` file — the agent will reference it during Story 5.1).

### 6.B In-App Purchase Key (Apple to RevenueCat)

This key lets RevenueCat validate purchases with Apple's servers using StoreKit 2.

1. Go to [App Store Connect](https://appstoreconnect.apple.com) > **Users and Access**.
2. Click the **Integrations** tab.
3. Click **In-App Purchase** in the sidebar.
4. Click **Generate In-App Purchase Key**.
5. **Name:** `RevenueCat Outfinder`
6. Click **Generate**.
7. **Download** the `.p8` file immediately — Apple only lets you download it once.
8. Note the **Key ID** shown on the page.
9. Note the **Issuer ID** shown at the top of the In-App Purchase section.

Now upload to RevenueCat:

1. In RevenueCat Dashboard, go to **Apps & providers** > click your Outfinder iOS app.
2. Go to the **In-app purchase key configuration** tab.
3. Upload the `.p8` file you downloaded.
4. Enter the **Issuer ID**.
5. Enter the **Key ID**.
6. Click **Save**.

### 6.C App Store Connect API Key (optional, recommended)

This lets RevenueCat import your product catalog directly from App Store Connect and provides better server-to-server communication.

1. Go to [App Store Connect](https://appstoreconnect.apple.com) > **Users and Access** > **Integrations** > **App Store Connect API**.
2. Click **Generate API Key**.
3. **Name:** `RevenueCat`
4. **Access:** `Admin` (or `App Manager` at minimum)
5. Download the `.p8` file and note the **Key ID** and **Issuer ID**.
6. In RevenueCat, go to **Apps & providers** > Outfinder iOS app > **App Store Connect API key configuration** tab.
7. Upload the `.p8` file, enter Key ID and Issuer ID.
8. Click **Save**.

---

## 7. Sandbox Testing Setup

Sandbox testing lets you make real purchase flows without being charged.

### 7.1 Create a Sandbox Tester Account

1. Go to [App Store Connect](https://appstoreconnect.apple.com) > **Users and Access**.
2. Click the **Sandbox** tab.
3. Click **+** to add a new sandbox tester.
4. Fill in:
   - **First Name / Last Name:** Anything (e.g., `Test` `User`)
   - **Email:** Use a real email you can access, but it **cannot be an existing Apple ID**. Tip: if you use Gmail, use the `+` trick: `alejandro+sandbox@gmail.com`
   - **Password:** Choose a strong password — you will need it on your test device
   - **Country/Region:** Your region
5. Click **Create**.

### 7.2 Sign In on Your Test Device

1. On your iPhone (iOS 18+), go to **Settings > Developer > Sandbox Apple Account**.
   - On older iOS: Settings > App Store > Sandbox Account (at the bottom).
2. Sign in with the sandbox tester email and password you just created.

> Your regular Apple ID stays signed in for the main App Store. The sandbox account is separate and only activates for sandbox-environment apps.

### 7.3 How Sandbox Purchases Work

- When you run a development build on your device and trigger a purchase, iOS will use the sandbox account automatically.
- You will see a `[Environment: Sandbox]` label on the purchase dialog.
- **You will not be charged.** All transactions are simulated.
- Non-consumable purchases persist in the sandbox until you clear purchase history: App Store Connect > Sandbox tab > click your tester > **Clear Purchase History**.

### 7.4 RevenueCat Sandbox Dashboard

- In RevenueCat Dashboard, sandbox transactions appear under **Customers** with a sandbox indicator.
- You can look up a specific sandbox customer by their app user ID to verify entitlements were granted correctly.

---

## 8. EAS Build Considerations

### Why You Need Development Builds

Expo Go does **not** support in-app purchases — it lacks the native StoreKit APIs. You must use EAS Build to create a development build that includes the native `react-native-purchases` module.

### What the Dev Agent Will Set Up in Code

The dev agent will handle all of the following during Epic 5 stories:

1. **Install dependencies:**
   ```bash
   pnpm add react-native-purchases
   pnpm add -D expo-dev-client
   ```

2. **Update `app.json` plugins:**
   ```json
   "plugins": [
     "expo-dev-client",
     "react-native-purchases-expo-plugin"
   ]
   ```

3. **Configure `eas.json`** (if not already present) with build profiles for development and preview.

### What You May Need to Do

1. **Install EAS CLI** (if not already installed):
   ```bash
   pnpm add -g eas-cli
   ```

2. **Log in to EAS:**
   ```bash
   eas login
   ```

3. **Link to your Apple Developer account** — the first time you run `eas build`, it will prompt you to sign in with your Apple ID. EAS will manage provisioning profiles and signing certificates automatically.

4. **Create a development build:**
   ```bash
   eas build --platform ios --profile development
   ```
   This builds an `.ipa` that you install on your physical iPhone for testing. The build runs on Expo's cloud servers.

5. **For simulator testing** (limited — StoreKit sandbox works better on a real device):
   ```bash
   eas build --platform ios --profile development-simulator
   ```

### TestFlight (Later, for Beta Testing)

When you are ready for beta testers:

```bash
eas build --platform ios --profile preview
eas submit --platform ios
```

This uploads the build to TestFlight. Note: as of December 2024, TestFlight subscription renewals happen every 24 hours (not accelerated like they used to be). For non-consumables, this does not matter.

---

## 9. Pre-Development Checklist

Before the dev agent starts Epic 5, verify every item below is complete:

### Apple Developer Program
- [ ] Apple Developer Program enrollment confirmed and active ($99/year paid)
- [ ] Access to [App Store Connect](https://appstoreconnect.apple.com) confirmed
- [ ] Access to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/) confirmed

### App Identity
- [ ] Bundle ID registered: `com.alejandrocamps.outfinder` (or your chosen ID)
- [ ] Outfinder app created in App Store Connect with the registered Bundle ID

### In-App Purchase Product
- [ ] Non-consumable product created with Product ID: `outfinder_premium_lifetime`
- [ ] Price schedule configured (e.g., $4.99 or $6.99 USD)
- [ ] At least one localization added (English display name and description)

### RevenueCat Configuration
- [ ] RevenueCat project "Outfinder" created
- [ ] Apple App Store app added with Bundle ID `com.alejandrocamps.outfinder`
- [ ] Entitlement created: `outfinder_premium`
- [ ] Product created: `outfinder_premium_lifetime` (App Store)
- [ ] Product attached to entitlement `outfinder_premium`
- [ ] Offering `default` configured with a `Lifetime` package containing the product
- [ ] In-App Purchase Key (`.p8`) uploaded to RevenueCat with Issuer ID and Key ID

### API Keys Ready for Dev Agent
- [ ] RevenueCat public API key copied and saved (starts with `appl_`)
- [ ] Decided where to store it for the dev agent (env file, story ticket, etc.)

### Sandbox Testing
- [ ] Sandbox tester account created in App Store Connect
- [ ] Sandbox tester signed in on test iPhone (Settings > Developer > Sandbox Apple Account)

### EAS & Tooling
- [ ] EAS CLI installed (`eas-cli`)
- [ ] Logged in to EAS (`eas login`)
- [ ] Confirmed you can run `eas build` (does not need to be a full build — just verify the CLI works)

---

## Quick Reference — Identifiers Summary

| What | Value |
|------|-------|
| Bundle ID | `com.alejandrocamps.outfinder` |
| App Store Connect SKU | `outfinder` |
| IAP Product ID | `outfinder_premium_lifetime` |
| IAP Type | Non-Consumable |
| RevenueCat Entitlement | `outfinder_premium` |
| RevenueCat Offering | `default` |
| RevenueCat Package | `Lifetime` |
| RevenueCat API Key prefix | `appl_` |

---

## What the Dev Agent Handles (Do NOT Do These Manually)

The following will be done in code during Epic 5 stories — listed here so you know what NOT to worry about:

- Installing `react-native-purchases` and `expo-dev-client`
- Adding the RevenueCat Expo config plugin to `app.json`
- Updating the bundle ID in `app.json`
- Creating `PremiumContext` (follows the `FavoritesContext` pattern)
- Building the paywall UI component
- Implementing purchase flow, restore purchases, and entitlement checks
- Caching premium status in `expo-secure-store`
- All TypeScript types and tests

---

*Guide created: 2026-03-18. Review RevenueCat and Apple docs for any changes if more than a few months have passed.*
