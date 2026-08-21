# Fretwork

Look up a chord, see every way to play it on an acoustic.

## Running it

```bash
npm install
npm run dev      # http://localhost:5320
npm run build
npm run lint
```

The dev port is pinned to **5320** in `vite.config.ts`. Vite's default 5173 falls
inside a Hyper-V reserved TCP range on this machine and fails to bind with EACCES.

## Where things live

```
src/
  config.ts                     site name, tagline, and MAKER_NAME
  styles/
    tokens.css                  palette (both themes), type, spacing, motion
    global.css                  reset, base type, theme cross-fade, reduced motion
  hooks/
    usePrefersReducedMotion.ts
    useTheme.ts                 light/dark: resolve, persist, cross-fade
  components/
    Hero/                       full-screen layout and the stage the artwork sits on
    Guitar/                     the line-art instrument as one inline SVG
      geometry.ts               every coordinate in the drawing, in one place
    ChordSearch/                the real <input>, parked on the inlaid nameplate
    PickToggle/                 the button over the pick that flips the theme
    Archive/                    the guitar-history placard, top-left
    CursorNotes/                pointer-following note glyphs (one rAF loop)
    Results/                    the answer: three tiers of ways to play it
    ChordDiagram/               one chord box, with barres and capos
  chords/                       all the theory. No React, no DOM.
    theory.ts                   names in, pitch classes out; spelling
    fretboard.ts                searches the neck for every playable shape
    difficulty.ts               how hard a shape is, and whether a chord is
    shapes.ts                   the easy open shapes, hand-written and checked
    capo.ts                     tier 2
    substitutes.ts              tier 3
    resolve.ts                  a query in, the whole answer out
    describe.ts                 saying what a shape is, in words
  audio/
    strum.ts                    Karplus-Strong plucked strings
```

### The chord layer

`src/chords` has no React and no DOM in it, and its modules import each other
with explicit `.ts` extensions — which the tsconfig allows — so the whole layer
runs straight through `node` with no bundler in the way. That is the fastest way
to check that a change to the fretboard search still produces x32010 for C.

Voicings are **searched, not stored**. A dictionary would only ever hold the
chords someone thought to type in; `fretboard.ts` walks the neck one hand
position at a time and keeps every shape that sounds the chord and can actually
be fingered. Two rules do most of the work, and both come from how chords are
really played rather than from theory: the lowest sounding string must be the
root, and muted strings only run in from the edges of the shape.

Which shapes are shown is chosen by hand position rather than by score alone —
the easiest shape in each position, plus the fullest-sounding one where that is
different. Sorting on difficulty alone returns ten near-identical shapes from
the bottom of the neck and buries the barre chords people are looking for.

### The three tiers

`resolve.ts` answers a query with up to three tiers, most faithful first:

1. **Every way to play it** — every no-capo voicing, easiest first.
2. **With a capo** — the same chord as an easy open shape, clamped up the neck.
   Identical pitches, easier fingers.
3. **Sounds similar** — a different, easier open chord sharing at least two
   notes, labelled honestly, and playing its own notes so the difference is
   audible.

Tiers 2 and 3 only appear when the chord is genuinely hard: when its easiest
voicing still needs a barre, or there is no easy open shape for it. A chord that
is already easy is told so instead, because telling someone who searched Em how
to avoid playing Em is noise. Where nothing qualifies — an exotic quality with
no open shape, or nothing sharing two notes — the tier is dropped rather than
padded with a weak suggestion.

### How the guitar, the search field and the pick stay aligned

`Guitar/geometry.ts` owns a single 1610 x 580 coordinate space. The SVG draws in
it, and `Hero` locks the stage to the same aspect ratio, so any point in that
space maps to a fixed percentage of the stage. `ChordSearch` positions the real
`<input>` from the same `PLATE` constant the SVG uses to draw the recess, and
`PickToggle` positions its button from the same `PICK` constant — none of the
three can drift apart. Type inside the stage is sized in `cqw`, so it scales
with the instrument rather than against it.

Every colour, size, and duration comes from `styles/tokens.css`. Anything added
later should read from it rather than hard-coding values, so new screens inherit
the look — and both themes — for free.

### Themes

Light is the instrument in daylight; dark is the same instrument by candlelight
— warm espresso rather than black, the linework glowing gold-cream rather than
turning white, and light spilling out of the soundhole instead of falling into
it. Both are defined entirely in `tokens.css`: `:root` holds the light values
and `[data-theme="dark"]` overrides only colours. No component branches on the
theme, so a new screen gets dark mode by using the tokens.

Three pieces make it work:

- The inline script in `index.html` resolves the theme **before the first
  paint** — a stored choice if there is one, `prefers-color-scheme` otherwise —
  and stamps `data-theme` on `<html>`. Nothing flashes, and the CSS never has to
  handle an unset state.
- `hooks/useTheme.ts` starts from what that script stamped, persists a manual
  choice to `localStorage`, and follows the OS only while no choice has been
  made. It also adds `.is-theme-shifting` around the change, which is what turns
  the swap into a cross-fade instead of a snap (see `global.css`).
- The switch itself is the guitar pick tucked under the strings. The pick is
  drawn inside the Guitar SVG — between the headstock and the strings, so the
  strings really do cross over it — while `PickToggle` supplies the `<button>`,
  the label and the focus ring on top of it, and reaches back into the drawing
  through `:has()`. Clicking it turns the pick over and sounds the strings it
  is wedged under.

## State of the build

The landing page, the chord search, and the three tiers of results are all
built and working. Every diagram in every tier is playable.

Routing is the URL hash and nothing else: `#Bb` is the B♭ page, no hash is the
hero. Chords can be linked to and the back button behaves.

Not built yet: alternate tunings, left-handed diagrams, printing.

Deliberately left clean: the large open area of the guitar's body. Small
personal stickers go there in a later step.

Known and deliberate: there is no real mobile layout yet. Below 860px the stage
keeps a usable size and the hero crops it around the nameplate, so the page
stays usable rather than collapsing. The archive placard hides below 900px wide
or 640px tall rather than crowding the artwork. A proper narrow-screen design is
a later step.
