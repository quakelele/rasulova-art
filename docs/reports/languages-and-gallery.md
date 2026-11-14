# RU / EN / AZ, gallery and project structure

## Delivered

- Russian, English and Azerbaijani interfaces, persistent language selection, translated image descriptions, gallery labels, dialogs, contact details, accessibility labels, page title/description and WhatsApp message. Existing artwork titles remain unchanged as requested. Changing language preserves the selected pieces and current timeline position. Artwork deep links carry the language.
- A dedicated contacts section with WhatsApp, telephone and `https://www.instagram.com/rasulova_art/`. Instagram tracking parameters were removed. The same real social destinations appear in the footer.
- Five deliberately different atelier stories replace the previous row of similar table photographs. The full archive still exposes 73 unique photographs. The main range has 11 real object groups, a visible thumbnail index and a prominent full-photo-archive control; no extra products were invented.
- Artwork images display with `object-fit: contain`. The image/eye opens the viewer. The labelled plus button adds the object directly without opening it. Atelier reference photographs have an eye and a clear viewing label rather than a misleading plus.
- Installed AOS 2.3.4: restrained left/right/up entrances, once per element, no animation on the pinned scene's ancestors, no horizontal page overflow, and reduced-motion support. Layout/reveal positions refresh when language, gallery filters or selection size change. Swiper retains direct input following, inertia, keyboard support and touch swiping.
- Reversed hero sequence now runs fully within the pinned interval. Three distinct caption beats accompany the film: handmade details, natural inspiration and a piece for your space. The final frame is reached before the next section enters; a short final held beat allows the spring to settle before release. Native scroll is retained; no wheel trapping is introduced.

## Project layout

```text
src/
  app/App.jsx
  components/gallery/     viewer, carousel, work card
  components/navigation/  language switcher
  sections/               hero, collection, atelier, selection, contacts
  i18n/                   dictionaries and locale state
  data/                   curated catalog and real contact details
  lib/                    contact-message helpers
  hooks/                  AOS lifecycle
  styles/                 base, hero, gallery, selection and refinements
assets/originals/         original collection, studio photographs and source film
assets/archive/           retained older derived assets and references
public/media/            deployed images, frame sequence and poster
scripts/media/            current asset preparation tools
scripts/archive/          historical one-off tools
tests/e2e/                current browser checks
tests/archive/            previous UI checks
artifacts/qa/             browser evidence; ignored by Git
docs/media/               audits and migration records
docs/iterations/          retained briefs and historical decisions
```

Original files were moved with checked workspace-contained paths and retained. An empty legacy workspace was archived rather than deleted. Unused old CSS rules were removed; current source and build scripts no longer depend on the earlier flat file layout. Vite/React tooling is in devDependencies; unused GSAP was removed from the dependency manifest/lockfile. Client-only directive warnings from the motion package are filtered specifically; other build warnings remain visible.

## Validation

`npm run build` passed. `npm run test:e2e` uses installed Chrome against production preview on port 4173. Coverage: desktop 1440×1000, tablet 768×1024, phone 390×844, compact 360×640 and reduced motion.

Checks include final frame before native sticky release, three individual caption plateaus, AOS entrances, direct add behavior, unchanged artwork names, translated dialogs in every language, all dictionary keys present, language/selection persistence, 73 unique image sources, complete photo containment, distinct atelier sources, actual touch swipes without accidental opening, the real Instagram URL, WhatsApp phone/message language, clipboard contents, no page errors, failed assets or horizontal overflow. No messages are sent to the author by the tests.

Evidence: `artifacts/qa/release/results.json`, language/contact screenshots, hero-beat samples, atelier views and selection captures. A physical phone and a signed-in WhatsApp session are not connected; the automated phone checks use Chrome emulation. Artwork titles and all prior original media are preserved.

WhatsApp continues to prepare text/names, as requested. It does not automatically attach photographs or press Send.
