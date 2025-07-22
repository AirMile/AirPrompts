# Git Branches Leerguide voor AirPrompts Refactoring

*Deze guide is speciaal gemaakt voor jou om morgen te gebruiken. Volg de stappen op je eigen tempo.*

## 📚 Deel 1: Git Branches Begrijpen

### Wat is een Branch?

Stel je je project voor als een trein op sporen:
```
main branch:  ====●====●====●===> (je huidige werkende code)
                    \
feature branch:      ●----●----●---> (je experiment)
```

- **Main branch** = Het hoofdspoor waar je stabiele code staat
- **Feature branch** = Een zijspoor waar je veilig kunt experimenteren
- Je kunt altijd terug naar het hoofdspoor zonder schade

### Waarom Branches Gebruiken?

1. **🛡️ Veiligheid**: Je main code blijft altijd werkend
2. **🧪 Experimenteren**: Test grote veranderingen zonder stress
3. **↩️ Makkelijk terugdraaien**: Niet tevreden? Gooi de branch weg
4. **📊 Overzicht**: Zie precies wat er veranderd is

## 🛠️ Deel 2: Essentiële Git Commands

### De 6 Commands die je moet kennen:

```powershell
# 1. Zie welke branch je nu gebruikt
git branch

# 2. Maak nieuwe branch EN ga er direct heen
git checkout -b naam-van-branch

# 3. Wissel tussen branches
git checkout main                    # Ga naar main
git checkout naam-van-branch         # Ga naar andere branch

# 4. Push branch naar GitHub (eerste keer)
git push -u origin naam-van-branch

# 5. Merge branch naar main (als je klaar bent)
git checkout main                    # Eerst naar main
git merge naam-van-branch           # Dan mergen

# 6. Verwijder oude branch
git branch -d naam-van-branch       # Na succesvolle merge
```

### 🎨 Visueel: Wat gebeurt er bij elke stap?

#### Start situatie:
```
main: A---B---C (jouw huidige code)
```

#### Na `git checkout -b refactor/feature`:
```
main:     A---B---C
                  ↘
refactor:          (nieuwe lege branch)
```

#### Na wat commits op je branch:
```
main:     A---B---C
                  ↘
refactor:          D---E---F (jouw wijzigingen)
```

#### Na merge:
```
main:     A---B---C---G (G = merge van je wijzigingen)
                  ↘ ↗
refactor:          D---E---F
```

## 🏃‍♂️ Deel 3: Practice Oefeningen (30 minuten)

### Oefening 1: Je Eerste Branch (10 min)

```powershell
# Stap 1: Check waar je bent
cd D:\Users\mzeil\personalProjects\AirPrompts
git status  # Moet clean zijn, anders eerst committen!
git branch  # Je ziet alleen: * main

# Stap 2: Maak practice branch
git checkout -b practice/mijn-eerste-branch

# Stap 3: Check dat het werkte
git branch  # Nu zie je:
            #   main
            # * practice/mijn-eerste-branch

# Stap 4: Maak een test wijziging
echo "// Test comment voor branch oefening" >> src/App.jsx

# Stap 5: Commit je wijziging
git add src/App.jsx
git commit -m "Test: Mijn eerste branch commit"

# Stap 6: Ga terug naar main
git checkout main

# Stap 7: Check App.jsx - je comment is weg!
# Dit laat zien dat main onveranderd is
```

### Oefening 2: Tussen Branches Switchen (10 min)

```powershell
# Je bent nu op main
git checkout practice/mijn-eerste-branch
# Check App.jsx - comment is terug!

git checkout main
# Check App.jsx - comment is weer weg!

# Dit is de magie van branches: elke branch heeft zijn eigen versie
```

### Oefening 3: Een Branch Mergen (10 min)

```powershell
# Zorg dat je op main bent
git checkout main

# Merge je practice branch
git merge practice/mijn-eerste-branch

# Check App.jsx - comment is nu ook op main!

# Ruim de branch op (niet meer nodig)
git branch -d practice/mijn-eerste-branch
```

## 🚀 Deel 4: Start Week 1 Refactoring

### Morgen's Concrete Stappenplan

#### 🌅 Ochtend Setup (30 minuten)

- [ ] **1. Project Status Check**
  ```powershell
  cd D:\Users\mzeil\personalProjects\AirPrompts
  git status
  # Als er uncommitted changes zijn:
  git add .
  git commit -m "Save work before refactoring"
  git push
  ```

- [ ] **2. Maak Backup Tag**
  ```powershell
  git tag backup-before-refactor-2024
  git push --tags
  echo "✅ Backup gemaakt! Je kunt altijd terug met: git checkout backup-before-refactor-2024"
  ```

- [ ] **3. Creëer Week 1 Branch**
  ```powershell
  git checkout -b refactor/week1-foundation
  echo "✅ Je werkt nu op een veilige branch!"
  ```

#### 🏗️ Store Implementation (2 uur)

- [ ] **4. Maak Store Structure**
  ```powershell
  # Maak directories
  mkdir src/store
  mkdir src/store/slices
  mkdir src/store/hooks
  ```

- [ ] **5. Implementeer App Store**
  - Open VS Code
  - Maak `src/store/appStore.js`
  - Kopieer de store code uit REFACTORING_PLAN.md
  - Save file

