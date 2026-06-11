export * from './database'

import { type Tables } from './database'

/**
 * Row aliases for the grocery reference + user tables. These are the raw
 * snake_case DB shapes — the public domain shapes are the locked matching
 * contract in `@grocery-savings/utils/matching`, which the providers/queries
 * map these rows into. Do NOT redefine the contract types here.
 */
export type StoreRow = Tables<'stores'>
export type SaleItemRow = Tables<'sale_items'>
export type RecipeTemplateRow = Tables<'recipe_templates'>
export type UserPreferencesRow = Tables<'user_preferences'>
export type SavedMealPlanRow = Tables<'saved_meal_plans'>
