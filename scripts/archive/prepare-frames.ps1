param([Parameter(Mandatory=$true)][string]$FfmpegPath)
$ErrorActionPreference='Stop'
$source=Join-Path $PSScriptRoot '../public/media/Camera_moving_backward_from_vase_bd1f6868_iris3.mp4'
foreach($variant in @(@{Name='desktop';Scale='1280:720';Quality=77},@{Name='mobile';Scale='768:432';Quality=73})) {
 $target=Join-Path $PSScriptRoot "../public/media/frames/$($variant.Name)"
 New-Item -ItemType Directory -Path $target -Force | Out-Null
 & $FfmpegPath -y -hide_banner -loglevel error -i $source -vf "scale=$($variant.Scale):flags=lanczos,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" -c:v libwebp -quality $variant.Quality -compression_level 4 -start_number 0 (Join-Path $target 'frame-%03d.webp')
 if($LASTEXITCODE -ne 0){throw 'Frame generation failed'}
}
$count=@(Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot '../public/media/frames/desktop') -Filter '*.webp').Count
@{count=$count;fps=60;source='Camera_moving_backward_from_vase_bd1f6868_iris3.mp4';desktop=@{width=1280;height=720};mobile=@{width=768;height=432}} | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $PSScriptRoot '../public/media/frames/manifest.json') -Encoding utf8
