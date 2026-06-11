-- Seed data for grocery-savings (docs/PLAN.md §3).
--
-- Runs on `supabase db reset` AND CI `supabase start`, so the logged-out e2e
-- flow always has deals. All reference data; user data still comes from
-- auth.users at runtime.
--
-- Stores referenced via subquery on store name (no hardcoded UUIDs). Sale
-- window is 2024-01-01..2030-12-31 so deals never expire (CI date-proof).
--
-- ===========================================================================
-- UNIT CONTRACT (docs/PLAN.md §3, packages/utils/src/matching/types.ts)
-- ===========================================================================
-- Every ingredient_key uses ONE canonical unit across every seeded sale item
-- AND every recipe template slot, so cost math is `quantity × price` with no
-- conversion. servings_per_unit is how many recipe servings one purchase unit
-- yields. dietary_flags are what an item CONTAINS / IS, using ONLY this
-- vocabulary: contains_dairy, contains_gluten, contains_nuts, fish, pork,
-- meat, animal_product.
--
--   ingredient_key   | unit    | typical dietary_flags
--   -----------------+---------+--------------------------------------------
--   PROTEINS
--   chicken_breast   | lb      | {meat, animal_product}
--   chicken_thigh    | lb      | {meat, animal_product}
--   ground_beef      | lb      | {meat, animal_product}
--   pork_chop        | lb      | {meat, pork, animal_product}
--   salmon           | lb      | {fish, meat, animal_product}
--   tofu             | block   | {}
--   black_beans      | can     | {}
--   eggs             | dozen   | {animal_product}
--   STARCHES
--   rice             | lb      | {}
--   pasta            | lb      | {contains_gluten}
--   potato           | lb      | {}
--   tortilla         | pack    | {contains_gluten}        (flour tortillas)
--   bread            | loaf    | {contains_gluten}
--   VEGETABLES
--   broccoli         | bunch   | {}
--   bell_pepper      | each    | {}
--   onion            | each    | {}
--   spinach          | bag     | {}
--   carrot           | lb      | {}
--   tomato           | lb      | {}
--   zucchini         | each    | {}
--   green_beans      | lb      | {}
--   SAUCES / OTHER
--   salsa            | jar     | {}
--   soy_sauce        | bottle  | {contains_gluten}        (wheat-based)
--   marinara         | jar     | {}
--   cheese           | block   | {contains_dairy, animal_product}
--   butter           | stick   | {contains_dairy, animal_product}
--   milk             | gallon  | {contains_dairy, animal_product}
--   olive_oil        | bottle  | {}
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Stores (3, Cincinnati OH; lat/long near 39.13,-84.43 so radius math runs)
-- ---------------------------------------------------------------------------

insert into public.stores (chain, name, address, city, state, zip, latitude, longitude)
values
  ('kroger', 'Kroger Hyde Park', '3760 Paxton Ave', 'Cincinnati', 'OH', '45208', 39.1402, -84.4310),
  ('kroger', 'Kroger Corryville', '2820 Vine St', 'Cincinnati', 'OH', '45219', 39.1295, -84.5160),
  ('aldi', 'Aldi Oakley', '4825 Marburg Ave', 'Cincinnati', 'OH', '45209', 39.1545, -84.4220);

-- ---------------------------------------------------------------------------
-- Sale items (referencing stores by name subquery)
-- Discount spread: a handful <25%, majority 25-39%, several 40%+.
-- ---------------------------------------------------------------------------

insert into public.sale_items
  (store_id, name, category, ingredient_key, regular_price, sale_price, unit, servings_per_unit, dietary_flags, sale_starts_at, sale_ends_at)
