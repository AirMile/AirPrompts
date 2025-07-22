# Offline Test Scenarios

Deze test scenarios helpen bij het verifiëren van de offline functionaliteit van AirPrompts.

## Test Voorbereidingen

1. Open de browser developer tools (F12)
2. Ga naar Network tab
3. Open de console om log berichten te zien

## Test Scenario 1: Basic Offline Operations

### Stappen:
1. Start de applicatie normaal
2. Creëer een nieuwe template/workflow/snippet
3. In Developer Tools > Network tab, selecteer "Offline" mode
4. Console toont: "App is offline - operations will be queued"
5. Probeer een nieuwe template te maken
6. Probeer een bestaande template te updaten
7. Probeer een item te verwijderen

### Verwacht resultaat:
- Alle operaties worden optimistisch uitgevoerd (UI update direct)
- Console logs tonen "Sync Queue: X operations pending"
- Data wordt lokaal opgeslagen maar niet gesynchroniseerd

## Test Scenario 2: Coming Back Online

### Stappen:
1. Voer eerst Test Scenario 1 uit
2. In Developer Tools > Network tab, deselecteer "Offline" mode
3. Wacht enkele seconden

### Verwacht resultaat:
- Console toont: "App is back online"
- Console toont: "Processing pending operations..."
- Alle queued operaties worden verwerkt
- Console toont sync status updates

## Test Scenario 3: Failed Operations Retry

### Stappen:
1. Ga offline
2. Maak meerdere wijzigingen
3. Simuleer een fout door localStorage tijdelijk read-only te maken
4. Ga online
5. Fix de localStorage permissies

### Verwacht resultaat:
- Failed operations krijgen status "error"
- Console toont: "Retrying X failed operations"
- Operations worden automatisch opnieuw geprobeerd (max 3x)

## Test Scenario 4: Data Persistence

### Stappen:
1. Ga offline
2. Maak nieuwe items aan
3. Refresh de pagina (blijf offline)
4. Ga online

### Verwacht resultaat:
- Optimistische updates blijven behouden na refresh
- Sync queue blijft behouden na refresh
- Bij online komen worden alle operations alsnog verwerkt

## Test Scenario 5: Concurrent Updates

### Stappen:
1. Open app in twee browser tabs
2. Tab 1: Ga offline en maak wijzigingen
3. Tab 2: Blijf online en maak andere wijzigingen
4. Tab 1: Ga weer online

### Verwacht resultaat:
- Beide sets wijzigingen worden behouden
- Geen data verlies
- Console logs tonen sync activiteit

## Debugging Tips

### Console Commands:
```javascript
// Check online status
navigator.onLine

// View sync queue
const { useSyncQueue } = await import('./src/services/sync/SyncQueue');
useSyncQueue.getState().queue

// Check pending count
useSyncQueue.getState().getPendingCount()

// Manually trigger sync
useSyncQueue.getState().processQueue()

// Clear sync queue (development only!)
useSyncQueue.getState().clearQueue()
```

### LocalStorage Inspection:
- `airprompts-sync-queue`: Bevat alle pending operations
- `airprompts_templates/workflows/snippets`: Bevat de actual data

## Known Limitations

1. Offline mode werkt alleen voor create/update/delete operations
2. Zoeken en filteren gebruikt cached data tijdens offline
3. Bij conflicten wint de laatste write (no conflict resolution)
4. Max 3 retry attempts voor failed operations