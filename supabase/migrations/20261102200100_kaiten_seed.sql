-- Starting menu: the eight dishes from the original conveyor, their categories and plate tiers.
-- Mirrors src/lib/menu/data.ts, which demo mode uses without a database.
-- Seeded dishes use the store's own /dishes/<id>.webp paths (see docs/ASSETS.md); photos uploaded in the admin go to Storage.

insert into public.plate_tiers (id, name, color, price_cents) values
  (1, 'Ash', '#97918a', 320),
  (2, 'Indigo', '#325d8c', 420),
  (3, 'Matcha', '#608f50', 540),
  (4, 'Vermilion', '#cc4425', 680),
  (5, 'Gold', '#cd9b3c', 850);

insert into public.categories (id, label, label_ja, description, sort_order) values
  ('nigiri', 'Nigiri', '握り', 'A slice of topping pressed onto a small mound of seasoned rice.', 10),
  ('rolls', 'Rolls', '巻物', 'Rolled with nori and rice, cut into rounds.', 20),
  ('small-plates', 'Small plates', '小皿', 'Something to share while the belt comes round.', 30),
  ('dessert', 'Dessert', '甘味', 'A sweet plate to finish.', 40);

insert into public.dishes (id, name, name_ja, description, category_id, tier_id, image_path, portion, allergens, tags, sort_order) values
  ('salmon-nigiri', 'Salmon nigiri', 'サーモン握り', 'Two slices of fresh salmon over seasoned rice, with pickled ginger.', 'nigiri', 2, '/dishes/salmon-nigiri.webp', '2 pieces', '{fish}', '{chefs-pick}', 10),
  ('tuna-nigiri', 'Tuna nigiri', '鮪握り', 'Lean red tuna over warm rice on a black lacquer plate.', 'nigiri', 4, '/dishes/tuna-nigiri.webp', '2 pieces', '{fish}', '{}', 20),
  ('ebi-nigiri', 'Ebi nigiri', '海老握り', 'Butterflied poached shrimp over rice, tail left on.', 'nigiri', 2, '/dishes/ebi-nigiri.webp', '2 pieces', '{shellfish}', '{}', 30),
  ('california-roll', 'California roll', 'カリフォルニアロール', 'Crab, avocado and cucumber, rolled inside out in orange tobiko.', 'rolls', 3, '/dishes/california-roll.webp', '4 pieces', '{shellfish,fish-roe}', '{}', 40),
  ('dragon-roll', 'Dragon roll', 'ドラゴンロール', 'Shrimp tempura roll draped in avocado, finished with eel sauce.', 'rolls', 5, '/dishes/dragon-roll.webp', '4 pieces', '{shellfish,wheat}', '{chefs-pick}', 50),
  ('tamago', 'Tamago nigiri', '玉子握り', 'Sweet rolled omelette tied to rice with a band of nori.', 'nigiri', 1, '/dishes/tamago.webp', '2 pieces', '{egg}', '{}', 60),
  ('edamame', 'Salted edamame', '枝豆', 'A small bowl of steamed soybean pods with flaky sea salt.', 'small-plates', 1, '/dishes/edamame.webp', '1 bowl', '{soy}', '{vegan}', 70),
  ('mochi', 'Mochi ice cream', '餅アイス', 'Matcha and strawberry mochi ice cream, one of each.', 'dessert', 3, '/dishes/mochi.webp', '2 pieces', '{milk}', '{}', 80);

insert into public.restaurant_settings (id, name, opening_hours) values (
  true,
  'KAITEN',
  '[
    {"closed": false, "open": "11:30", "close": "21:30"},
    {"closed": false, "open": "11:30", "close": "21:30"},
    {"closed": false, "open": "11:30", "close": "21:30"},
    {"closed": false, "open": "11:30", "close": "21:30"},
    {"closed": false, "open": "11:30", "close": "22:00"},
    {"closed": false, "open": "11:30", "close": "22:00"},
    {"closed": false, "open": "12:00", "close": "21:00"}
  ]'::jsonb
);
