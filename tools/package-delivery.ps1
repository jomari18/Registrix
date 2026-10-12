$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $projectRoot
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$outputRoot = Join-Path $projectRoot 'outputs'
New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null

function Write-Package([string]$name, [string]$base, [string[]]$files) {
    $destination = Join-Path $outputRoot $name
    $archive = [System.IO.Compression.ZipFile]::Open($destination, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($file in $files) {
            $basePrefix = [System.IO.Path]::GetFullPath($base).TrimEnd('\') + '\'
            $absoluteFile = [System.IO.Path]::GetFullPath($file)
            if (-not $absoluteFile.StartsWith($basePrefix, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Package input escapes its root' }
            $relative = $absoluteFile.Substring($basePrefix.Length).Replace('\', '/')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file, $relative, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    } finally { $archive.Dispose() }
}

# Replace only explicitly named prior delivery files, never source directories.
$names = @('Registrix-Source.zip', 'Registrix-Web.zip', 'Registrix-Assets.zip', 'Registrix-Screenshots.zip')
foreach ($name in $names) {
    $destination = Join-Path $outputRoot $name
    if (Test-Path -LiteralPath $destination) { Remove-Item -LiteralPath $destination }
}
$sourceZip = Join-Path $outputRoot 'Registrix-Source.zip'
git -c "safe.directory=$($projectRoot.Replace('\','/'))" archive --format=zip --output=$sourceZip HEAD
if ($LASTEXITCODE -ne 0) { throw 'Source archive failed' }
$distRoot = Join-Path $projectRoot 'dist'
Write-Package 'Registrix-Web.zip' $distRoot @(Get-ChildItem -LiteralPath $distRoot -File -Recurse | ForEach-Object FullName)
$assetsRoot = Join-Path $projectRoot 'public/assets'
Write-Package 'Registrix-Assets.zip' $assetsRoot @(Get-ChildItem -LiteralPath $assetsRoot -File -Recurse | ForEach-Object FullName)
Write-Package 'Registrix-Screenshots.zip' $outputRoot @(Get-ChildItem -LiteralPath $outputRoot -Filter 'registrix-*.png' -File | ForEach-Object FullName)
foreach ($name in $names) {
    $zip = [System.IO.Compression.ZipFile]::OpenRead((Join-Path $outputRoot $name))
    try {
        foreach ($entry in $zip.Entries) {
            if ($entry.FullName -match '(^|/)(\.git|\.local-[^/]*|node_modules|\.superpowers|\.env\.local)(/|$)|\.mdb$') { throw "Excluded file in $name : $($entry.FullName)" }
        }
        Write-Output "$name verified: $($zip.Entries.Count) entries"
    } finally { $zip.Dispose() }
}
