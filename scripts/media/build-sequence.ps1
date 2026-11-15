param([Parameter(Mandatory=$true)][string]$FfmpegPath)
$ErrorActionPreference='Stop'
& node (Join-Path $PSScriptRoot 'build-sequence.mjs') $FfmpegPath
if($LASTEXITCODE -ne 0){throw 'Lossless sequence generation failed'}
