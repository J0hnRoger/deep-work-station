# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Deep Work Station is a single-page React application built for focus and productivity. The project combines an audio player with Pomodoro timers and includes plans for WakaTime integration and 3D gamification features.

**Current Status**: Phase 1 implementation (SPA only) - audio player with timer functionality.

## Common Commands

Development:
```bash
cd frontend
npm install
npm run dev          # Start development server on port 3000
npm run start        # Alternative start command
```

Building and Testing:
```bash
npm run build        # Build for production (includes TypeScript compilation)
npm run test         # Run tests with Vitest
npm run lint         # Run ESLint
npm run format       # Run Prettier
npm run check        # Format and lint fix in one command
```

Preview:
```bash
npm run serve        # Preview production build
```

## Architecture

### Frontend Stack
- **React 18** with TypeScript
- **TanStack Router** for file-based routing
- **Vite** as build tool with HMR
- **Tailwind CSS v4** for styling (via @tailwindcss/vite)
- **Vitest** for testing with jsdom environment
- **ESLint** with @tanstack/eslint-config

### Key Directory Structure
```
frontend/src/
├── components/           # Reusable React components
├── routes/              # File-based routes (TanStack Router)
│   ├── __root.tsx       # Root layout with Header and Outlet
│   └── index.tsx        # Home page
├── main.tsx             # Entry point with router setup
└── styles.css           # Global styles
```

### Routing System
- Uses TanStack Router with file-based routing
- Routes are auto-generated in `routeTree.gen.ts`
- Root layout includes Header component and devtools
- Supports lazy loading and code splitting

### Development Notes
- Vite alias: `@` points to `./src`
- TypeScript strict mode enabled
- Development server runs on port 3000
- Auto code splitting enabled for routes

## Planned Features (Future Phases)

**Phase 2**: .NET 9 backend with Redis, WakaTime API integration
**Phase 3**: React Three Fiber gamification with 3D forest visualization

## Key Implementation Details

### Audio System (Planned)
- Web Audio API for gapless playback and crossfading
- SharePoint or Azure Blob Storage for audio sources
- EQ presets using BiquadFilterNode

### Command Palette (Planned)
- Ctrl+K activation for keyboard-centric workflow
- Commands for session control, audio, and project management

### Timer Modes (Planned)
- Pomodoro: 25/5 minutes
- Deep Work: 50/10 minutes  
- Custom durations