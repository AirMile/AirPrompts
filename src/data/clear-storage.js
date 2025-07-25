// CLEAR LOCALSTORAGE FUNCTIE - kopieer deze code en plak in browser console

function clearAirPromptsStorage() {
  console.log('🧹 Clearing AirPrompts localStorage...');
  
  let clearedCount = 0;
  const keys = Object.keys(localStorage);
  
  keys.forEach(key => {
    if (key.startsWith('airprompts_')) {
      localStorage.removeItem(key);
      console.log(`✅ Removed: ${key}`);
      clearedCount++;
    }
  });
  
  console.log(`\n🎉 Cleared ${clearedCount} AirPrompts items from localStorage`);
  console.log('🔄 Reload the page to start fresh');
  
  // Ask user if they want to reload
  if (confirm('Storage cleared! Reload page now?')) {
    window.location.reload();
  }
}

// Maak functie beschikbaar in console
window.clearAirPromptsStorage = clearAirPromptsStorage;

console.log('🧹 Clear storage function loaded!');
console.log('💡 Run: clearAirPromptsStorage() to clear all AirPrompts data');