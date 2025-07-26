// Check workflow descriptions in localStorage
const workflows = localStorage.getItem('airprompts_workflows');
if (workflows) {
  const parsed = JSON.parse(workflows);
  console.log('Total workflows:', parsed.length);
  parsed.forEach((workflow, index) => {
    if (workflow.description && workflow.description.includes('folder:')) {
      console.log(`\nWorkflow ${index + 1}:`);
      console.log('ID:', workflow.id);
      console.log('Name:', workflow.name);
      console.log('Description:', workflow.description);
    }
  });
} else {
  console.log('No workflows found in localStorage');
}