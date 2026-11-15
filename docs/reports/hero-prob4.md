# Main animation replacement: prob4

The hero now uses `mainAnimation_prob4.mp4`, played forward as the page scrolls.
The retired sequence and poster are outside `public` and are absent from `dist`.

## Media

- Original: H.264, 1920 × 1080, 24 fps, 92 frames, 3.833333 seconds of video.
- Delivery: RGB lossless WebP, 92 frames in one shared directory for all devices.
- No resizing, frame-rate reduction, interpolation, or lossy quantization.
- Frame files total 74,064,424 bytes. The source MP4 itself is not copied into
  the public directory or production output.
- All 92 decoded BGRA frame hashes match the original video after decoding.
  Evidence: `artifacts/qa/hero-replacement/lossless-verification.json`.

Build: `node scripts/media/build-sequence.mjs <path-to-ffmpeg.exe>`.
Optional third argument resumes a staging directory under `artifacts/media-build`.
The PowerShell entry point delegates to the same builder.
Verify: `node scripts/media/verify-sequence.mjs <path-to-ffmpeg.exe>`.

## Presentation

The hero has no brightening, darkening, or gradient overlays over its frames.
Type uses dark slate blue with a muted blue emphasis. Mobile has separate video
and text regions, preserving readability without whitening the picture. Only a
small decoded frame window is kept in memory; the full-resolution assets remain
unchanged.

Copy enters with a staggered opacity/translation animation after the loader is
actually removed. The film is bounded to its own scroll interval. Drawing the
actual last frame triggers a single smooth handoff to the statement, while the
rest of that touch/wheel gesture cannot cascade through subsequent sections.
Returning upward to the final frame does not retrigger the handoff.

The source begins with white frames. They are retained rather than trimming or
altering the clip. Reduced-motion users see a clear still from the final frame.

## Verification

Production build passes. Forward/reverse scrolling, the complete final frame,
automatic hero exit, touch gestures, and gallery modal scroll stability pass. Desktop,
phone, compact phone, and reduced-motion screenshots were inspected, with no
script errors, missing media, or horizontal overflow. Initial frame fetches
remain bounded; the complete lossless sequence is not downloaded at startup.

These are local Chrome checks. The handoff test includes a long mobile gesture,
fourteen large wheel events, and an Android-sized DPR 3 viewport at 4x CPU
throttling. It checks an animated entrance after loading, exactly one handoff,
no delayed cascade, a fresh next-section gesture, and reverse video scrubbing.
No deployment or physical-phone validation was performed. Screenshots:
`artifacts/qa/hero-replacement` and `artifacts/qa/hero-handoff`.
