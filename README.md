# Elm Park Roasters — demo site

Concept website for a fictional café: Astro 5, Tailwind v4, React islands. All content lives in `src/data/site.json`.

```sh
npm install
npm run dev      # local dev server
npm test         # unit tests
npm run verify   # slop check + type check + build
```

## Photo sources

All four photos are from Wikimedia Commons under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (public domain dedication, no attribution required). Sources live in `src/assets/photos/` and are resized by `astro:assets` at build time.

| File | Used for | Author | Source |
| --- | --- | --- | --- |
| `hero.jpg` (also cropped to `public/og.jpg`, 1200×630) | Hero, social preview | Kim Sanso | [Latte art 3](https://commons.wikimedia.org/wiki/File:Latte_art_3.jpg) |
| `latte.jpg` | Menu item: Elm Park Latte | Drew Coffman | [Two Hands Cafe latte art (Unsplash)](https://commons.wikimedia.org/wiki/File:Two_Hands_Cafe_latte_art_(Unsplash).jpg) |
| `croissant.jpg` | Menu item: Butter Croissant | Andy Li | [Croissant - GAIL's 2024-08-18](https://commons.wikimedia.org/wiki/File:Croissant_-_GAIL%27s_2024-08-18.jpg) |
| `interior.jpg` | Shop interior (Visit section) | Drew Coffman | [Empty coffee shop interior with wooden table and water skis](https://commons.wikimedia.org/wiki/File:Empty_coffee_shop_interior_with_wooden_table_and_water_skis.jpg) |

## Fonts

Manrope and Fraunces are self-hosted from `public/fonts/` (Latin subset, woff2) under the SIL Open Font License; the license texts sit next to the files.
