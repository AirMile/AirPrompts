# AirPrompts → Obsidian Sync Script
# Automatisch uitgevoerd na elke code wijziging via Claude Code hooks

param(
    [string]$Action = $env:CLAUDE_TOOL_NAME,
    [string]$FilePath = $env:CLAUDE_FILE_PATH,
    [string]$Timestamp = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
)

# Configuratie uit settings.json lezen
$settingsPath = Join-Path $PSScriptRoot "../settings.json"
if (Test-Path $settingsPath) {
    $settings = Get-Content $settingsPath | ConvertFrom-Json
    $vaultPath = $settings.obsidian.vault_path
    $projectFolder = $settings.obsidian.project_folder
    $progressFile = $settings.obsidian.progress_file
    $changelogFile = $settings.obsidian.changelog_file
} else {
    # Fallback configuratie
    $vaultPath = "C:\Users\$env:USERNAME\Documents\Obsidian"
    $projectFolder = "AirPrompts"
    $progressFile = "Development Progress.md"
    $changelogFile = "Changelog.md"
}

# Obsidian project directory aanmaken als deze niet bestaat
$obsidianProjectPath = Join-Path $vaultPath $projectFolder
if (-not (Test-Path $obsidianProjectPath)) {
    New-Item -ItemType Directory -Path $obsidianProjectPath -Force
    Write-Host "✅ Obsidian project folder aangemaakt: $obsidianProjectPath"
}

# Progress tracking file updaten
$progressPath = Join-Path $obsidianProjectPath $progressFile
$progressEntry = @"

## $Timestamp - Claude Code Auto-Update
- **Action**: $Action
- **File**: $FilePath
- **Status**: ✅ Completed
- **Source**: Claude Code Automation

"@

Add-Content -Path $progressPath -Value $progressEntry
Write-Host "📝 Progress tracking updated: $progressFile"

# Changelog updaten
$changelogPath = Join-Path $obsidianProjectPath $changelogFile
$changelogEntry = @"

### [$Timestamp] - Auto-generated
- **$Action**: $(Split-Path $FilePath -Leaf)
  - Modified via Claude Code
  - Automated documentation sync

"@

Add-Content -Path $changelogPath -Value $changelogEntry
Write-Host "📋 Changelog updated: $changelogFile"

# Feature implementatie tracking
if ($FilePath -match "components|pages|features") {
    $featureTrackingPath = Join-Path $obsidianProjectPath "Feature Implementation.md"
    $featureEntry = @"

#### $Timestamp - Component Update
- **File**: $FilePath
- **Type**: $(if ($FilePath -match "components") { "Component" } elseif ($FilePath -match "pages") { "Page" } else { "Feature" })
- **Action**: $Action
- **Auto-tracked**: ✅

"@
    Add-Content -Path $featureTrackingPath -Value $featureEntry
    Write-Host "🔧 Feature tracking updated"
}

# Code metrics bijwerken (optioneel)
$metricsPath = Join-Path $obsidianProjectPath "Code Metrics.md"
if (Test-Path $FilePath) {
    $fileContent = Get-Content $FilePath -Raw
    $lineCount = ($fileContent -split "`n").Count
    $functionCount = ($fileContent | Select-String -Pattern "function|const.*=" -AllMatches).Matches.Count
    
    $metricsEntry = @"

### $Timestamp - File Analysis
- **File**: $(Split-Path $FilePath -Leaf)
- **Lines**: $lineCount
- **Functions**: $functionCount
- **Last Modified**: $Timestamp

"@
    Add-Content -Path $metricsPath -Value $metricsEntry
    Write-Host "📊 Code metrics updated"
}

Write-Host "🎯 Obsidian sync completed successfully!"
Write-Host "   📁 Vault: $vaultPath"
Write-Host "   📁 Project: $projectFolder"
Write-Host "   📝 Files updated: Progress, Changelog, Features, Metrics"