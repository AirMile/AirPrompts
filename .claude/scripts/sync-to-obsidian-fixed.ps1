# AirPrompts to Obsidian Sync Script - Fixed Version
param(
    [string]$Action = $env:CLAUDE_TOOL_NAME,
    [string]$FilePath = $env:CLAUDE_FILE_PATH,
    [string]$Timestamp = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
)

# Read configuration
$settingsPath = Join-Path $PSScriptRoot "../settings.json"
if (Test-Path $settingsPath) {
    $settings = Get-Content $settingsPath | ConvertFrom-Json
    $vaultPath = $settings.obsidian.vault_path
    $projectFolder = $settings.obsidian.project_folder
    $progressFile = $settings.obsidian.progress_file
    $changelogFile = $settings.obsidian.changelog_file
} else {
    $vaultPath = "C:\Users\$env:USERNAME\Documents\Obsidian"
    $projectFolder = "CodeStation"
    $progressFile = "Development Progress.md"
    $changelogFile = "Changelog.md"
}

# Create project directory
$obsidianProjectPath = Join-Path $vaultPath $projectFolder
if (-not (Test-Path $obsidianProjectPath)) {
    New-Item -ItemType Directory -Path $obsidianProjectPath -Force
    Write-Host "Created Obsidian project folder: $obsidianProjectPath"
}

# Update progress file
$progressPath = Join-Path $obsidianProjectPath $progressFile
$progressEntry = @"

## $Timestamp - Claude Code Auto-Update
- **Action**: $Action
- **File**: $FilePath
- **Status**: Completed
- **Source**: Claude Code Automation

"@

Add-Content -Path $progressPath -Value $progressEntry
Write-Host "Progress tracking updated: $progressFile"

# Update changelog
$changelogPath = Join-Path $obsidianProjectPath $changelogFile
$changelogEntry = @"

### [$Timestamp] - Auto-generated
**Action**: $Action
**File**: $(Split-Path $FilePath -Leaf)
- Modified via Claude Code
- Automated documentation sync

"@

Add-Content -Path $changelogPath -Value $changelogEntry
Write-Host "Changelog updated: $changelogFile"

# Feature tracking for components
if ($FilePath -match "components|pages|features") {
    $featureTrackingPath = Join-Path $obsidianProjectPath "Feature Implementation.md"
    $featureEntry = @"

#### $Timestamp - Component Update
**File**: $FilePath
**Type**: $(if ($FilePath -match "components") { "Component" } elseif ($FilePath -match "pages") { "Page" } else { "Feature" })
**Action**: $Action
**Status**: Auto-tracked

"@
    Add-Content -Path $featureTrackingPath -Value $featureEntry
    Write-Host "Feature tracking updated"
}

Write-Host "Obsidian sync completed successfully!"
Write-Host "Vault: $vaultPath"
Write-Host "Project: $projectFolder"