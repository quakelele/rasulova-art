# lastVideo.mp4 hero replacement

The main hero uses the full new source video: 123 original frames at
30000/1001 fps, 1920x1080, 4.1041 seconds. The original MP4 is delivered unchanged
on phones (4,968,133 bytes); desktop uses lossless WebP frames. There is no
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
