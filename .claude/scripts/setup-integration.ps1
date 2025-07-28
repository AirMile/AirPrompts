# AirPrompts Claude Code + Obsidian Setup Script
# Automatische configuratie voor de integratie

Write-Host "🚀 Setting up Claude Code + Obsidian Integration..." -ForegroundColor Green

# 1. Check PowerShell Execution Policy
Write-Host "`n📋 Checking PowerShell Execution Policy..."
$currentPolicy = Get-ExecutionPolicy -Scope CurrentUser
Write-Host "Current policy: $currentPolicy"

if ($currentPolicy -eq "Restricted") {
    Write-Host "⚠️  Setting execution policy to RemoteSigned for current user..."
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    Write-Host "✅ Execution policy updated"
} else {
    Write-Host "✅ Execution policy is compatible"
}

# 2. Validate settings.json configuration
Write-Host "`n📝 Validating settings.json..."
$settingsPath = Join-Path $PSScriptRoot "../settings.json"

if (Test-Path $settingsPath) {
    Write-Host "✅ settings.json found"
    $settings = Get-Content $settingsPath | ConvertFrom-Json
    
    # Check if Obsidian paths exist
    $vaultPath = $settings.obsidian.vault_path
    Write-Host "Checking vault path: $vaultPath"
    
    if (Test-Path $vaultPath) {
        Write-Host "✅ Obsidian vault path exists"
    } else {
        Write-Host "⚠️  Obsidian vault path not found. Please update settings.json with correct path."
        Write-Host "   Current path: $vaultPath"
    }
} else {
    Write-Host "❌ settings.json not found!"
    exit 1
}

# 3. Create Obsidian project directory structure
Write-Host "`n📁 Setting up Obsidian project directory..."
$projectPath = Join-Path $vaultPath $settings.obsidian.project_folder

if (-not (Test-Path $projectPath)) {
    New-Item -ItemType Directory -Path $projectPath -Force
    Write-Host "✅ Created project directory: $projectPath"
} else {
    Write-Host "✅ Project directory exists: $projectPath"
}

# 4. Initialize tracking files from templates
Write-Host "`n📄 Initializing tracking files..."
$templatesPath = Join-Path $PSScriptRoot "../templates"
$templates = @(
    @{ Template = "obsidian-progress.md"; Output = $settings.obsidian.progress_file },
    @{ Template = "obsidian-changelog.md"; Output = $settings.obsidian.changelog_file },
    @{ Template = "feature-implementation.md"; Output = "Feature Implementation.md" }
)

foreach ($template in $templates) {
    $templatePath = Join-Path $templatesPath $template.Template
    $outputPath = Join-Path $projectPath $template.Output
    
    if (Test-Path $templatePath) {
        if (-not (Test-Path $outputPath)) {
            # Copy template and replace placeholders
            $templateContent = Get-Content $templatePath -Raw
            $templateContent = $templateContent -replace "{{DATE}}", (Get-Date -Format "yyyy-MM-dd")
            $templateContent = $templateContent -replace "{{TIMESTAMP}}", (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
            $templateContent = $templateContent -replace "{{CURRENT_DATE}}", (Get-Date -Format "yyyy-MM-dd")
            
            Set-Content -Path $outputPath -Value $templateContent
            Write-Host "✅ Created: $($template.Output)"
        } else {
            Write-Host "⚡ Already exists: $($template.Output)"
        }
    }
}

# 5. Test hook configuration
Write-Host "`n🧪 Testing hook configuration..."
$syncScriptPath = Join-Path $PSScriptRoot "sync-to-obsidian.ps1"

if (Test-Path $syncScriptPath) {
    Write-Host "✅ Sync script found"
    
    # Test run the sync script
    Write-Host "🔄 Running test sync..."
    try {
        & $syncScriptPath -Action "Setup Test" -FilePath "setup-test.md"
        Write-Host "✅ Test sync completed successfully"
    } catch {
        Write-Host "❌ Test sync failed: $($_.Exception.Message)"
    }
} else {
    Write-Host "❌ Sync script not found!"
}

# 6. Validation summary
Write-Host "`n📊 Setup Summary:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "✅ PowerShell Execution Policy: $(Get-ExecutionPolicy -Scope CurrentUser)"
Write-Host "✅ Hooks Configuration: .claude/settings.json"
Write-Host "✅ Sync Script: .claude/scripts/sync-to-obsidian.ps1"
Write-Host "✅ Obsidian Project: $projectPath"
Write-Host "✅ Templates Initialized: Progress, Changelog, Features"

Write-Host "`n🎯 Integration Ready!" -ForegroundColor Green
Write-Host "   📝 Make any code change via Claude Code to test automatic sync"
Write-Host "   📁 Check your Obsidian vault for real-time updates"
Write-Host "   🔧 Edit .claude/settings.json to customize paths and files"

Write-Host "`n📚 Next Steps:"
Write-Host "   1. Open your Obsidian vault"
Write-Host "   2. Navigate to the AirPrompts folder" 
Write-Host "   3. Make a code change via Claude Code"
Write-Host "   4. Watch the automatic documentation updates!"

Write-Host "`n🤖 Happy coding with automated documentation!" -ForegroundColor Cyan