param([Parameter(Mandatory=$true)][string]$FfmpegPath)
$ErrorActionPreference='Stop'
$projectRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$source=Join-Path $projectRoot 'assets/originals/video/Camera_moving_toward_ceramic_vase_f6cd792b.mp4'
$target=Join-Path $projectRoot 'public/media/interior-sequence'
New-Item -ItemType Directory -Force (Join-Path $target 'desktop'),(Join-Path $target 'mobile') | Out-Null
& $FfmpegPath -y -hide_banner -loglevel error -i $source -vf 'scale=450:800:flags=lanczos,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir' -an -c:v libwebp -quality 62 -compression_level 4 -start_number 0 (Join-Path $target 'desktop/frame-%03d.webp')
if($LASTEXITCODE -ne 0){throw 'Desktop sequence generation failed'}
& $FfmpegPath -y -hide_banner -loglevel error -framerate 30 -i (Join-Path $target 'desktop/frame-%03d.webp') -vf 'scale=288:512:flags=lanczos' -c:v libwebp -quality 60 -compression_level 4 -start_number 0 (Join-Path $target 'mobile/frame-%03d.webp')
if($LASTEXITCODE -ne 0){throw 'Mobile sequence generation failed'}
Copy-Item -LiteralPath (Join-Path $target 'desktop/frame-000.webp') -Destination (Join-Path $target 'poster.webp')
$count=(Get-ChildItem -LiteralPath (Join-Path $target 'desktop') -Filter '*.webp').Count
$manifest=@{count=$count;fps=30;source=[IO.Path]::GetFileName($source);desktop=@{width=450;height=800};mobile=@{width=288;height=512}} | ConvertTo-Json -Depth 3
[IO.File]::WriteAllText((Join-Path $target 'manifest.json'),$manifest,[Text.UTF8Encoding]::new($false))
