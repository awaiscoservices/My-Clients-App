// ─────────────────────────────────────────────────────────────────────────────
//  THE 23 GAMES.  Logos live in  public/images/games/  (upload the PNGs there).
//  `file` must match the file name EXACTLY, including capital letters (Vercel is case-sensitive).
//  bonus: a REAL bonus % to show as a badge on the tile, or null to show no badge.
//  hot:   true to show a 🔥 HOT badge (and to enable the "Hot Games" tab on the landing page).
// ─────────────────────────────────────────────────────────────────────────────
const GAMES = [
  // name,                    file,                     other names this game may be stored under
  ['EStar',                   'estar.png',              []],
  ['Game Vault',              'GameVault-game.png',     []],
  ['Royal Treasure',          'royaltreasure.png',      []],
  ['Juwa',                    'Juwa-game.png',          []],
  ['Ultra Thunder',           'ultrathunder.png',       []],
  ['Dragon Fury',             'dragonfury.png',         []],
  ['Vegas Sweeps',            'Sweeps.png',             ['sweeps', 'vegas']],
  ['Game Room',               'GamerRoom-game.png',     ['gamerroom', 'gameroomonline']],
  ['Milky Way',               'MilkyWays.png',          ['milkyways']],
  ['Fire Kirin',              'Fire.png',               ['fire']],
  ['Orion Stars',             'OrionStars.png',         ['orionstar']],
  ['Yolo 777',                'yolo.png',               ['yolo']],
  ['Cash Machine Jackpots',   'cash-machine-jackpots.png', ['cashmachine', 'cashmachinejackpot']],
  ['Blue Dragon',             'blue-dragon.png',        []],
  ['Cash Vault',              'cash-vault.png',         []],
  ['Mr All In One',           'mr-all.png',             ['mrall']],
  ['Cash Frenzy',             'cash-frenzy.png',        []],
  ['Mafia City',              'mafia.png',              ['mafia']],
  ['Ace Club',                'ace-club.png',           ['ace']],
  ['Lucky Stars',             'lucky-star.png',         ['luckystar']],
  ['Juwa 2.0',                'juwa2.png',              ['juwa2']],
  ['Vegas Luck',              'vegas-luck.png',         []],
  ['Win Star',                'win-star.png',           ['winstars']],
]

// tile colours, cycling like the sample: green, blue, purple, cyan, blue, teal
const TINTS = [['#1f9d7a', '#0f3b4a'], ['#2b5fd9', '#13264f'], ['#7a3fe0', '#2a1450'], ['#12b8d6', '#0c3350'], ['#2b6fe0', '#14285a'], ['#1fa77f', '#0c3a3f']]

export const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

export const GAME_CATALOG = GAMES.map(([name, file, aliases], i) => ({
  name, file, slug: norm(name), aliases,
  src: `/images/games/${file}`,
  tint: TINTS[i % TINTS.length],
  accent: '#fbbf24',
  bonus: null,
  hot: false,
}))

// look a game up by any of its names ("Fire Kirin", "firekirin", "fire", …)
const BY_KEY = {}
for (const g of GAME_CATALOG) for (const k of [g.name, g.slug, g.file.replace(/\.png$/i, ''), ...g.aliases]) BY_KEY[norm(k)] = g

export function gameLogoFor(...names) {
  for (const n of names) { const g = BY_KEY[norm(n)]; if (g) return g.src }
  return null
}
