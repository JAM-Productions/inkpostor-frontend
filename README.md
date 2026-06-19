# Inkpostor

A real-time multiplayer drawing and deduction game built with React, Vite, and Socket.IO.

## Concept

Inkpostor is a creative social deduction game. Players are given a secret word and must draw it together on a shared canvas. However, one player is the **Inkpostor**: they don't know the word and must blend in by looking at what others are drawing. After the drawing phase, players vote on who they think the Inkpostor is!

## Tech Stack

- **Frontend Framework:** React (+ TypeScript).
- **Tooling:** Vite
- **Styling:** Tailwind CSS + Lucide Icons
- **State Management:** Zustand
- **Real-time Communication:** Socket.IO Client
- **Testing:** Vitest, React Testing Library
- **Linting & Formatting:** ESLint, Oxlint, Prettier

## Running Locally

1. **Install Dependencies:**

   ```bash
   pnpm install
   ```

2. **Start the Development Server:**

   ```bash
   pnpm dev
   ```

3. **Running the Tests:**

   ```bash
   # Run tests once
   pnpm test

   # Run tests with coverage
   pnpm test:coverage
   ```

4. **Linting and Formatting:**

   ```bash
   # Run ESLint
   pnpm lint

   # Format code with Prettier
   pnpm format
   ```

## Production Build

To preview the production build locally:

```bash
pnpm build
pnpm preview
```
