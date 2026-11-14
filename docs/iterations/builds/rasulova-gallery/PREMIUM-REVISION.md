# Gallery, selection and author-contact revision

User correction: remove the unrelated photograph, remove repeats/show the complete gallery, redesign the photo window with smooth opening and closing, show visual selection previews, connect WhatsApp +994554448954 and reverse the opening timeline.

## Delivered

- Removed the small raspberry ingredient-reference photograph from the statement. Supplied originals remain on disk.
- Audited both original media folders: 87 supplied photographs, 73 unique artwork/studio photographs retained, 13 duplicate copies removed from display, one unrelated reference excluded. Deduplication combines content hashes with normalized image difference checks (perceptual hash plus RGB difference). Different candy/color variants remain separate even when their compositions match. See `scrollcraft/curation-report.json` for every exclusion.
- Eleven object groups preserve existing saved IDs. A separate **Все фотографии** tab exposes the complete 73-image archive; object views include additional original photos and promotional views that had not been exposed before. Studio photographs are labelled separately and can be opened from the atelier.
- A new full-size native-dialog viewer: contained photographs, thumbnail navigation, quiet gallery chrome, sidebar with object details, selection state and direct individual inquiry. Framer Motion drives a 420 ms opening and 240 ms closing. The native dialog stays open throughout exit, preserving focus isolation. Escape and backdrop clicks use the same exit path. Reduced motion uses immediate transitions. Photos fade in after loading.
- Selection inquiry is a visual board with large clickable previews, individual removal and an optional note. WhatsApp and copy buttons use the same generated message. The list and note are visible in a message preview; selected work persists on reload.
- WhatsApp click-to-chat uses `https://wa.me/994554448954?text=...`. It opens a prepared text message; the visitor confirms sending in WhatsApp. The website does not automatically send messages or attach image files. Public deployments include artwork deep links; localhost/private-network URLs are deliberately excluded from the message. Artwork links open their corresponding viewer via `?work=...`.
- Opening canvas sequence reverses frame indices, including the frame prefetch priority/cache center. It starts at frame 192, advances towards frame 0 as the visitor scrolls down, and rewinds towards frame 192 on upward scroll. Matching reversed poster retained for reduced motion/loading.

## Validation

`npm.cmd run build` passed. `node scrollcraft/verify-premium.mjs` passed at 1440×1000, 390×844, 360×640 and desktop reduced motion against the production preview at port 4173.

Verified: decreasing original frame indices on forward scroll and return on upward scroll; opacity changes during opening; dialog remains present during exit; thumbnail navigation and complete-image containment; unique sources across all 73 archive slides; final archive photograph reachable/openable; clickable selection previews; two previews persisting on reload; correct international WhatsApp number, selected names and note in encoded text; real clipboard content (normalized for Windows line endings); public deep-link behavior; no page errors or horizontal overflow. No WhatsApp message was sent during testing.

The Scrollcraft scroll harness sampled 28 positions and found no dead scroll. Actual screenshots were inspected for desktop and phone. Full-section screenshots can contain displaced fixed-header artifacts when Chromium captures beyond the viewport; additional ordinary viewport captures (`*-inquiry-overview.png` and `*-previews.png`) verify the actual header/selection composition.

Evidence: `scrollcraft/lab/premium/results.json`, `scrollcraft/lab/premium/*-viewer.png`, `scrollcraft/lab/premium/*-previews.png`, `scrollcraft/lab/premium/*-archive.png`, `scrollcraft/lab/premium-scroll/review.jpg`.

Limits: physical phones and a signed-in WhatsApp client are not connected. The official click-to-chat URL is verified structurally; final messaging remains the visitor's action. There is no live inventory, pricing or automatic image attachment integration. Titles remain descriptive; no unsupported dimensions, materials or prices were invented.

Current media module is `src/curated-media.js`; `src/media-data.js` is the intermediate original import used by `scrollcraft/curate-library.mjs`. Current browser test entry is `verify-premium.mjs`; previous test scripts describe their historical UI.
