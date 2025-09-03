# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Architecture

This is a Next.js 15.5.2 application using the App Router pattern with PatternFly React components for the UI framework.

### Core Dependencies
- **UI Framework**: PatternFly React (@patternfly/react-core, @patternfly/react-icons, @patternfly/react-tokens)
- **Icons**: RHDS Icons (@rhds/icons) for extended icon library
- **Framework**: Next.js 15.5.2 with React 19.1.0
- **Styling**: PatternFly base styles + custom globals.css

### App Structure
- **app/page.tsx** - Main page with PatternFly LoginPage component (SimpleLoginPage)
- **app/chat/page.tsx** - Chat interface with full page layout including masthead, sidebar navigation, and main content
- **app/library/page.tsx** - Library page (placeholder)
- **app/components/ClientOnly.tsx** - Wrapper component for client-side only rendering (prevents hydration issues)
- **app/layout.tsx** - Root layout with PatternFly base styles and Geist font configuration

### Key Patterns
- All interactive components use `'use client'` directive for client-side rendering
- ClientOnly wrapper prevents hydration mismatches for components requiring browser APIs
- PatternFly components imported from specific paths (e.g., `@patternfly/react-core`)
- RHDS icons wrapped in IconWrapper component to convert HTML elements to React components
- State management using React hooks (useState, useEffect)

### PatternFly Integration
- PatternFly base CSS imported in layout.tsx
- Components follow PatternFly design patterns (LoginPage, Page with masthead/sidebar, navigation)
- Uses PatternFly's component composition pattern (e.g., LoginPage with LoginForm, Page with Masthead/Sidebar)

### Development Notes
- Uses Turbopack for faster development builds
- TypeScript configuration present
- Prettier configured for code formatting
- ESLint configured with Next.js rules