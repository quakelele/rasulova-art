# Scroll and gallery refinement

User request: faster, smoother scroll animation, consider frame sequencing and Framer Motion; add a Swiper gallery and media from `public/media/Новая папка`.

## Delivered

- Opening uses a canvas image sequence derived from the supplied camera film. 193 optical-flow-interpolated WebP frames per resolution, generated on a 60 fps timeline. Desktop 1280×720: 4,477,846 bytes; mobile 768×432: 2,289,822 bytes. Originals and previous MP4 variants retained.
- Native scrolling feeds a Framer Motion spring. Frame painting, adjacent-frame blending and typography updates occur outside React rendering. No video seek or media decoder queue remains in the opening.
- Hero scroll length reduced from 3.2 to 2.1 viewport heights, about 34%. Sequence maps through the visible life of the stage, reaching its last image near exit; the outgoing frame settles briefly while the stage leaves.
- Five concurrent, prioritized frame requests. Compressed frames are fetched once; decoded image cache is capped at 32 desktop / 18 phone, with off-window bitmaps released. Idle/offscreen/hidden canvas work stops. Reduced motion keeps the original-matching poster and requests no sequence frames.
- Swiper added to the main object collection, atelier photographs and object-detail views. Navigation buttons, progress indicators, keyboard support and touch swiping; native dialogs retain Escape and focus behavior. Filters and existing saved IDs preserved.
- 68 new files audited by content hash: 61 unique images, seven exact duplicates. Every unique image is included in the object views, atelier or material detail. Optimized WebP derivatives generated; original uploads untouched. Ten object groups with descriptive titles, not invented official artwork names.

## Validation

Production package at port 4173: desktop 1440×900, phone 390×844, compact 360×640, desktop reduced-motion. `node scrollcraft/verify-refinement.mjs` passed.

- Forward/reverse scene progress; real wheel input produces 58 desktop / 62 phone / 82 compact distinct painted frames during the test gesture, rather than waiting for video seeks. These are gesture samples, not a claimed hardware FPS benchmark.
- Exactly 194 sequence requests per animated context (manifest + 193 files), with no duplicate frame fetches. Decoded cache limits verified at 32/18. Reduced-motion context fetches zero sequence files.
- Collection next/previous arrows, actual emulated touch gestures, filters (five vase groups/five dish groups), multiple detail photographs, dialog Escape, atelier arrows, persisted selection and downloadable selection contents.
- No page errors, failed asset requests, broken loaded images or horizontal document overflow.
- Scrollcraft harness sampled 27 page positions and reported no dead scroll. Custom verification state describes the actual painted image/blend and copy opacity.
- Reviewed actual opening, intermediate frames, exit, gallery, detail and atelier screenshots. Early draft's arrow positions were corrected after visual inspection; final evidence supersedes the draft. Initial missing React import was caught by browser validation and fixed before delivery.

Evidence: `../../lab/refinement-final/results.json`, `../../lab/refinement-final/contact-sheet.jpg`, `../../lab/sequence-scroll/review.jpg`; media audit: `../../media-import.json`.

Physical phones and arbitrary low-end hardware/network conditions remain untested. Frame sequences trade a larger compressed transfer (4.5 MB / 2.3 MB) for predictable decoded image drawing; the poster remains visible until a complete frame paints. Earlier video-specific test scripts refer to the previous revision; the current test entry is `verify-refinement.mjs`.

## Reproduction

Set `SCROLLCRAFT_FFMPEG` to the full FFmpeg executable and run `node scrollcraft/prepare-media.mjs` to regenerate optimized uploads and their module. Run `scrollcraft/prepare-frames.ps1 -FfmpegPath <full-path>` from PowerShell to regenerate the frame sequence. No credentials are required. `npm.cmd run build` creates the final site in `dist`.

## Swipe motion follow-up

Shared `SmoothCarousel` now uses Swiper FreeMode with momentum and sticky settling, a 4px gesture threshold, direct finger following, no momentum bounce, and composited transform transitions. Horizontal trackpad wheel input is handled separately from vertical page scroll. Adjacent lazy images preload and decode asynchronously. Removed the obsolete collection-entry IntersectionObserver. Image dragging/selection no longer conflicts with carousel gestures; keyboard control on background carousels is disabled while the detail dialog is open. Reduced motion disables momentum and transition duration.

Targeted production verification: `node scrollcraft/verify-swipes.mjs`. Tests actual mouse drag, emulated touch drag, progressive translation before release, no accidental dialog opening, next/previous arrows, horizontal trackpad gesture, detail navigation, and background keyboard isolation. Results and reviewed screenshots are in `scrollcraft/lab/swipes`.
