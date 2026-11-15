# lastVideo.mp4 hero replacement

The main hero uses the full new source video: 123 original frames at
30000/1001 fps, 1920x1080, 4.1041 seconds. Both phones and desktop use lossless WebP frames. The original MP4 remains
in the workspace and is no longer delivered by the application. There is no
resolution or frame-rate reduction and no additional lossy video encoding.
The previous source remains in the workspace.

Build the sequence:
`node scripts/media/build-sequence.mjs <ffmpeg.exe> artifacts/media-build/last-video-staging lastVideo.mp4 public/media/hero-last`

Verify every frame against source RGB pixels:
`node scripts/media/verify-sequence.mjs <ffmpeg.exe> public/media/hero-last`

The next two chapters (statement and first collection category) use centered
72% exit scaling with smoothstep easing and rounded corners. Their layout
coordinates stay independent of visual scaling, so recalculation does not
change anchor targets. No new mobile gesture interception was added. Reduced
motion disables scaling.

All 123 decoded BGRA frame hashes match the source. Frame files total
27,048,094 bytes. Previous WebP assets were archived outside public/dist.


Full preload revision: all 123 images are fetched with six workers, retried up to
three attempts, and decode-validated before hero-ready. The loader shows progress
and has no timeout that reveals a partial sequence. A failed image leaves an
explicit retry action. Compressed bytes remain in memory, with a bounded decoded
ring of 12 frames on mobile / 20 on desktop, instead of retaining about 1 GB of
uncompressed surfaces. Canvas stays 1920x1080. Playback advances through adjacent
cached frames with interpolation and bounded catch-up speed; no MP4 seeking or
network fetches occur while scrubbing after the loader.

Mobile fitting chapters settle one deliberate swipe to one smooth next/previous
section, with no inertial cascade. Tall content and inquiry follow the finger
with at most 0.95 viewport travel per gesture. Horizontal Swiper gestures, pinch zoom,
focused form fields, and overflowing textareas retain their own controls.
