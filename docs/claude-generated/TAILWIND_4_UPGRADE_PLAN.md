# 🚀 Tailwind CSS 4.0 Upgrade Plan

## Projectoverzicht
- **Huidige versie**: Tailwind CSS 3.4.17
- **Doelversie**: Tailwind CSS 4.0
- **Framework**: React + Vite
- **Speciale features**: Custom CSS variabelen, dark theme, multiple theme variants

---

## 📋 Impact Analyse

### Huidige Setup
- ✅ **Modern architectuur**: CSS variabelen met RGB tuples
- ✅ **Geavanceerde theming**: Dark mode + purple/orange themes  
- ✅ **Modulaire CSS**: Gescheiden concerns (colors, dragDrop, globals)
- ✅ **Custom animaties**: Uitgebreide keyframes en animaties
- ✅ **Extended spacing**: Custom spacing en border radius waarden

### Breaking Changes in v4
| Component | Wijziging | Impact | Actie Vereist |
|-----------|-----------|---------|---------------|
| **Import syntax** | `@tailwind` → `@import "tailwindcss"` | 🔴 Hoog | CSS bestanden updaten |
| **Config format** | JS config → CSS `@theme` | 🔴 Hoog | Migratie naar CSS config |
| **PostCSS setup** | Nieuwe dedicated plugins | 🟡 Medium | Config updates |
| **Vite integratie** | `@tailwindcss/vite` plugin | 🟡 Medium | Vite config update |
| **Shadow defaults** | `shadow` = 1px ipv 3px | 🟡 Medium | Classes checken |
| **Ring defaults** | `ring` = 1px ipv 3px | 🟡 Medium | Classes checken |
| **Border colors** | Default naar `currentColor` | 🟡 Medium | Expliciete kleuren |

---

## 🛠️ Stap-voor-stap Migratie Plan

### **Fase 1: Voorbereiding** 
*Prioriteit: 🔴 Kritiek*

#### 1.1 Backup maken
```bash
# Maak backup directory
mkdir tailwind-v3-backup

# Kopieer kritieke bestanden
cp tailwind.config.js tailwind-v3-backup/
cp postcss.config.js tailwind-v3-backup/
cp package.json tailwind-v3-backup/
cp -r src/styles/ tailwind-v3-backup/styles/
```

#### 1.2 Upgrade tool uitvoeren
```bash
# Officiële Tailwind upgrade tool
npx @tailwindcss/upgrade
```

---

### **Fase 2: Dependencies Update**
*Prioriteit: 🔴 Kritiek*

#### 2.1 Package.json updates
```json
{
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "autoprefixer": "^10.4.21"
  }
}
```

#### 2.2 Verwijder deprecated packages
```bash
npm uninstall @tailwindcss/nesting
npm install @tailwindcss/vite tailwindcss@4
```

---

### **Fase 3: Vite Configuratie**
*Prioriteit: 🔴 Kritiek*

#### 3.1 Update vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss() // Vervang PostCSS setup
  ]
})
```

---

### **Fase 4: CSS Configuratie Migratie**
*Prioriteit: 🔴 Kritiek*

#### 4.1 Update src/styles/globals.css
```css
/* V4 import syntax */
@import "tailwindcss";
@import './colors.css';
@import './dragDrop.css';
@import './components.css';

/* Migreer config naar CSS */
@theme {
  /* Custom spacing behouden */
  --spacing-18: 4.5rem;
  --spacing-88: 22rem;
  --spacing-128: 32rem;
  
  /* Custom border radius */
  --radius-xl: 1rem;
  --radius-2xl: 1.25rem;
  --radius-3xl: 1.5rem;
  
  /* Custom shadows */
  --shadow-soft: 0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04);
  --shadow-soft-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-inner-soft: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  
  /* Custom backdrop blur */
  --blur-xs: 2px;
  
  /* Custom breakpoint indien nodig */
  --breakpoint-3xl: 120rem;
}

