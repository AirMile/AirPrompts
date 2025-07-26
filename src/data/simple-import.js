// EENVOUDIGE IMPORT - kopieer deze code en plak in browser console
function importAirPromptsBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return console.log('❌ No file selected');
    
    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const data = JSON.parse(event.target.result);
        let count = 0;
        Object.entries(data).forEach(([key, value]) => {
          if (key.startsWith('airprompts_')) {
            localStorage.setItem(key, JSON.stringify(value));
            console.log(`✅ ${key}`);
            count++;
          }
        });
        console.log(`🎉 Imported ${count} items! Reload page to see data.`);
        if (confirm('Reload page now?')) window.location.reload();
      } catch (err) {
        console.error('❌ Invalid JSON:', err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

window.importAirPromptsBackup = importAirPromptsBackup;
console.log('📥 Import ready! Run: importAirPromptsBackup()');