# Movie Chain App

A React learning project where movies are chained together through shared actors. Start with any movie, pick an actor from it, then pick one of their other movies — and keep going!

## Rules of the Chain

1. Pick a starting movie (from trending or search)
2. Pick an actor from that movie's cast
3. Pick a movie from that actor's filmography
4. Pick a new actor from the new movie — but **not** the actor that connected you to this movie
5. Repeat! Actors can reappear after skipping one movie

## Tech Stack

- **React 18** + **TypeScript** (via Vite)
- **Tailwind CSS** for styling
- **React Router v6** for navigation
- **TMDB API** for movie and actor data
- **localStorage** for persisting chain progress and comments

## Getting Started

### 1. Get a TMDB API Key

1. Sign up at [themoviedb.org](https://www.themoviedb.org/signup)
2. Go to [API settings](https://www.themoviedb.org/settings/api) and request an API key
3. Copy your API key (v3 auth)

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and replace `your_tmdb_api_key_here` with your actual API key.

### 3. Install and Run

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Project Structure

```
src/
  types/movie.ts          - TypeScript interfaces
  services/tmdb.ts        - TMDB API wrapper
  hooks/
    useChain.ts           - Chain state management + localStorage
    useMovieDetails.ts    - Fetch movie details + credits
    useActorDetails.ts    - Fetch actor details + filmography
  context/ChainContext.tsx - React context for sharing chain state
  components/
    Layout.tsx            - App shell with header
    StartScreen.tsx       - Initial movie selection (trending + search)
    MovieCard.tsx         - Movie detail card
    ActorCard.tsx         - Actor card (reusable)
    ActorPicker.tsx       - Grid of actors to pick from
    MovieSuggestions.tsx   - Grid of suggested movies from actor
    ChainList.tsx         - Sidebar showing the movie chain
    UserComment.tsx       - Add/edit notes per movie
    ScrollToTop.tsx       - Scroll to top on navigation
  pages/
    HomePage.tsx          - Main chain view
    MovieDetailPage.tsx   - Full movie detail page
    ActorDetailPage.tsx   - Full actor detail page
```

## Key React Concepts

This project exercises these React patterns (helpful for learning):

- **Functional components** with props and TypeScript
- **Hooks**: useState, useEffect, useCallback, useContext
- **Custom hooks** for data fetching and state management
- **Context API** for sharing state without prop drilling
- **React Router** for client-side navigation
- **Conditional rendering** and loading/error states
- **Controlled inputs** (search, comments)
- **Lists with keys** and efficient rendering
