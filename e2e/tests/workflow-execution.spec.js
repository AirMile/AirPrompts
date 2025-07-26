import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers.js';
import { testTemplates, testWorkflows, testVariables } from '../fixtures/test-data.js';

test.describe('Workflow Execution', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.navigateToHomepage();
    
    // Create required templates for workflows
    await helpers.navigateToTemplates();
    for (const template of testTemplates) {
      await helpers.createTemplate(template);
    }
  });

  test('should create and execute a simple workflow', async ({ page }) => {
    await helpers.navigateToWorkflows();
    
    // Create workflow
    const workflow = {
      name: 'Test Workflow',
      description: 'A test workflow',
      category: 'development',
      steps: [
        { templateId: testTemplates[0].name },
        { templateId: testTemplates[1].name }
      ]
    };
    
    await helpers.createWorkflow(workflow);
    
    // Execute workflow
    await helpers.executeWorkflow(workflow.name, {
      ...testVariables.email,
      ...testVariables.codeReview
    });
    
    // Verify output contains results from both templates
    const output = await page.locator('.workflow-output').textContent();
    expect(output).toContain('Dear ' + testVariables.email.recipient_name);
    expect(output).toContain('Code Review for PR: ' + testVariables.codeReview.pr_number);
  });

  test('should pass output between workflow steps', async ({ page }) => {
    await helpers.navigateToWorkflows();
    
    // Create templates that use previous output
    await helpers.navigateToTemplates();
    await helpers.createTemplate({
      name: 'Step 1 Template',
      description: 'First step',
      category: 'development',
      content: 'Generated ID: {id}\nGenerated Name: {name}'
    });
    
    await helpers.createTemplate({
      name: 'Step 2 Template',
      description: 'Second step using previous output',
      category: 'development',
      content: 'Previous output:\n{previous_output}\n\nProcessed: {processed}'
    });
    
    // Create workflow with chained steps
    await helpers.navigateToWorkflows();
    const chainedWorkflow = {
      name: 'Chained Workflow',
      description: 'Workflow with output chaining',
      category: 'development',
      steps: [
        { templateId: 'Step 1 Template' },
        { templateId: 'Step 2 Template' }
      ]
    };
    
    await helpers.createWorkflow(chainedWorkflow);
    
    // Execute with variables
    await helpers.executeWorkflow(chainedWorkflow.name, {
      id: '12345',
      name: 'Test Item',
      processed: 'true'
    });
    
    // Verify output chaining
    const output = await page.locator('.workflow-output').textContent();
    expect(output).toContain('Generated ID: 12345');
    expect(output).toContain('Generated Name: Test Item');
    expect(output).toContain('Previous output:');
    expect(output).toContain('Processed: true');
  });

  test('should handle workflow with missing variables', async ({ page }) => {
    await helpers.navigateToWorkflows();
    
    // Create workflow
    const workflow = testWorkflows[0];
    await helpers.createWorkflow(workflow);
    
    // Try to execute without filling variables
    await page.click(`text="${workflow.name}"`);
    await page.click('button:has-text("Execute Workflow")');
    
    // Verify validation messages
    await expect(page.locator('.error-message')).toContainText('Please fill in all required variables');
    await expect(page.locator('.field-error')).toBeVisible();
  });

  test('should save workflow execution history', async ({ page }) => {
    await helpers.navigateToWorkflows();
    
    // Create and execute workflow multiple times
    const workflow = testWorkflows[0];
    await helpers.createWorkflow(workflow);
    
    // Execute workflow 3 times with different variables
    for (let i = 1; i <= 3; i++) {
      await helpers.executeWorkflow(workflow.name, {
        ...testVariables.email,
        subject: `Test Subject ${i}`
      });
      await page.click('button:has-text("Back to Workflows")');
    }
    
    // Check execution history
    await page.click(`text="${workflow.name}"`);
    await page.click('button:has-text("History")');
    
    // Verify 3 executions are recorded
    const historyItems = page.locator('.history-item');
    await expect(historyItems).toHaveCount(3);
    
    // Verify latest execution is first
    await expect(historyItems.first()).toContainText('Test Subject 3');
  });

  test('should handle workflow step failures gracefully', async ({ page }) => {
    await helpers.navigateToTemplates();
    
    // Create template with invalid syntax
    await helpers.createTemplate({
      name: 'Broken Template',
      description: 'Template with error',
      category: 'development',
      content: 'This has an unclosed {variable'
    });
    
    // Create workflow with broken template
    await helpers.navigateToWorkflows();
    const brokenWorkflow = {
      name: 'Broken Workflow',
      description: 'Workflow with error',
      category: 'development',
      steps: [
        { templateId: testTemplates[0].name },
        { templateId: 'Broken Template' }
      ]
    };
    
    await helpers.createWorkflow(brokenWorkflow);
    
    // Execute workflow
    await page.click(`text="${brokenWorkflow.name}"`);
    await page.fill('input[name="recipient_name"]', 'Test User');
    await page.fill('input[name="subject"]', 'Test');
    await page.fill('input[name="sender_name"]', 'Sender');
    await page.click('button:has-text("Execute Workflow")');
    
    // Verify error handling
    await expect(page.locator('.error-message')).toContainText('Error in step 2');
    await expect(page.locator('.step-status-error')).toBeVisible();
    
    // Verify partial output from successful steps
    const output = await page.locator('.workflow-output').textContent();
    expect(output).toContain('Step 1 completed successfully');
  });

  test('should allow workflow step reordering', async ({ page }) => {
    await helpers.navigateToWorkflows();
    
    // Create workflow with multiple steps
    await page.click('button:has-text("New Workflow")');
    await page.fill('input[name="name"]', 'Reorderable Workflow');
    
    // Add 3 steps
    for (let i = 0; i < 3; i++) {
      await page.click('button:has-text("Add Step")');
      await page.selectOption(`select[name="template-${i}"]`, testTemplates[i].name);
    }
    
    // Reorder steps (drag step 3 to position 1)
    const step3 = page.locator('.workflow-step').nth(2);
    const step1 = page.locator('.workflow-step').nth(0);
    
    await step3.dragTo(step1);
    
    // Save workflow
    await page.click('button:has-text("Save Workflow")');
    
    // Verify new order
    await page.click('text="Reorderable Workflow"');
    const steps = page.locator('.workflow-step');
    await expect(steps.nth(0)).toContainText(testTemplates[2].name);
    await expect(steps.nth(1)).toContainText(testTemplates[0].name);
    await expect(steps.nth(2)).toContainText(testTemplates[1].name);
  });

  test('should export workflow execution results', async ({ page, context }) => {
    await helpers.navigateToWorkflows();
    
    // Create and execute workflow
    const workflow = testWorkflows[0];
    await helpers.createWorkflow(workflow);
    await helpers.executeWorkflow(workflow.name, testVariables.email);
    
    // Export results
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Results")');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('workflow-results');
    expect(download.suggestedFilename()).toContain('.txt');
  });

  test('should validate workflow before execution', async ({ page }) => {
    await helpers.navigateToWorkflows();
    
    // Create workflow with non-existent template reference
    await page.click('button:has-text("New Workflow")');
    await page.fill('input[name="name"]', 'Invalid Workflow');
    await page.click('button:has-text("Add Step")');
    
    // Manually enter invalid template ID
    await page.evaluate(() => {
      const select = document.querySelector('select[name="template-0"]');
      const option = document.createElement('option');
      option.value = 'non-existent-template';
      option.text = 'Non-existent Template';
      select.appendChild(option);
      select.value = 'non-existent-template';
    });
    
    await page.click('button:has-text("Save Workflow")');
    
    // Try to execute
    await page.click('text="Invalid Workflow"');
    await page.click('button:has-text("Execute Workflow")');
    
    // Verify validation error
    await expect(page.locator('.error-message')).toContainText('Template not found');
  });

  test('should show workflow execution progress', async ({ page }) => {
    await helpers.navigateToWorkflows();
    
    // Create workflow with multiple steps
    const workflow = {
      name: 'Progress Workflow',
      description: 'Workflow to test progress indication',
      category: 'development',
      steps: testTemplates.map(t => ({ templateId: t.name }))
    };
    
    await helpers.createWorkflow(workflow);
    
    // Start execution
    await page.click(`text="${workflow.name}"`);
    
    // Fill all required variables
    const allVariables = { ...testVariables.email, ...testVariables.codeReview, ...testVariables.bugReport };
    for (const [key, value] of Object.entries(allVariables)) {
      if (await page.locator(`input[name="${key}"]`).isVisible()) {
        await page.fill(`input[name="${key}"]`, value);
      }
    }
    
    await page.click('button:has-text("Execute Workflow")');
    
    // Verify progress indicators
    await expect(page.locator('.progress-bar')).toBeVisible();
    await expect(page.locator('.step-indicator.active')).toBeVisible();
    
    // Wait for completion
    await expect(page.locator('.workflow-complete')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.progress-bar[data-progress="100"]')).toBeVisible();
  });
});