/* Custom animaties als @utility */
@utility fade-in { animation: fadeIn 0.3s ease-in-out; }
@utility fade-out { animation: fadeOut 0.3s ease-in-out; }
@utility slide-in { animation: slideIn 0.3s ease-in-out; }
@utility slide-out { animation: slideOut 0.3s ease-in-out; }
@utility scale-in { animation: scaleIn 0.2s ease-in-out; }
@utility bounce-subtle { animation: bounceSubtle 0.6s ease-in-out; }
@utility pulse-soft { animation: pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

/* Keyframes definitie */
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes fadeOut {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes slideIn {
  0% { transform: translateY(-10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes slideOut {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-10px); opacity: 0; }
}

@keyframes scaleIn {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounceSubtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes pulseSoft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Bestaande global styles behouden... */
```

#### 4.2 Behoud colors.css integriteit
*De bestaande `src/styles/colors.css` kan grotendeels ongewijzigd blijven omdat het al CSS variabelen gebruikt die compatibel zijn met v4.*

---

### **Fase 5: PostCSS Simplificatie**
*Prioriteit: 🟡 Medium*

#### 5.1 Update postcss.config.js
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {}
    // autoprefixer en nesting zijn nu ingebouwd
  }
}
```

---

### **Fase 6: Breaking Changes Fixes**
*Prioriteit: 🟡 Medium*

#### 6.1 Utility class updates zoeken en vervangen
```bash
# Zoek naar shadow utilities die update nodig hebben
grep -r "shadow\b" src/ --include="*.jsx" --include="*.js"

# Zoek naar ring utilities
grep -r "ring\b" src/ --include="*.jsx" --include="*.js"
```

#### 6.2 Vervangingen:
- `shadow` → `shadow-sm` (1px → 3px)
- `shadow-sm` → `shadow-xs`
- `ring` → `ring-3` (1px → 3px)
- CSS variabelen in arbitrary values: `bg-[--brand-color]` → `bg-(--brand-color)`

---

### **Fase 7: Dark Theme & Custom Themes Verificatie**
*Prioriteit: 🟡 Medium*

#### 7.1 Test scenarios
- [ ] Default dark mode via `@media (prefers-color-scheme: dark)`
- [ ] `.theme-purple` class functionality
- [ ] `.theme-orange` class functionality  
- [ ] Alle `dark:` variant utilities
- [ ] Custom CSS variabelen in dark mode

#### 7.2 Verificatie checklist
```bash
# Test build
npm run build

# Test development
npm run dev

# Check for console errors
# Verificeer visual themes in browser
```

---

## ⚠️ Belangrijke Aandachtspunten

### CSS Modules/Scoped Styles
Als je components hebt met `<style scoped>` of CSS modules:
```vue
<style scoped>
  @reference "../styles/globals.css";
  
  .my-class {
    @apply bg-blue-500;
  }
</style>
```

### Hover Behavior Change
V4 hover variant werkt alleen op hover-capable devices. Indien nodig:
```css
@custom-variant hover (&:hover);
```

### Border Color Fallback
Voor expliciete v3 border gedrag:
```css
@layer base {
  *,
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    border-color: var(--color-gray-200, currentColor);
  }
}
```

---

## 🎯 Verwachte Voordelen

| Voordeel | Impact | Beschrijving |
|----------|--------|--------------|
| **Build Performance** | 🟢 Hoog | Tot 10x snellere builds met Vite plugin |
| **Bundle Size** | 🟢 Hoog | Efficiëntere CSS generatie |
| **Developer Experience** | 🟢 Medium | Native CSS variables in DevTools |
| **Future Proof** | 🟢 Medium | CSS-first ecosystem compatibility |
| **Memory Usage** | 🟢 Low | Lagere memory footprint tijdens build |

---

## 📊 Tijdsplanning

| Fase | Geschatte tijd | Complexiteit |
|------|----------------|--------------|
| **Voorbereiding** | 30 min | 🟢 Laag |
| **Dependencies** | 15 min | 🟢 Laag |
| **Vite Config** | 15 min | 🟢 Laag |
| **CSS Migratie** | 1-2 uur | 🔴 Hoog |
| **PostCSS Update** | 15 min | 🟢 Laag |
| **Breaking Changes** | 30-60 min | 🟡 Medium |
| **Testing** | 1-2 uur | 🟡 Medium |

**Totaal: 3-5 uur**

---

## 🔄 Rollback Plan

Indien er problemen ontstaan:

```bash
# Restore backup
cp tailwind-v3-backup/* .
cp -r tailwind-v3-backup/styles/ src/

# Downgrade packages
npm install tailwindcss@3.4.17

# Restore git state
git checkout HEAD~1  # Als gecommit
```

---

## ✅ Post-Migration Checklist

- [ ] Alle builds slagen zonder errors
- [ ] Visual regression test van alle themes
- [ ] Performance benchmarks vergelijken
- [ ] Dark mode functionality getest
- [ ] Custom animaties werken correct
- [ ] CSS-in-JS libraries nog werkend
- [ ] Documentation updates waar nodig

---

## 📚 Resources

- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Vite Integration Documentation](https://tailwindcss.com/docs/installation/using-vite)
- [CSS-first Configuration](https://tailwindcss.com/docs/theme)
- [Breaking Changes Reference](https://tailwindcss.com/docs/upgrade-guide#breaking-changes)

---

*Plan gemaakt op: {datum}*  
*Project: AirPrompts*  
*Tailwind versie: 3.4.17 → 4.0*