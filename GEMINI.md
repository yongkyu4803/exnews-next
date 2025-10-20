# Project Overview

This is a Next.js web application called "exnews-viewer". It functions as a news aggregator, fetching and displaying news articles from a Supabase backend. The application is designed as a Progressive Web App (PWA) with a mobile-first, responsive interface.

**Key Technologies:**

*   **Framework:** Next.js
*   **UI Library:** Ant Design (antd)
*   **Data Fetching:** React Query
*   **Backend:** Supabase
*   **Language:** TypeScript

**Architecture:**

*   The application follows a standard Next.js project structure.
*   The frontend is built with React and Ant Design components.
*   Data is fetched from a Supabase backend through API routes located in `src/pages/api`.
*   The application is configured as a PWA, allowing for offline access and installation on mobile devices.

# Building and Running

**1. Install Dependencies:**

```bash
npm install
```

**2. Run in Development Mode:**

```bash
npm run dev
```

This will start the development server at `http://localhost:3000`.

**3. Build for Production:**

```bash
npm run build
```

**4. Start Production Server:**

```bash
npm run start
```

**5. Linting:**

```bash
npm run lint
```

# Development Conventions

*   **Coding Style:** The project uses TypeScript and follows standard React and Next.js coding conventions. ESLint is configured to enforce code quality.
*   **Component Structure:** Components are organized into `src/components`, with subdirectories for mobile-specific components and common components.
*   **API Routes:** API logic is handled in `src/pages/api`, with separate files for different data types (e.g., news, categories).
*   **Data Management:** React Query is used for managing server-state, including caching, refetching, and error handling.
*   **Styling:** The project uses a combination of Ant Design's styling system and CSS modules.
