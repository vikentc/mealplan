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

## Getting Started

### 1. Install Dependencies
Run the following in the project root:
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npm run prisma:generate
```

### 3. Start PostgreSQL and Migrate (Optional)
If you have PostgreSQL running:
1. Update `DATABASE_URL` in your `.env` file.
2. Run database migration and schema setup:
   ```bash
   npm run prisma:push
   ```
3. Seed the database with the 57 unique recipes parsed from `meals.docx`:
   ```bash
   npm run seed
   ```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

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
