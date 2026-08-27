# BLOCK-LOTTO 方塊樂透

**Balatro × Breakout.** A single-player roguelike brick breaker for the browser — one self-contained `index.html`, zero dependencies, mobile-first portrait.

## Play
Open `index.html` in any browser, or serve the folder statically. Works great added to home screen on iPhone.

## The run
- **8 Antes**, each = Small Blind → Big Blind → **Boss Blind**. Beat Ante 8 → Endless Mode.
- Score = **BRICKS × MULT**. Combo builds mult every hit; **mult burns down 1/sec**; catching the ball on the paddle resets both.
- **Tap to launch** — the ball rides the paddle until you tap.
- **Bosses**: The Wall, The Slicer (−55% paddle), The Storm, The Armored, The Cheapskate, CLOD (regenerating clay)… and **Ante 8: BIG TOE, The Fun Ruiner Ghost** — caps mult at 88, randomly ruins your fun.
- **SLOT-O-MATIC**: a slot machine on the field that eats your ball. 50% nothing (mult burns while it spins), 42% win + your mult back, 8% JACKPOT 888 = $88.

## Cards (29 unique pixel-art jokers, inlined)
- **20 Jokers** across Common / Uncommon / Rare / **Legendary**
- Legendaries: **WATERBEAR** (first lost ball returns), **TUN** (slow ball, 2× bricks), **JAMMY** (all luck ×2), **URSA** (wider paddle + shockwave), **CROUTON** (every 8th brick crumbles neighbors)
- 5 Tarot one-shots, 4 permanent Vouchers, rerolls, **skip tags** on blinds

## Seeds
Balatro-style: **0–8 chars, `1-9` + `A-Z` (no zero), empty = random.** Same seed = same run. Masked during play, revealed + tap-to-copy at run end.

## Lucky 8s
Combo 8 = LUCKY 8 ×8. Combo 88 = JACKPOT 88 (gold rain + $88). 發 bricks worth 88. Interest pays per $8 held. 8% scratch-card jackpot. 發發發.

## Tech
Single HTML file: canvas + vanilla JS + WebAudio. Pixel-art card faces AI-generated, inlined as data URIs. Liquid-ink reactive background. EN / 中文 toggle. High score + run persistence in localStorage.

Built with Kimi K3 across one very long, very fun weekend. 發
