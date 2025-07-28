# Claude Code + Obsidian Integration

> **Automatische documentatie sync tussen Claude Code en Obsidian vault**

## 🚀 Wat doet dit systeem?

Dit systeem zorgt ervoor dat elke keer als je code wijzigt via Claude Code, automatisch je Obsidian vault wordt bijgewerkt met:

- **Progress tracking** - Real-time voortgang
- **Changelog** - Automatische change logs
- **Feature tracking** - Component ontwikkeling
- **Code metrics** - Statistieken en analyses

## 📁 Bestands Structuur

```
.claude/
├── settings.json           # Configuratie voor hooks en Obsidian
├── scripts/
│   └── sync-to-obsidian.ps1  # PowerShell sync script
├── templates/
│   ├── obsidian-progress.md     # Progress tracking template
│   ├── obsidian-changelog.md    # Changelog template
│   └── feature-implementation.md # Feature tracking template
└── README.md               # Deze documentatie
```

## ⚙️ Configuratie

### 1. Obsidian Vault Path Instellen

Pas `.claude/settings.json` aan naar jouw specifieke setup:

```json
{
  "obsidian": {
    "vault_path": "C:/Users/YourUsername/Documents/Obsidian/",
    "project_folder": "AirPrompts",
    "progress_file": "Development Progress.md",
    "changelog_file": "Changelog.md"
  }
}
```

### 2. PowerShell Execution Policy

Zorg dat PowerShell scripts kunnen draaien:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 3. Obsidian Vault Structuur

Het systeem maakt automatisch deze bestanden aan in je vault:

```
YourObsidianVault/
└── AirPrompts/
    ├── Development Progress.md
    ├── Changelog.md
    ├── Feature Implementation.md
    └── Code Metrics.md
```

## 🔧 Hoe werkt het?

### Trigger Events

Het systeem triggert automatisch na:

- `Write` - Nieuwe bestanden
- `Edit` - Bestands wijzigingen
- `MultiEdit` - Bulk wijzigingen

### Sync Process

1. **Hook detecteert** file operatie
2. **PowerShell script** start automatisch
3. **Obsidian bestanden** worden bijgewerkt
4. **Progress tracking** in real-time

### Output Types

- **Progress Updates**: Timestamp + file info
- **Changelog Entries**: Gestructureerde change logs
- **Feature Tracking**: Component development status
- **Code Metrics**: Lines, functions, complexity

## 📊 Features

### ✅ Automatische Tracking

- [x] File wijzigingen
- [x] Component updates
- [x] Feature progress
- [x] Code statistieken

### ✅ Real-time Sync

- [x] Instant Obsidian updates
- [x] No manual intervention
- [x] Structured documentation
- [x] Historical tracking

### ✅ Configureerbaar

- [x] Custom vault paths
- [x] Flexible file naming
- [x] Template customization
- [x] Selective tracking

## 🧪 Testing

### Quick Test

1. Maak een test bestand: `touch test.md`
2. Edit het bestand via Claude Code
3. Check je Obsidian vault voor updates

### Debug Mode

Om problemen op te lossen:

```powershell
# Run script handmatig om errors te zien
.\.claude\scripts\sync-to-obsidian.ps1 -Action "Test" -FilePath "test.md"
```

## 🔍 Troubleshooting

### Veelvoorkomende Problemen

#### PowerShell Execution Policy

```powershell
# Fix execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Obsidian Path Issues

```json
// Gebruik forward slashes in settings.json
"vault_path": "C:/Users/Username/Documents/Obsidian/"
```

#### Script Not Running

1. Check file permissions
2. Verify PowerShell path in settings.json
3. Test script manually

### Log Output

Het script logt naar console:

- ✅ Successful operations
- ❌ Error messages
- 📁 File paths used
- 📝 Files updated

## 🎯 Next Steps

### Mogelijke Uitbreidingen

- [ ] Git commit message sync
- [ ] Trello card updates
- [ ] Slack notifications
- [ ] Code review tracking
- [ ] Performance metrics

### Customization

- Pas templates aan naar jouw workflow
- Voeg extra sync targets toe
- Integreer met andere tools
- Configureer notificaties

## 💡 Tips

### Best Practices

- Houd vault paths absoluut (niet relatief)
- Test eerst met een klein bestand
- Backup je Obsidian vault voor eerste gebruik
- Gebruik duidelijke project folder namen

### Performance

- Script is geoptimaliseerd voor snelheid
- Alleen relevante bestanden worden getracked
- Incremental updates, geen volledige sync

---

**🤖 Dit systeem is gebouwd voor maximale automatisering - code wijzigen, documentatie sync gebeurt automatisch!**
