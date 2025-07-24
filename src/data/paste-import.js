// PASTE IMPORT - vervang de jsonData variabele met je backup data
const jsonData = `PLAK_HIER_JE_JSON_DATA`;

try {
  const data = JSON.parse(jsonData);
  let count = 0;
  
  Object.entries(data).forEach(([key, value]) => {
    if (key.startsWith('airprompts_')) {
      localStorage.setItem(key, JSON.stringify(value));
      console.log(`✅ Restored: ${key}`);
      count++;
    }
  });
  
  console.log(`🎉 Successfully imported ${count} items!`);
  console.log('🔄 Reload the page to see your data.');
  
  if (confirm('Import successful! Reload page now?')) {
    window.location.reload();
  }
  
} catch (error) {
  console.error('❌ Import failed:', error);
  console.log('💡 Make sure you pasted valid JSON data');
}