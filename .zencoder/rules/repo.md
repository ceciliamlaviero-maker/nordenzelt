---
description: Repository Information Overview
alwaysApply: true
---

# azesc Information

## Summary
A modern web application built with **Next.js 14**, featuring **TypeScript**, **Tailwind CSS**, and **Supabase** for backend services. The project follows the Next.js App Router architecture and focuses on a clean, component-based UI.

## Structure
- **src/app/**: Core application logic using the Next.js App Router, including global styles, layouts, and page definitions.
- **src/components/**: Reusable UI components (e.g., `ImageCarousel.tsx`) to maintain a consistent design across the app.
- **src/lib/**: Library code and service initializations, such as the Supabase client configuration.
- **public/**: Static assets including images and other public resources.
- **.next/**: Build output and cache directory.

## Language & Runtime
**Language**: TypeScript  
**Version**: Node.js (Runtime), Next.js 14.1.0, React 18, TypeScript 5  
**Build System**: Next.js  
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- `next`: 14.1.0
- `react`: ^18
- `@supabase/supabase-js`: ^2.39.7
- `lucide-react`: ^0.330.0
- `react-hook-form`: ^7.50.1
- `tailwind-merge`: ^2.2.1
- `clsx`: ^2.1.0

**Development Dependencies**:
- `typescript`: ^5
- `tailwindcss`: ^3.3.0
- `postcss`: ^8
- `autoprefixer`: ^10.0.1
- `eslint`: ^8

## Build & Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Testing
No testing framework is currently configured in the project. Linting is handled via **ESLint** with the `eslint-config-next` configuration.

**Run Lint**:
```bash
npm run lint
```