values
  -- ===== Kroger Hyde Park =====
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Boneless Chicken Breast', 'meat', 'chicken_breast', 5.99, 3.99, 'lb', 4, '{meat,animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Chicken Thighs Family Pack', 'meat', 'chicken_thigh', 4.49, 2.69, 'lb', 4, '{meat,animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Ground Beef 80/20', 'meat', 'ground_beef', 5.49, 3.79, 'lb', 4, '{meat,animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Center-Cut Pork Chops', 'meat', 'pork_chop', 4.99, 2.99, 'lb', 4, '{meat,pork,animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Atlantic Salmon Fillet', 'seafood', 'salmon', 11.99, 7.99, 'lb', 4, '{fish,meat,animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Organic Firm Tofu', 'produce', 'tofu', 2.79, 1.99, 'block', 4, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Black Beans Can', 'pantry', 'black_beans', 1.29, 0.89, 'can', 3, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Grade A Large Eggs', 'dairy', 'eggs', 3.49, 2.49, 'dozen', 6, '{animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Long Grain White Rice', 'pantry', 'rice', 3.99, 2.99, 'lb', 8, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Penne Pasta', 'pantry', 'pasta', 1.99, 1.29, 'lb', 6, '{contains_gluten}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Russet Potatoes', 'produce', 'potato', 3.49, 1.99, 'lb', 6, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Flour Tortillas 10ct', 'bakery', 'tortilla', 3.29, 2.29, 'pack', 5, '{contains_gluten}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Broccoli Crowns', 'produce', 'broccoli', 2.49, 1.69, 'bunch', 4, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Red Bell Pepper', 'produce', 'bell_pepper', 1.29, 0.79, 'each', 2, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Yellow Onion', 'produce', 'onion', 0.99, 0.69, 'each', 3, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Baby Spinach Bag', 'produce', 'spinach', 3.49, 2.29, 'bag', 4, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Mild Salsa Jar', 'pantry', 'salsa', 2.99, 1.99, 'jar', 6, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Marinara Sauce', 'pantry', 'marinara', 3.29, 2.29, 'jar', 6, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Sharp Cheddar Block', 'dairy', 'cheese', 4.99, 3.49, 'block', 8, '{contains_dairy,animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Hyde Park'),
   'Whole Milk Gallon', 'dairy', 'milk', 3.99, 2.99, 'gallon', 16, '{contains_dairy,animal_product}', '2024-01-01', '2030-12-31'),

  -- ===== Kroger Corryville =====
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Boneless Chicken Breast', 'meat', 'chicken_breast', 5.99, 4.29, 'lb', 4, '{meat,animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Ground Beef 85/15', 'meat', 'ground_beef', 5.99, 3.49, 'lb', 4, '{meat,animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Bone-In Pork Chops', 'meat', 'pork_chop', 3.99, 2.79, 'lb', 4, '{meat,pork,animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Wild Salmon Fillet', 'seafood', 'salmon', 12.99, 9.99, 'lb', 4, '{fish,meat,animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Extra Firm Tofu', 'produce', 'tofu', 2.99, 1.79, 'block', 4, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Black Beans Can', 'pantry', 'black_beans', 1.19, 0.79, 'can', 3, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Large Brown Eggs', 'dairy', 'eggs', 3.99, 2.99, 'dozen', 6, '{animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Jasmine Rice', 'pantry', 'rice', 4.49, 2.99, 'lb', 8, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Spaghetti', 'pantry', 'pasta', 1.79, 0.99, 'lb', 6, '{contains_gluten}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Corn Tortillas 12ct', 'bakery', 'tortilla', 2.99, 1.99, 'pack', 5, '{contains_gluten}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Whole Wheat Bread', 'bakery', 'bread', 3.49, 2.49, 'loaf', 10, '{contains_gluten}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Broccoli Crowns', 'produce', 'broccoli', 2.29, 1.49, 'bunch', 4, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Carrots 2lb Bag', 'produce', 'carrot', 2.49, 1.69, 'lb', 8, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Roma Tomatoes', 'produce', 'tomato', 2.49, 1.49, 'lb', 4, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Green Zucchini', 'produce', 'zucchini', 1.49, 0.99, 'each', 2, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Fresh Green Beans', 'produce', 'green_beans', 2.99, 1.99, 'lb', 4, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Soy Sauce Bottle', 'pantry', 'soy_sauce', 3.49, 2.49, 'bottle', 20, '{contains_gluten}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Mozzarella Block', 'dairy', 'cheese', 4.49, 2.99, 'block', 8, '{contains_dairy,animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Salted Butter', 'dairy', 'butter', 1.49, 0.99, 'stick', 8, '{contains_dairy,animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Kroger Corryville'),
   'Yellow Onion', 'produce', 'onion', 0.89, 0.59, 'each', 3, '{}', '2024-01-01', '2030-12-31'),

  -- ===== Aldi Oakley =====
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Chicken Breast Value Pack', 'meat', 'chicken_breast', 4.99, 2.99, 'lb', 4, '{meat,animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Chicken Thighs', 'meat', 'chicken_thigh', 3.99, 1.99, 'lb', 4, '{meat,animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Ground Beef 80/20', 'meat', 'ground_beef', 4.99, 2.99, 'lb', 4, '{meat,animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Pork Loin Chops', 'meat', 'pork_chop', 3.79, 2.49, 'lb', 4, '{meat,pork,animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Cage-Free Eggs', 'dairy', 'eggs', 2.99, 1.79, 'dozen', 6, '{animal_product}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Firm Tofu', 'produce', 'tofu', 1.99, 1.49, 'block', 4, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Black Beans Can', 'pantry', 'black_beans', 0.99, 0.59, 'can', 3, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'White Rice 2lb', 'pantry', 'rice', 2.99, 1.99, 'lb', 8, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Penne Pasta', 'pantry', 'pasta', 1.29, 0.89, 'lb', 6, '{contains_gluten}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Yukon Gold Potatoes', 'produce', 'potato', 2.99, 1.49, 'lb', 6, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'White Sandwich Bread', 'bakery', 'bread', 1.99, 1.29, 'loaf', 10, '{contains_gluten}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Broccoli', 'produce', 'broccoli', 1.99, 1.29, 'bunch', 4, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Green Bell Pepper', 'produce', 'bell_pepper', 0.99, 0.59, 'each', 2, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Baby Spinach', 'produce', 'spinach', 2.49, 1.69, 'bag', 4, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Carrots 1lb', 'produce', 'carrot', 1.49, 0.99, 'lb', 8, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Vine Tomatoes', 'produce', 'tomato', 1.99, 1.19, 'lb', 4, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Zucchini', 'produce', 'zucchini', 0.99, 0.69, 'each', 2, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Green Beans', 'produce', 'green_beans', 2.49, 1.49, 'lb', 4, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Marinara Sauce', 'pantry', 'marinara', 1.99, 1.29, 'jar', 6, '{}', '2024-01-01', '2030-12-31'),
  ((select id from public.stores where name = 'Aldi Oakley'),
   'Cheddar Block', 'dairy', 'cheese', 3.49, 2.49, 'block', 8, '{contains_dairy,animal_product}', '2024-01-01', '2030-12-31');

-- ---------------------------------------------------------------------------
-- Recipe templates (family dinners, servings 4).
-- slots: array of {slot, role, ingredient_keys, quantity, unit, optional,
--   pantry_staple} using ONLY the ingredient_keys + canonical units above.
-- dietary_tags: every restriction the recipe SATISFIES, from
--   dairy_free, gluten_free, no_fish, no_pork, vegetarian, vegan, nut_free.
-- ---------------------------------------------------------------------------

insert into public.recipe_templates
  (name, description, dietary_tags, servings, instructions, slots, assumed_staples)
values
  -- 1. dairy_free + gluten_free (chicken + rice + broccoli)
  ('Garlic Chicken & Rice Bowl',
   'Pan-seared chicken over fluffy rice with steamed broccoli.',
   '{dairy_free,gluten_free,no_fish,no_pork,nut_free}', 4,
   array[
     'Rinse 1 lb of rice and cook in 2 cups water until tender, about 18 minutes.',
     'Season chicken breast with salt, pepper, and minced garlic.',
     'Heat olive oil in a skillet over medium-high and sear chicken 6 minutes per side.',
     'Steam the broccoli until bright green and crisp-tender, about 5 minutes.',
     'Slice the chicken and serve over rice with broccoli alongside.',
     'Spoon any pan juices over the top and finish with cracked pepper.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["chicken_breast","chicken_thigh"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["rice"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["broccoli"],"quantity":1,"unit":"bunch","optional":false,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 2. dairy_free + gluten_free (chicken stir-fry, rice) - soy_sauce optional so gluten-free holds
  ('Chicken & Veggie Stir-Fry',
   'Quick stir-fried chicken with bell pepper and broccoli over rice.',
   '{dairy_free,gluten_free,no_fish,no_pork,nut_free}', 4,
   array[
     'Cook 1 lb of rice according to package directions and keep warm.',
     'Cut chicken breast into bite-sized pieces and season with salt and pepper.',
     'Heat olive oil in a wok over high heat and stir-fry the chicken until cooked through.',
     'Add sliced bell pepper and broccoli florets and stir-fry 4 minutes.',
     'Toss with minced garlic for the final minute.',
     'Serve the stir-fry over rice.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["chicken_breast","chicken_thigh"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["rice"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["broccoli"],"quantity":1,"unit":"bunch","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["bell_pepper"],"quantity":2,"unit":"each","optional":false,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 3. dairy_free + gluten_free (beef + potato + green beans)
  ('Beef & Potato Skillet',
   'Hearty ground beef with potatoes and green beans in one pan.',
   '{dairy_free,gluten_free,no_fish,no_pork,nut_free}', 4,
   array[
     'Dice the potatoes and parboil for 6 minutes, then drain.',
     'Brown the ground beef in a large skillet with olive oil, breaking it apart.',
     'Add diced onion and cook until softened.',
     'Stir in the parboiled potatoes and crisp them on the edges.',
     'Add trimmed green beans and cook until tender, about 8 minutes.',
     'Season with salt, pepper, and garlic and serve hot.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["ground_beef"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["potato"],"quantity":1.5,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["green_beans"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Aromatic","role":"aromatic","ingredient_keys":["onion"],"quantity":1,"unit":"each","optional":true,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 4. dairy_free + gluten_free (chicken thigh, potato, carrot - roast)
  ('Roasted Chicken Thighs & Vegetables',
   'Oven-roasted chicken thighs with potatoes and carrots.',
   '{dairy_free,gluten_free,no_fish,no_pork,nut_free}', 4,
   array[
     'Heat the oven to 425F.',
     'Toss chicken thighs with olive oil, salt, pepper, and garlic.',
     'Cut potatoes and carrots into chunks and spread on a sheet pan.',
     'Nestle the chicken thighs among the vegetables.',
     'Roast for 35 minutes until the chicken is golden and cooked through.',
     'Rest for 5 minutes before serving.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["chicken_thigh","chicken_breast"],"quantity":1.5,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["potato"],"quantity":1.5,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["carrot"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 5. dairy_free + gluten_free + vegetarian + vegan (black bean & rice)
  ('Black Bean & Rice Burrito Bowl',
   'Plant-based bowl of seasoned black beans, rice, peppers, and salsa.',
   '{dairy_free,gluten_free,no_fish,no_pork,nut_free,vegetarian,vegan}', 4,
   array[
     'Cook 1 lb of rice and fluff with a fork.',
     'Warm the black beans with a pinch of salt and garlic over medium heat.',
     'Saute sliced bell pepper and onion in olive oil until soft.',
     'Build bowls with rice, beans, and peppers.',
     'Top with salsa.',
     'Season with salt and pepper to taste.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["black_beans"],"quantity":2,"unit":"can","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["rice"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["bell_pepper"],"quantity":2,"unit":"each","optional":false,"pantry_staple":false},
     {"slot":"Sauce","role":"sauce","ingredient_keys":["salsa"],"quantity":1,"unit":"jar","optional":false,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 6. dairy_free + gluten_free + vegetarian + vegan (tofu stir-fry, no soy to keep GF)
  ('Crispy Tofu & Veggie Bowl',
   'Pan-crisped tofu with broccoli and bell pepper over rice.',
   '{dairy_free,gluten_free,no_fish,no_pork,nut_free,vegetarian,vegan}', 4,
   array[
     'Press and cube the tofu, then pat dry.',
     'Cook 1 lb of rice and keep warm.',
     'Crisp the tofu in olive oil over medium-high heat until golden on all sides.',
     'Add broccoli and bell pepper and saute until crisp-tender.',
     'Season with salt, pepper, and garlic.',
     'Serve the tofu and vegetables over rice.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["tofu"],"quantity":2,"unit":"block","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["rice"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["broccoli"],"quantity":1,"unit":"bunch","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["bell_pepper"],"quantity":2,"unit":"each","optional":true,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 7. dairy_free + gluten_free (chicken + potato + carrot)
  ('Skillet Chicken & Potatoes',
   'One-pan chicken breast with crispy potatoes and carrots.',
   '{dairy_free,gluten_free,no_fish,no_pork,nut_free}', 4,
   array[
     'Cube the potatoes and carrots into bite-sized pieces.',
     'Sear seasoned chicken breast in olive oil, then set aside.',
     'Cook the potatoes and carrots in the same skillet until tender.',
     'Return the chicken and toss with garlic.',
     'Cover and cook 5 more minutes to finish.',
     'Season with salt and pepper and serve.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["chicken_breast","chicken_thigh"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["potato"],"quantity":1.5,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["carrot"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 8. dairy_free + gluten_free + vegetarian (eggs + potato + spinach hash)
  ('Veggie Breakfast-for-Dinner Hash',
   'Skillet potato hash with spinach and fried eggs.',
   '{dairy_free,gluten_free,no_fish,no_pork,nut_free,vegetarian}', 4,
   array[
     'Dice the potatoes and crisp them in olive oil until golden.',
     'Add the onion and cook until translucent.',
     'Wilt the spinach into the hash.',
     'Make wells and crack the eggs into them.',
     'Cover and cook until the eggs are set to your liking.',
     'Season with salt, pepper, and garlic and serve.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["eggs"],"quantity":1,"unit":"dozen","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["potato"],"quantity":1.5,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["spinach"],"quantity":1,"unit":"bag","optional":false,"pantry_staple":false},
     {"slot":"Aromatic","role":"aromatic","ingredient_keys":["onion"],"quantity":1,"unit":"each","optional":true,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 9. dairy_free + gluten_free (beef + rice + pepper - unstuffed peppers)
  ('Unstuffed Pepper Skillet',
   'Ground beef, rice, and bell peppers cooked together in one skillet.',
   '{dairy_free,gluten_free,no_fish,no_pork,nut_free}', 4,
   array[
     'Cook 1 lb of rice and set aside.',
     'Brown the ground beef with onion in a skillet.',
     'Add chopped bell peppers and cook until softened.',
     'Stir in tomatoes and simmer 10 minutes.',
     'Fold in the cooked rice and warm through.',
     'Season with salt, pepper, and garlic and serve.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["ground_beef"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["rice"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["bell_pepper"],"quantity":3,"unit":"each","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["tomato"],"quantity":1,"unit":"lb","optional":true,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 10. dairy_free + gluten_free (tacos with corn tortillas - tortilla flagged gluten in seed, so NOT gluten_free)
  --     -> make this one dairy_free only (beef tacos)
  ('Ground Beef Tacos',
   'Seasoned ground beef tacos with peppers and salsa.',
   '{dairy_free,no_fish,no_pork,nut_free}', 4,
   array[
     'Brown the ground beef in a skillet and drain excess fat.',
     'Add diced onion and bell pepper and cook until soft.',
     'Season the beef with salt, pepper, and garlic.',
     'Warm the tortillas in a dry pan.',
     'Fill the tortillas with the beef mixture.',
     'Top with salsa and serve.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["ground_beef"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["tortilla"],"quantity":1,"unit":"pack","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["bell_pepper"],"quantity":1,"unit":"each","optional":true,"pantry_staple":false},
     {"slot":"Sauce","role":"sauce","ingredient_keys":["salsa"],"quantity":1,"unit":"jar","optional":false,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 11. dairy_free (chicken fajitas, flour tortilla -> gluten, so no gluten_free)
  ('Chicken Fajita Wraps',
   'Sizzling chicken and peppers wrapped in warm tortillas.',
   '{dairy_free,no_fish,no_pork,nut_free}', 4,
   array[
     'Slice chicken breast into strips and season with salt and pepper.',
     'Sear the chicken in olive oil over high heat.',
     'Add sliced bell pepper and onion and cook until charred at the edges.',
     'Stir in garlic for the last minute.',
     'Warm the tortillas.',
     'Fill the tortillas with the chicken and peppers and serve with salsa.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["chicken_breast","chicken_thigh"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["tortilla"],"quantity":1,"unit":"pack","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["bell_pepper"],"quantity":2,"unit":"each","optional":false,"pantry_staple":false},
     {"slot":"Sauce","role":"sauce","ingredient_keys":["salsa"],"quantity":1,"unit":"jar","optional":true,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 12. dairy (REQUIRES cheese) - NOT dairy_free. gluten (pasta) too.
  ('Cheesy Beef Pasta Bake',
   'Baked pasta with ground beef, marinara, and melted cheese.',
   '{no_fish,no_pork,nut_free}', 4,
   array[
     'Cook 1 lb of pasta until al dente and drain.',
     'Brown the ground beef with onion in a skillet.',
     'Stir the marinara into the beef and simmer 10 minutes.',
     'Toss the pasta with the sauce.',
     'Transfer to a baking dish and top with shredded cheese.',
     'Bake at 375F for 20 minutes until bubbly and golden.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["ground_beef"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["pasta"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Sauce","role":"sauce","ingredient_keys":["marinara"],"quantity":1,"unit":"jar","optional":false,"pantry_staple":false},
     {"slot":"Cheese","role":"sauce","ingredient_keys":["cheese"],"quantity":1,"unit":"block","optional":false,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 13. dairy (REQUIRES cheese + milk) - NOT dairy_free
  ('Chicken & Broccoli Alfredo',
   'Creamy pasta with chicken and broccoli in a cheese sauce.',
   '{no_fish,no_pork,nut_free}', 4,
   array[
     'Cook 1 lb of pasta until al dente, reserving some cooking water.',
     'Season and sear the chicken breast, then slice.',
     'Steam the broccoli until crisp-tender.',
     'Melt butter, whisk in milk, and stir in grated cheese to make a sauce.',
     'Toss the pasta, chicken, and broccoli in the sauce.',
     'Loosen with pasta water as needed and season to taste.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["chicken_breast"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["pasta"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["broccoli"],"quantity":1,"unit":"bunch","optional":false,"pantry_staple":false},
     {"slot":"Cheese","role":"sauce","ingredient_keys":["cheese"],"quantity":1,"unit":"block","optional":false,"pantry_staple":false},
     {"slot":"Dairy","role":"sauce","ingredient_keys":["milk"],"quantity":1,"unit":"gallon","optional":false,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic,butter}'),

  -- 14. dairy (REQUIRES cheese) - NOT dairy_free, no_fish/no_pork/nut_free ok
  ('Cheesy Egg & Potato Frittata',
   'Baked frittata loaded with potatoes, spinach, and cheese.',
   '{gluten_free,no_fish,no_pork,nut_free,vegetarian}', 4,
   array[
     'Parboil the diced potatoes for 6 minutes and drain.',
     'Whisk the eggs with salt and pepper.',
     'Saute the potatoes and onion in olive oil in an oven-safe skillet.',
     'Wilt in the spinach, then pour the eggs over the top.',
     'Scatter shredded cheese over the eggs.',
     'Bake at 375F for 18 minutes until set, then slice.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["eggs"],"quantity":1,"unit":"dozen","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["potato"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["spinach"],"quantity":1,"unit":"bag","optional":false,"pantry_staple":false},
     {"slot":"Cheese","role":"sauce","ingredient_keys":["cheese"],"quantity":1,"unit":"block","optional":false,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,onion}'),

  -- 15. salmon (fish) - NOT no_fish; dairy_free + gluten_free
  ('Roasted Salmon & Rice',
   'Simple roasted salmon with rice and green beans.',
   '{dairy_free,gluten_free,no_pork,nut_free}', 4,
   array[
     'Heat the oven to 400F.',
     'Cook 1 lb of rice and keep warm.',
     'Pat the salmon dry and rub with olive oil, salt, and pepper.',
     'Roast the salmon for 12 minutes until it flakes.',
     'Steam the green beans until tender.',
     'Serve the salmon over rice with green beans alongside.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["salmon"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["rice"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["green_beans"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 16. salmon (fish) - NOT no_fish; dairy_free + gluten_free
  ('Salmon & Roasted Potatoes',
   'Crispy-skinned salmon with roasted potatoes and broccoli.',
   '{dairy_free,gluten_free,no_pork,nut_free}', 4,
   array[
     'Heat the oven to 425F.',
     'Toss potato chunks with olive oil, salt, and pepper and roast 20 minutes.',
     'Add broccoli to the pan and roast 10 minutes more.',
     'Season the salmon with garlic, salt, and pepper.',
     'Sear the salmon skin-side down, then finish in the oven for 6 minutes.',
     'Serve the salmon with the roasted vegetables.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["salmon"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["potato"],"quantity":1.5,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["broccoli"],"quantity":1,"unit":"bunch","optional":false,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 17. pork - NOT no_pork; dairy_free + gluten_free
  ('Pork Chops with Roasted Veggies',
   'Seared pork chops with carrots and potatoes.',
   '{dairy_free,gluten_free,no_fish,nut_free}', 4,
   array[
     'Heat the oven to 425F and roast cubed potatoes and carrots in olive oil.',
     'Pat the pork chops dry and season with salt, pepper, and garlic.',
     'Sear the pork chops in a hot skillet, 4 minutes per side.',
     'Finish the pork in the oven alongside the vegetables for 6 minutes.',
     'Rest the pork chops for 5 minutes.',
     'Serve the pork with the roasted vegetables.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["pork_chop"],"quantity":1.5,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["potato"],"quantity":1.5,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["carrot"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 18. dairy_free + gluten_free (chicken + rice + zucchini)
  ('Lemon Chicken & Zucchini',
   'Bright skillet chicken with sauteed zucchini over rice.',
   '{dairy_free,gluten_free,no_fish,no_pork,nut_free}', 4,
   array[
     'Cook 1 lb of rice and keep warm.',
     'Season the chicken breast with salt, pepper, and garlic.',
     'Sear the chicken in olive oil until golden and cooked through, then slice.',
     'Saute sliced zucchini in the same pan until just tender.',
     'Return the chicken to the pan to warm through.',
     'Serve the chicken and zucchini over rice.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["chicken_breast","chicken_thigh"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["rice"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["zucchini"],"quantity":2,"unit":"each","optional":false,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 19. dairy_free + gluten_free + vegetarian + vegan (black beans + potato + pepper)
  ('Smoky Bean & Potato Skillet',
   'Vegan skillet of black beans, potatoes, and peppers.',
   '{dairy_free,gluten_free,no_fish,no_pork,nut_free,vegetarian,vegan}', 4,
   array[
     'Dice the potatoes and parboil for 6 minutes, then drain.',
     'Crisp the potatoes in olive oil in a large skillet.',
     'Add the onion and bell pepper and cook until soft.',
     'Stir in the black beans and warm through.',
     'Season with salt, pepper, and garlic.',
     'Top with salsa and serve.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["black_beans"],"quantity":2,"unit":"can","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["potato"],"quantity":1.5,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["bell_pepper"],"quantity":2,"unit":"each","optional":false,"pantry_staple":false},
     {"slot":"Sauce","role":"sauce","ingredient_keys":["salsa"],"quantity":1,"unit":"jar","optional":true,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}'),

  -- 20. dairy + gluten (spaghetti & meat sauce with cheese) - NOT dairy_free, requires dairy
  ('Spaghetti & Meat Sauce',
   'Classic spaghetti with a beefy marinara and parmesan.',
   '{no_fish,no_pork,nut_free}', 4,
   array[
     'Cook 1 lb of pasta until al dente and drain.',
     'Brown the ground beef with onion in a deep skillet.',
     'Pour in the marinara and simmer 15 minutes.',
     'Toss the pasta with the meat sauce.',
     'Grate cheese over each serving.',
     'Finish with cracked pepper and serve.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["ground_beef"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["pasta"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Sauce","role":"sauce","ingredient_keys":["marinara"],"quantity":1,"unit":"jar","optional":false,"pantry_staple":false},
     {"slot":"Cheese","role":"sauce","ingredient_keys":["cheese"],"quantity":1,"unit":"block","optional":false,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic,onion}'),

  -- 21. dairy_free + gluten_free (chicken thigh + rice + green beans + carrot)
  ('Honey-Garlic Chicken Thighs',
   'Sticky skillet chicken thighs with rice and green beans.',
   '{dairy_free,gluten_free,no_fish,no_pork,nut_free}', 4,
   array[
     'Cook 1 lb of rice and keep warm.',
     'Season the chicken thighs with salt, pepper, and garlic.',
     'Sear the thighs skin-side down until crisp, then flip and cook through.',
     'Steam the green beans and carrots until tender.',
     'Glaze the chicken with the pan juices and garlic.',
     'Serve the chicken over rice with the vegetables.'
   ],
   '[
     {"slot":"Protein","role":"protein","ingredient_keys":["chicken_thigh","chicken_breast"],"quantity":1.5,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Starch","role":"starch","ingredient_keys":["rice"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["green_beans"],"quantity":1,"unit":"lb","optional":false,"pantry_staple":false},
     {"slot":"Vegetable","role":"vegetable","ingredient_keys":["carrot"],"quantity":1,"unit":"lb","optional":true,"pantry_staple":false}
   ]'::jsonb,
   '{olive oil,salt,pepper,garlic}');
