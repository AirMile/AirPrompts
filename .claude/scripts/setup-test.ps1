# Simple Test Script for Claude Code + Obsidian Integration
Write-Host "Testing Claude Code + Obsidian Integration..." -ForegroundColor Green

# Check settings file
$settingsPath = Join-Path $PSScriptRoot "../settings.json"
if (Test-Path $settingsPath) {
    Write-Host "Settings file found: $settingsPath" -ForegroundColor Green
    $settings = Get-Content $settingsPath | ConvertFrom-Json
    $vaultPath = $settings.obsidian.vault_path
    $projectFolder = $settings.obsidian.project_folder
    
    Write-Host "Vault Path: $vaultPath"
    Write-Host "Project Folder: $projectFolder"
    
    # Create project directory if needed
    $projectPath = Join-Path $vaultPath $projectFolder
    if (-not (Test-Path $projectPath)) {
        New-Item -ItemType Directory -Path $projectPath -Force
        Write-Host "Created project directory: $projectPath" -ForegroundColor Yellow
    }
    
    # Test sync script
    $syncScript = Join-Path $PSScriptRoot "sync-to-obsidian.ps1"
    if (Test-Path $syncScript) {
        Write-Host "Running sync test..." -ForegroundColor Yellow
        & $syncScript -Action "Test" -FilePath "demo-test-file.jsx"
        Write-Host "Sync test completed!" -ForegroundColor Green
    }
    
} else {
    Write-Host "Settings file not found!" -ForegroundColor Red
}

Write-Host "Test completed. Check your Obsidian vault at: $projectPath"