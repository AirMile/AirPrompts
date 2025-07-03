# Copilot Instructions for This Project

## Environment Detection and Terminal Commands

When working in this project, always check the user's environment before executing terminal commands:

### Working Directory Management
**CRITICAL:** This project is located in a subdirectory: `d:\Users\mzeil\personalProjects\AirPrompts\prompt-template-system`

1. **Check current working directory** before running commands
2. **For background=false terminal commands:** The working directory is set in context
3. **If running from wrong directory:** Use `cd prompt-template-system` to navigate to project root
4. **All npm commands MUST be run from the project directory** (where package.json exists)
5. **Common error:** Running commands from `AirPrompts` instead of `AirPrompts\prompt-template-system`

### Directory Fix Pattern
```powershell
# If you get "ENOENT: no such file or directory, open package.json":
cd prompt-template-system
# Then run your npm command
npm run dev
```

### Windows/PowerShell Environment
If the user is working on Windows with PowerShell (indicated by shell: "powershell.exe" in environment info):

1. **MUST READ:** `POWERSHELL_BEST_PRACTICES.md` file in the project root before executing any terminal commands
2. **Follow PowerShell syntax** - DO NOT use Bash/Unix syntax
3. **Key reminders:**
   - Use `;` instead of `&&` for command chaining
   - Use `New-Item` instead of `mkdir -p`
   - Use backslashes `\` in Windows paths
   - Use `npm exec` instead of `./node_modules/.bin/`
   - Set `isBackground=true` for long-running processes

### Example Workflow
```markdown
1. Check environment_info for shell type
2. If powershell.exe detected → Read POWERSHELL_BEST_PRACTICES.md
3. Apply correct syntax based on the guide
4. **ALWAYS use: cd prompt-template-system; [npm-command]**
5. Execute commands with proper PowerShell format
```

## Project-Specific Guidelines

### Technology Stack
- **Framework:** React with Vite
- **Styling:** Tailwind CSS with custom CSS variables
- **Icons:** Lucide React
- **Environment:** Windows/PowerShell

### Custom Color System
This project uses a custom color system with CSS variables:
- `primary` (blue shades 50-900)
- `secondary` (gray shades 50-900) 
- `success` (green shades 50-900)
- `danger` (red shades 50-900)

Colors are defined in `src/styles/colors.css` and configured in `tailwind.config.js` using CSS variables for dynamic theming.

### File Structure
```
src/
├── components/
│   └── common/          # Reusable UI components
├── config/              # Configuration files
├── hooks/               # Custom React hooks
├── types/               # Type definitions
└── styles/              # CSS files
    ├── colors.css       # Color variables
    └── globals.css      # Global styles + Tailwind
```

## Development Commands (PowerShell)
**ALWAYS use directory navigation for npm commands:**
```powershell
# Start development server
cd prompt-template-system; npm run dev

# Build for production  
cd prompt-template-system; npm run build

# Install new package
cd prompt-template-system; npm install package-name

# Any npm command pattern
cd prompt-template-system; npm [command]
```

**NEVER run npm commands without cd first:**
❌ `npm run dev` (will fail - wrong directory)
✅ `cd prompt-template-system; npm run dev` (correct pattern)

### File Operations (from correct directory)
```powershell
# Create directories
New-Item -ItemType Directory -Path "src/components/feature" -Force
```

## Error Prevention
- **MANDATORY: Use `cd prompt-template-system; npm [command]` for ALL npm operations**
- **NEVER run npm commands without cd first - they will fail**
- **ALWAYS check working directory before running npm commands**
- **Navigate to prompt-template-system directory if needed**
- Always reference POWERSHELL_BEST_PRACTICES.md when working with terminal commands
- Test PowerShell commands before execution if unsure
- Use the error prevention checklist in the best practices file
- When in doubt, use the PowerShell-specific syntax patterns provided
- **If you see package.json errors, you're in the wrong directory - navigate to project root**

Remember: This project is specifically configured for Windows/PowerShell development. Always prioritize PowerShell compatibility over Bash syntax.
