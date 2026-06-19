# Family Meal Planner & Recipe Hub - Next.js MVP

Welcome to the production-quality MVP of the **Family Meal Planner & Recipe Hub**, built to fulfill the specifications in `GEMINI.md`.

---

## Technical Stack & Architecture

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **UI Components**: custom premium components using Lucide icons, Outfit typography, and CSS-based responsive charts/gauges.

### Feature-Based Clean Architecture
- `src/app/`: App routing and pages (Dashboard, Browse Recipes, Recipe Details, Add/Edit Recipe, Weekly Planner, Recommendations, Search Results).
- `src/app/actions/`: Encapsulated Next.js Server Actions for CRUD operations, weekly plan persistence, and recommendation queries.
- `src/components/recipe/`: Highly interactive React components (`RecipeCard`, `PortionScaler`, `SpiceScaler`, `IngredientList`, `NutritionBadge`, `WeeklyCalendar`, `NutritionDashboard`, `SearchFilters`).
- `src/lib/`: Global utilities, types, and the shared global Prisma database client.

---

## Elite Feature: DB / JSON Fallback Layer

Setting up PostgreSQL can be a hassle during initial local development. To ensure a **seamless developer onboarding experience**, this MVP implements a fail-safe data layer in `src/app/actions/recipes.ts`:

1. **Database Direct Mode**: If PostgreSQL is running and you have run migrations, the app writes/reads all recipe data and calendar events directly to/from your PostgreSQL database.
2. **Local File Fallback Mode**: If the database is not reachable, the app automatically detects this, logs a warning on the server console, and gracefully switches to reading from `recipes.json` and reading/writing to `plans.json` in the root folder.

*Result*: All features (CRUD, drag-and-drop planning, recipe scaling, search, and nutrition scores) are fully functional immediately, even with no database configuration!

---

## Getting Started & Manual Run Guide

This project is a unified Next.js App Router application. The **frontend** (React UI) and the **backend** (Server Actions & API routes) run together on the same port. 

Below are the steps to set up and run both the database backend and the application servers manually.

---

### Step 1: Install Dependencies
Download packages and install platform-specific native binaries (e.g. Turbopack and LightningCSS modules):
```bash
npm install
```

### Step 2: Database Setup (Backend Database)
By default, the application runs in a **JSON File Fallback Mode** if no database is connected. To run manually with PostgreSQL:

1. **Start PostgreSQL**: Start your local PostgreSQL server.
   * On macOS (via Homebrew):
     ```bash
     brew services start postgresql
     ```
   * Or run it via Docker:
     ```bash
     docker run --name mealplanner-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=meal_planner -p 5432:5432 -d postgres
     ```
2. **Configure Connection**: Verify `DATABASE_URL` in your `.env` file matches your PostgreSQL credentials:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/meal_planner?schema=public"
   ```
3. **Generate Prisma Client**: Compile type-safe Prisma bindings:
   ```bash
   npm run prisma:generate
   ```
4. **Push DB Schema**: Push the Prisma database schema and create tables:
   ```bash
   npm run prisma:push
   ```
5. **Seed Example Recipes**: Seed the database with 57 unique recipes parsed from `meals.docx`:
   ```bash
   npm run seed
   ```

---

### Step 3: Run the Frontend & Backend Application

You can start the combined application in either **Development Mode** or **Production Mode**.

#### Option A: Running Development Mode (Hot-Reloading)
Start the unified frontend/backend development server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

#### Option B: Running Production Mode (Optimized)
Build the optimized bundle and start the production server manually:
1. **Compile Build**:
   ```bash
   npm run build
   ```
2. **Start Server**:
   ```bash
   npm run start
   ```
    Open **[http://localhost:3000](http://localhost:3000)** in your browser.
---

### Step 4: Connecting Firebase (Cloud Fallback for Vercel)

Vercel functions are serverless and the local filesystem is non-persistent. To write and save data dynamically on your Vercel deployment without PostgreSQL, the app uses **Firebase Firestore** as a cloud database.

To configure Firebase for Vercel:

1. **Create Firebase Project & Firestore**:
   * Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
   * Navigate to **Firestore Database** and click **Create database** (Native mode, production rules or test mode).
2. **Register Web App**:
   * In your project dashboard, click **Add app** and select **Web** (`</>`).
   * Give your app a name and register it to generate the config object containing key parameters (`apiKey`, `projectId`, etc.).
3. **Configure Environment Variables**:
   * Add the following variables to your Vercel project's **Environment Variables** (and to your local `.env` for testing):
     * `NEXT_PUBLIC_FIREBASE_API_KEY`
     * `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     * `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     * `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     * `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     * `NEXT_PUBLIC_FIREBASE_APP_ID`

Once these keys are provided, the application will automatically detect them and save recipes, plans, and shopping list data to **Cloud Firestore** whenever PostgreSQL is unavailable. Recipes are seeded to Firestore automatically on first load!
---

## Core MVP Features Implemented

1. **Dashboard (`/`)**: Highlighting today's planned meals, tomorrow's preview, recently added recipes, and a visual macro progress dashboard.
2. **Recipe Browse (`/recipes`)**: Browse all 57 recipes with details. Sort and search instantly.
3. **Advanced Search (`/search`)**: Full combinations of filters (ingredient matching, cuisines, spice level, occasions, flavor profile, and fitness nutrition goals).
4. **Recipe Details (`/recipes/[id]`)**:
   - **Portion Scaler**: Increment/decrement servings dynamically. Ingredients scale instantly with no page refresh.
   - **Spice Slider (0-5)**: Scales spicy ingredients (chili, cayenne, jalapeño, hot sauce, etc.) and highlights changes in green/red text.
   - **Full Nutrition Grid**: Shows calories, protein, carbs, fat, fiber, sugar, sodium, and 8 essential vitamins/minerals.
5. **Weekly Planner (`/planner`)**: A drag-and-drop Monday-Sunday calendar. Click or drag recipes to assign them.
6. **Smart Recommendations (`/recommendations`)**: Displays curated recommendation categories: High Protein, Healthy, Quick Dinner, Family Favorite, Meal Prep, and New Suggestions, ignoring already planned meals to preserve variety.
7. **Nutrition Intelligence Dashboard**: Tracks planned menus and computes a Wellness Score, Macro Balance Score, and Micronutrient Coverage. Suggests adjustments like adding iron-rich meals or increasing protein on specific days.
