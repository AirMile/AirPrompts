// IMPORT FUNCTIE - kopieer deze code en plak in browser console
function importAirPromptsBackup() {
  console.log('📁 Select your backup JSON file...');
  
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';
  
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) {
      console.log('❌ No file selected');
      return;
    }
    
    console.log(`📄 Reading file: ${file.name}`);
    
    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const data = JSON.parse(event.target.result);
        console.log('✅ JSON parsed successfully');
        
        let importCount = 0;
        let errorCount = 0;
        
        // Import all AirPrompts data
        Object.entries(data).forEach(([key, value]) => {
          if (key.startsWith('airprompts_')) {
            try {
              localStorage.setItem(key, JSON.stringify(value));
              console.log(`✅ Restored: ${key} (${Array.isArray(value) ? value.length + ' items' : typeof value})`);
              importCount++;
            } catch (err) {
              console.error(`❌ Failed to restore ${key}:`, err);
              errorCount++;
            }
          }
        });
        
        console.log('\n🎉 Import completed!');
        console.log(`📊 Statistics:`);
        console.log(`   ✅ Successfully imported: ${importCount} items`);
        console.log(`   ❌ Errors: ${errorCount} items`);
        console.log('\n🔄 Reload the page to see your restored data.');
        
        // Ask user if they want to reload
        if (confirm('Import successful! Reload page now to see your data?')) {
          window.location.reload();
        }
        
      } catch (err) {
        console.error('❌ Invalid JSON file:', err);
        console.log('💡 Make sure you selected a valid AirPrompts backup file');
      }
    };
    
    reader.onerror = function() {
      console.error('❌ Error reading file');
    };
    
    reader.readAsText(file);
  };
  
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

// Maak functie beschikbaar in console
window.importAirPromptsBackup = importAirPromptsBackup;

console.log('📥 Import function loaded!');
console.log('💡 Run: importAirPromptsBackup() to restore your backup');