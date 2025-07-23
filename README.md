This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy on GitHub Pages

To deploy the static build under a subpath like `https://USERNAME.github.io/lightgun-web/`,
the build must know the repository name. The workflow sets the `NEXT_PUBLIC_BASE_PATH`
environment variable and `next.config.ts` reads it to configure `basePath` and
`assetPrefix`. When building locally you can replicate this with:

```bash
NEXT_PUBLIC_BASE_PATH=/lightgun-web npm run build
```

When referencing static files in code, prefix paths with `withBasePath()` from
`src/utils/basePath` to ensure they work both locally and when deployed under a
subpath.

## Project Overview

This project is a TypeScript-based Next.js game. It uses React hooks and the Next.js app router to deliver a browser-based shooter under `src/games/warbirds`.

### Project Layout

```
src/
  app/            -> Next.js "app router" files (layout, pages, styles)
  constants/      -> Game constants for assets and gameplay values
  games/
    warbirds/     -> Actual game implementation (components, hooks, logic)
  hooks/          -> General React hooks (audio, window size)
  styles/         -> Global CSS
  types/          -> TypeScript interfaces used across the game
  utils/          -> Helper modules (environment drawing, physics, audio helpers)
public/           -> Game assets (images, sound)
```

### Key Points for New Contributors

1. **Game Loop** – Most gameplay logic lives in `src/games/warbirds/useGameEngine.ts`. Understanding its state structure and render/update loops is crucial.
2. **Asset Management** – Assets load via hooks in `src/hooks`. `useGameAssets` handles images, while `useGameAudio` manages sound effects.
3. **Constants and Types** – Values under `src/constants` and interfaces under `src/types` define gameplay tuning and object shapes.
4. **Next.js Setup** – Game pages reside in `src/app`, with `/main` serving as the entry point for the main game.

### Suggested Next Steps

- Review `useGameEngine.ts` and `games/warbirds/utils.ts` to see how spawning, physics, and rendering are implemented.
- Explore the `src/constants` directory to understand configurable gameplay values.
- Inspect assets in `public/` so you can extend graphics and audio.
- Familiarize yourself with React hooks and the Next.js app router.

