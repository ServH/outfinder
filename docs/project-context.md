# Project Context — Outfinder

## What is this project?

A React Native iOS app that transforms Sanzo Wada's 1930s color masterwork — "A Dictionary of Color Combinations" — into a visual outfit coordination tool. Users select a garment color, see curated harmonious combinations, and visualize them as customizable clothing silhouettes they can share on Instagram and TikTok.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.83 + TypeScript |
| Platform | Expo SDK 55 (managed workflow) |
| Styling | NativeWind 4.2.2 (Tailwind CSS for RN) |
| Navigation | React Navigation 7 |
| Animations | Reanimated 4.2.2 |
| IAP | RevenueCat (react-native-purchases) |
| Storage | AsyncStorage + expo-secure-store |
| Linting | Biome |
| Testing | Jest + React Native Testing Library |

## Architecture

- **Client-side only** — no backend, no API, no database
- **Static JSON dataset** (~60KB) bundled in binary at build time
- **Offline-first** — full functionality without network
- **iOS only MVP** — iPhone SE 3rd gen to iPhone 16 Pro Max, portrait only

## Current Status

- Story 1.0: Workspace setup (this story)
- 6 epics planned, 15+ stories total
- Planning validated: implementation readiness passed 2026-03-12