- [ ] **6. Test & Commit**
  ```powershell
  npm run dev  # Test of alles nog werkt
  
  # Als het werkt:
  git add src/store/
  git commit -m "Add: Central app store with useReducer"
  
  # Als het NIET werkt:
  git checkout -- .  # Gooi wijzigingen weg
  ```

#### 🔨 Homepage Splitting (2 uur)

- [ ] **7. Maak Component Directories**
  ```powershell
  mkdir -p src/components/features/dashboard/components
  ```

- [ ] **8. Create DashboardHeader Component**
  - Maak `src/components/features/dashboard/components/DashboardHeader.jsx`
  - Knip header logica uit Homepage.jsx
  - Plak in nieuwe component
  - Import in Homepage.jsx

- [ ] **9. Test Elke Stap**
  ```powershell
  npm run dev  # Na ELKE component
  
  # Werkt? Commit!
  git add .
  git commit -m "Refactor: Extract DashboardHeader from Homepage"
  ```

- [ ] **10. Herhaal voor andere componenten**
  - SearchBar
  - FilterBar
  - ItemGrid
  - Elke keer: extract → test → commit

#### 🎯 Einde van de Dag (30 minuten)

- [ ] **11. Push Branch naar GitHub**
  ```powershell
  git push -u origin refactor/week1-foundation
  echo "✅ Je werk is veilig opgeslagen op GitHub!"
  ```

- [ ] **12. Beslissing: Merge of Niet?**
  
  **Optie A: Je bent tevreden - Merge!**
  ```powershell
  git checkout main
  git merge refactor/week1-foundation
  git push
  git branch -d refactor/week1-foundation
  ```
  
  **Optie B: Meer werk nodig - Laat branch staan**
  ```powershell
  echo "Branch blijft staan voor morgen"
  # Morgen verder met: git checkout refactor/week1-foundation
  ```

## 🆘 Deel 5: Troubleshooting

### "Help, ik heb iets verprutst!"

#### Scenario 1: "Ik wil alle wijzigingen ongedaan maken"
```powershell
git status  # Zie wat er gewijzigd is
git checkout -- .  # Gooi ALLE wijzigingen weg
```

#### Scenario 2: "Ik wil terug naar main"
```powershell
git checkout main  # Ga naar main
# Je branch blijft bestaan, je kunt later terug
```

#### Scenario 3: "Ik wil de branch helemaal weggooien"
```powershell
git checkout main
git branch -D refactor/week1-foundation  # -D forceert verwijdering
```

#### Scenario 4: "Ik wil terug naar de backup"
```powershell
git checkout backup-before-refactor-2024
# Bekijk de oude staat
# Wil je hier blijven?
git checkout -b recovery-branch  # Maak nieuwe branch vanaf backup
```

### "Hoe zie ik wat er veranderd is?"

```powershell
# Zie gewijzigde bestanden
git status

# Zie exacte wijzigingen
git diff

# Vergelijk met main
git diff main

# Zie commit geschiedenis
git log --oneline -10
```

## 📋 Quick Reference Card

### Branch Commands Cheat Sheet
| Wat wil je? | Command |
|-------------|---------|
| Nieuwe branch maken | `git checkout -b branch-naam` |
| Naar andere branch | `git checkout branch-naam` |
| Zie alle branches | `git branch` |
| Verwijder branch | `git branch -d branch-naam` |
| Force verwijder | `git branch -D branch-naam` |
| Merge branch | `git checkout main && git merge branch-naam` |
| Push nieuwe branch | `git push -u origin branch-naam` |

### Commit Workflow
```powershell
git add .                    # Stage wijzigingen
git commit -m "Type: Wat"    # Commit met message
git push                     # Push naar GitHub
```

### Panic Buttons
```powershell
git checkout -- .            # ❌ Gooi wijzigingen weg
git checkout main           # 🏠 Ga naar veilige main
git reset --hard HEAD       # 💣 Reset alles naar laatste commit
```

## ✅ Morgen's Checklist

### Voorbereiding (Vanavond nog)
- [ ] Lees deze guide door
- [ ] Zorg dat VS Code open staat
- [ ] Check dat `npm run dev` werkt

### Morgenochtend
- [ ] ☕ Koffie/thee zetten
- [ ] 📱 Zet telefoon op stil
- [ ] 💾 Backup tag maken
- [ ] 🌿 Week 1 branch aanmaken
- [ ] 🏗️ Store implementeren
- [ ] ✂️ Homepage splitsen
- [ ] 🎉 Vieren dat je branches hebt geleerd!

## 💡 Pro Tips

1. **Commit vaak**: Op een branch mag dat! Liever 10 kleine commits dan 1 grote
2. **Descriptieve messages**: "Fix bug" ❌ vs "Fix: Navigation menu not closing on mobile" ✅
3. **Test voor commit**: Altijd `npm run dev` draaien voor je commit
4. **Branch namen**: `refactor/homepage-split` is duidelijker dan `branch1`
5. **Geen paniek**: Je kunt ALTIJD terug naar main

## 🎓 Wat heb je morgen geleerd?

Na morgen kun je:
- ✅ Veilig experimenteren met branches
- ✅ Grote refactoring opdelen in kleine stappen
- ✅ Professioneel werken met git
- ✅ Met vertrouwen code wijzigen

---

**Succes morgen! Je kunt dit! 💪**

*P.S. Print deze guide uit of houd hem open in een apart venster*