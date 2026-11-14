# Delivery report

## Current revision: scroll-controlled opening film

The user's explicit correction supersedes the photographic hero described in the initial report below. The first screen now uses the supplied `Camera_moving_backward_from_vase_bd1f6868_iris3.mp4`, with ScrollCraft seeking forwards/backwards from scroll position. A native sticky stage holds the gallery frame, the frame contracts slightly, and two separate copy beats transition without overlapping on phones. Navigation and the rest of the page use a neutral graphite/green palette on a light gallery ground.

Original retained unchanged (11,608,930 bytes). Derived silent, dense-keyframe H.264 files: `film-scroll.mp4` at 1080p, 2,198,331 bytes; `film-scroll-mobile.mp4` at 720p, 1,002,950 bytes. Both preserve the original 3.291667-second duration. First-frame poster captured from the actual original, replacing the unrelated previous fallback. Portable FFmpeg was obtained in the system temporary directory for encoding; no executable is shipped with the site.

`verify-film.mjs` exercises desktop, phone, compact phone and reduced motion against the production package. Forward scroll advances the video, reverse scroll rewinds it, and a stopped scroll produces no autonomous playback. The full visible-life harness also confirms the final video frames advance during the outgoing transition. The reduced-motion version deliberately presents the matching static poster without fetching the clip.

Production build passes. Existing filter, selection persistence, dialog, download and overflow checks were rerun after the film revision and passed in all four viewports/modes. Initial desktop text contrast and phone copy overlap findings were fixed with a localized trailing scrim and shorter copy transition overlap. Final release evidence: `../../lab/film-desktop-approved/`, `../../lab/film-phone-approved/`, and the explicit forward/reverse checks in `../../lab/film/results.json`. Earlier intermediate film reports remain for comparison and are superseded by these releases. Actual physical phones remain untested.

The intended peak is now the camera pulling back from the vase under the visitor's hand, resolving into the light object collection. This corrects the initial brief's emphasis on the selection shelf; the selection shelf remains a secondary, useful interaction. Visual review found the opening and transition now read as a continuous gallery encounter rather than independent still photographs.

## Initial iteration (superseded opening)

The existing React/Vite landing has been rebuilt in place. Art direction and navigation are a light gallery/catalog, selected from the user's requested light artistic gallery. Remaining creative decisions were delegated explicitly. The brief was authored under that delegation, not represented as an interview.

## Experience
Object encounter → short pause → collection and personal exhibition → atelier → inquiry document. Intended feeling curve: curiosity, calm, delight, intimacy, resolve. The distinctive interaction is the miniature exhibition shelf; selected objects persist in localStorage and appear in the downloadable inquiry.

Visual review: the first iteration read as curiosity, calm, browsing, intimacy, resolve. The collection becomes the delight peak when objects are selected; selection screenshots verify that state. The opening originally had a three-line label that crowded the phone composition; shortened to two lines. Increased independent print travel to make the depth perceptible. The collection remains the longest section. No empty pinned travel was added. Final screen holds content and an explicit next action.

Gallery/catalog was chosen over filmic/continuous-world narration because the range of objects is the substance. Live surface, poster, split-stage and cutlist do not fit the supplied object photography; chaptered editorial would over-emphasize prose. Registry was empty, so the first build had no historical comparisons to clear. Full device score and layer contract are in BRIEF.md.

## Verification evidence
- `npm.cmd run build`: passed.
- Chrome interaction checks at 1440×1000, 390×844, 360×640, and desktop reduced-motion: filters, selection, reload persistence, dialog Escape, file download contents, mobile menu, broken images, page errors, horizontal overflow.
- Scrollcraft harness: 17 sampled positions each on desktop, phone, reduced motion. Final reports have no console errors, no failed requests, and no dead scroll detected. Initial development React warning on `fetchPriority` fixed by using `fetchpriority`; initial reports retained under desktop and mobile-scroll, superseded by the final reports.
- Final production package served at http://127.0.0.1:4173/; interaction suite also run against this root.
- Contact sheets visually inspected: `../../lab/desktop-final-sheet.jpg`, `../../lab/mobile-final-sheet.jpg`, `../../lab/reduced-final-sheet.jpg`. Detailed states and downloadable sample files are in `../../lab/`.
- FFmpeg unavailable: no video encoding was needed. Contact sheets composed with System.Drawing from actual browser screenshots. No imagery generated; supplied originals retained.

## Limits
Actual physical phone and a live contact integration were not tested/configured. Source contact email was explicitly demonstrative; no message is sent and no fake submission success is shown. Export is a local text file. Materials, dimensions, availability, prices and final artwork titles require author confirmation. The tool's automatic media contrast report does not cover every label because there is no copy over media; the main text uses solid, high-contrast grounds. This is not an accessibility certification.

Local working URL: http://127.0.0.1:5173/
