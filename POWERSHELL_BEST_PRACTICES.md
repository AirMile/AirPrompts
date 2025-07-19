# PowerShell Command Best Practices for Copilot

## Key Differences from Bash/Unix Shells

### 1. Command Chaining
❌ **DON'T USE (Bash syntax):**
```bash
cd folder && npm install
command1 && command2
```

✅ **USE (PowerShell syntax):**
```powershell
cd folder; npm install
command1; command2
```

### 2. Directory Creation
❌ **DON'T USE:**
```bash
mkdir -p src/components/common
```

✅ **USE:**
```powershell
New-Item -ItemType Directory -Path "src/components/common" -Force
```

### 3. File Path Handling
❌ **DON'T USE:**
```bash
./node_modules/.bin/command
```

✅ **USE:**
```powershell
.\node_modules\.bin\command
# OR better yet:
npm exec command
```

### 4. Environment Variables
❌ **DON'T USE:**
```bash
export NODE_ENV=production
```

✅ **USE:**
```powershell
$env:NODE_ENV = "production"
```

### 5. Background Processes
❌ **DON'T USE:**
```bash
npm run dev &
```

✅ **USE:**
```powershell
Start-Process -NoNewWindow npm -ArgumentList "run", "dev"
# OR use the run_in_terminal tool with isBackground=true
```

## Common PowerShell Commands for Development

### Directory Operations
```powershell
# Create directory (with parents)
New-Item -ItemType Directory -Path "path/to/folder" -Force

# List directory contents
Get-ChildItem
# OR
ls

# Change directory
Set-Location "path"
# OR
cd "path"

# Remove directory and contents
Remove-Item -Recurse -Force "folder"
```

### File Operations
```powershell
# Create empty file
New-Item -ItemType File -Path "filename.txt"

# Copy file
Copy-Item "source.txt" "destination.txt"

# Move/rename file
Move-Item "old.txt" "new.txt"

# Delete file
Remove-Item "filename.txt"
```

### Package Management
```powershell
# Install packages
npm install
npm install package-name
npm install -D package-name

# Run scripts
npm run dev
npm run build
npm run test

# Execute local binaries
npm exec command-name
npx command-name
```

### Process Management
```powershell
# Start background process
Start-Process -NoNewWindow npm -ArgumentList "run", "dev"

# Kill process by name
Stop-Process -Name "node" -Force

# List running processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

## Copilot Instructions for PowerShell Development

When working in a Windows environment with PowerShell:

1. **Always use semicolons (;) instead of && for command chaining**
2. **Use New-Item for directory creation with -Force flag**
3. **Use backslashes (\) in Windows paths, not forward slashes**
4. **Prefer npm exec over direct node_modules/.bin/ access**
5. **Use double quotes for paths with spaces**
6. **Remember PowerShell is case-insensitive but keep consistent casing**
7. **Use $env: prefix for environment variables**
8. **For background processes, use Start-Process or run_in_terminal with isBackground=true**

## Quick Reference Commands

```powershell
# Project setup
npm create vite@latest project-name -- --template react
cd project-name
npm install

# Development workflow
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run preview               # Preview production build

# Package management
npm install package-name       # Install dependency
npm install -D package-name    # Install dev dependency
npm uninstall package-name     # Remove package
npm update                     # Update all packages

# File/Directory operations
New-Item -ItemType Directory -Path "src/components" -Force
New-Item -ItemType File -Path "src/App.jsx"
Copy-Item "source" "destination"
Remove-Item "file-or-folder" -Recurse -Force
```

## Error Prevention Checklist

- [ ] Used semicolons (;) instead of && for command chaining
- [ ] Used New-Item instead of mkdir -p
- [ ] Used backslashes in Windows paths
- [ ] Wrapped paths with spaces in quotes
- [ ] Used npm exec instead of direct binary paths
- [ ] Set isBackground=true for long-running processes in run_in_terminal
- [ ] Used PowerShell-specific syntax for environment variables

Remember: When in doubt, test commands in small parts and use the specific PowerShell syntax rather than assuming Bash compatibility.
