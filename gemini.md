# Gemini Instructions for This Project

## Core Project Rules

- **Working Directory:** The project's root is `D:\Users\mzeil\personalProjects\AirPrompts\prompt-template-system`. All `npm` commands **must** be executed from this subdirectory.
- **Environment:** The development environment is Windows/PowerShell. All shell commands must use PowerShell syntax. Refer to `POWERSHELL_BEST_PRACTICES.md` for specific syntax rules.
- **Command Execution:** Always prefix `npm` commands with a directory change. Example: `cd prompt-template-system; npm run dev`.

## Technology Stack

- **Framework:** React with Vite
- **Styling:** Tailwind CSS
- **UI Colors:** A custom color system is defined in `src/styles/colors.css` and used in `tailwind.config.js`.
- **Icons:** Lucide React

## Key File Locations

- **Source Code:** `src/`
- **Components:** `src/components/`
- **Color Definitions:** `src/styles/colors.css`
- **Type Definitions:** `src/types/`

## Development Commands (PowerShell)

- **Start Dev Server:** `cd prompt-template-system; npm run dev`
- **Build Project:** `cd prompt-template-system; npm run build`
- **Install Package:** `cd prompt-template-system; npm install <package-name>`
