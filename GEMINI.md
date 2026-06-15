# Family Meal Planner & Recipe Hub

## Project Vision

Build a modern web application that serves as a central family cooking and meal-planning hub.

The application should help family members:

* Discover meals and recipes
* Plan weekly meals
* Adjust recipes based on portions
* Adjust spice levels dynamically
* Receive meal recommendations
* Search recipes using multiple criteria
* Maintain a healthy, fitness-oriented diet

The experience should be simple enough for everyday use while being powerful enough to grow into a large recipe database.

---

# Core Goals

1. Recipe Management
2. Smart Search & Discovery
3. Weekly Meal Planning
4. Nutrition Optimization
5. Recipe Scaling
6. Personalized Recommendations

---

# Users

Primary users:

* Parents
* Family members
* Fitness-focused adults
* People meal-prepping
* Anyone contributing recipes

No complex onboarding required.

---

# Recipe Data Model

Each recipe should contain:

## Basic Information

* id
* name
* description
* image
* preparation time
* cooking time
* total time
* servings
* difficulty

## Categorization

* cuisine
* country of origin
* region
* meal type

  * breakfast
  * lunch
  * dinner
  * snack
* occasion

  * weekday
  * weekend
  * family dinner
  * celebration
  * meal prep
  * date night
  * quick meal

## Flavor Profile

Multiple tags:

* spicy
* sweet
* savory
* sour
* umami
* smoky
* fresh
* creamy
* tangy
* rich
* light

## Mood Tags

Examples:

* comfort food
* healthy
* high protein
* cozy
* refreshing
* indulgent
* energizing
* quick and easy

## Ingredients

Each ingredient contains:

* name
* quantity
* unit
* optional flag

Example:

{
"name": "Chicken Breast",
"quantity": 500,
"unit": "g"
}

## Instructions

Ordered list of steps.

## Nutrition

Per serving:

* calories
* protein
* carbohydrates
* fat
* fiber
* sugar
* sodium

Micronutrients when available:

* iron
* calcium
* potassium
* magnesium
* vitamin A
* vitamin C
* vitamin D
* vitamin B12

---

# Recipe Scaling

Users must be able to:

* Increase servings
* Decrease servings
* Automatically scale ingredient quantities

Example:

Recipe serves 4.

User selects 8 servings.

All ingredient quantities should double.

Instructions remain unchanged.

---

# Spice Level Scaling

Every recipe can have a spice level:

0 = Not Spicy
1 = Mild
2 = Medium
3 = Hot
4 = Very Hot
5 = Extreme

Users can adjust spice level.

The application should automatically scale spicy ingredients such as:

* chili
* chili flakes
* cayenne
* jalapeño
* habanero
* hot sauce
* sambal
* sriracha

Display a preview of ingredient changes before applying.

---

# Smart Search

Search should support:

## Recipe Name

Example:

"chicken curry"

## Ingredient Search

Example:

"broccoli"

Returns all recipes containing broccoli.

## Cuisine Search

Examples:

* Vietnamese
* Thai
* Japanese
* Swedish
* Italian
* Mexican

## Flavor Search

Examples:

* spicy
* savory
* fresh

## Mood Search

Examples:

* comfort food
* healthy
* cozy

## Occasion Search

Examples:

* family dinner
* meal prep
* quick weekday meal

## Nutrition Search

Examples:

* high protein
* low carb
* low calorie
* high fiber

Search should combine filters.

Example:

High Protein + Thai + Spicy

---

# Recommendations

Add a "Recommend Meal" button.

When clicked:

Generate recommendations based on:

* meals not recently eaten
* nutrition balance
* meal type
* current week plan
* user-selected preferences

Possible recommendation categories:

* Healthy Pick
* High Protein Pick
* Quick Dinner
* Family Favorite
* Meal Prep Choice
* New Recipe Suggestion

---

# Weekly Planner

Provide a calendar-style planner.

Days:

* Monday
* Tuesday
* Wednesday
* Thursday
* Friday
* Saturday
* Sunday

Meal slots:

* Breakfast
* Lunch
* Dinner

Optional:

* Snacks

Users can drag recipes onto the planner.

---

# Nutrition Intelligence

The weekly planner should analyze:

## Macronutrients

* Protein
* Carbohydrates
* Fat

Target:

* Protein slightly prioritized

## Micronutrients

Track:

* Vitamins
* Minerals

Display:

* Weekly nutrition score
* Macro balance score
* Micronutrient coverage score

Provide suggestions such as:

"Add one more iron-rich meal."

or

"Protein intake is lower on Wednesday."

---

# Dashboard

Home page should include:

## Quick Actions

* Add Recipe
* Recommend Meal
* Open Weekly Planner

## Highlights

* Today's Meal
* Upcoming Meals
* Recently Added Recipes
* Nutrition Summary

---

# Future Features

## Shopping List

Generate grocery lists from weekly plan.

## Family Preferences

Store likes and dislikes.

## Dietary Profiles

Support:

* High Protein
* Vegetarian
* Vegan
* Gluten Free
* Dairy Free

## AI Assistant

Suggest recipes from available ingredients.

Example:

"I have chicken, broccoli and rice."

Return matching recipes.

---

# Technical Expectations

Preferred Stack:

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* Zustand or TanStack Query
* PostgreSQL
* Prisma

Architecture:

* Scalable
* Component-based
* Mobile-first
* Accessible

---

# UX Principles

* Fast recipe discovery
* Minimal clicks
* Family-friendly
* Beautiful food photography
* Responsive design
* Clear nutrition information
* Delightful meal planning experience

Success means family members can quickly find meals, plan the week, cook confidently, and maintain a healthy high-protein diet.

