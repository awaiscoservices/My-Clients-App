# Image folder — files here are served from the site root

| Put this file here                        | Used for                                   | Tips                                   |
|-------------------------------------------|--------------------------------------------|----------------------------------------|
| `logo/logo.png`                           | Full logo (icon + name): top bar, landing page, login, register, footer | Transparent PNG, about 800 x 200 px |
| `logo/logo-icon.png`                      | Icon only: phone top bar                   | Transparent PNG, square, 512 x 512 px  |
| `games/<game-name>.png`                   | One logo per game (e.g. `games/firekirin.png`) | Transparent PNG, about 400 x 400 px |
| `banners/hero.jpg`                        | Homepage banner                            | 1920 x 800 px, under 500 KB            |

Also put `favicon.ico` in the **public/** folder itself (not inside images/) for the browser tab icon.

In the code an image is referenced WITHOUT "public", e.g. `/images/games/firekirin.png`.
File names are case-sensitive on Vercel: use lowercase, no spaces.
