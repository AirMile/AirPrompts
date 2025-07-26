import { expect } from '@playwright/test';

export class TestHelpers {
  constructor(page) {
    this.page = page;
  }

  // Navigation helpers
  async navigateToHomepage() {
    await this.page.goto('/');
    await expect(this.page).toHaveTitle(/AirPrompts/);
  }

  async navigateToTemplates() {
    await this.page.click('button:has-text("Templates")');
    await expect(this.page.locator('h1')).toContainText('Templates');
  }

  async navigateToWorkflows() {
    await this.page.click('button:has-text("Workflows")');
    await expect(this.page.locator('h1')).toContainText('Workflows');
  }

  // Template helpers
  async createTemplate(templateData) {
    await this.page.click('button:has-text("New Template")');
    
    // Fill in template form
    await this.page.fill('input[name="name"]', templateData.name);
    await this.page.fill('textarea[name="description"]', templateData.description);
    await this.page.selectOption('select[name="category"]', templateData.category);
    await this.page.fill('textarea[name="content"]', templateData.content);
    
    // Save template
    await this.page.click('button:has-text("Save Template")');
    
    // Verify success
    await expect(this.page.locator('.success-message')).toBeVisible();
  }

  async searchForItem(searchTerm) {
    await this.page.fill('input[placeholder*="Search"]', searchTerm);
    await this.page.waitForTimeout(300); // Debounce delay
  }

  async deleteTemplate(templateName) {
    const templateCard = this.page.locator(`.template-card:has-text("${templateName}")`);
    await templateCard.hover();
    await templateCard.locator('button[aria-label="Delete"]').click();
    
    // Confirm deletion
    await this.page.click('button:has-text("Confirm")');
    await expect(templateCard).not.toBeVisible();
  }

  // Workflow helpers
  async createWorkflow(workflowData) {
    await this.page.click('button:has-text("New Workflow")');
    
    // Fill in workflow form
    await this.page.fill('input[name="name"]', workflowData.name);
    await this.page.fill('textarea[name="description"]', workflowData.description);
    await this.page.selectOption('select[name="category"]', workflowData.category);
    
    // Add steps
    for (const step of workflowData.steps) {
      await this.page.click('button:has-text("Add Step")');
      await this.page.selectOption('select[name="template"]', step.templateId);
    }
    
    // Save workflow
    await this.page.click('button:has-text("Save Workflow")');
    await expect(this.page.locator('.success-message')).toBeVisible();
  }

  async executeWorkflow(workflowName, variables = {}) {
    const workflowCard = this.page.locator(`.workflow-card:has-text("${workflowName}")`);
    await workflowCard.click();
    
    // Fill in variables
    for (const [key, value] of Object.entries(variables)) {
      await this.page.fill(`input[name="${key}"]`, value);
    }
    
    // Execute
    await this.page.click('button:has-text("Execute Workflow")');
    
    // Wait for completion
    await expect(this.page.locator('.workflow-output')).toBeVisible();
  }

  // Import/Export helpers
  async importData(filePath) {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.page.click('button:has-text("Import")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
    
    await expect(this.page.locator('.success-message')).toContainText('Import successful');
  }

  async exportData() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.click('button:has-text("Export")');
    const download = await downloadPromise;
    return download;
  }

  // Assertion helpers
  async verifyItemExists(itemName) {
    await expect(this.page.locator(`text="${itemName}"`)).toBeVisible();
  }

  async verifyItemCount(expectedCount) {
    const items = await this.page.locator('.item-card').count();
    expect(items).toBe(expectedCount);
  }

  async verifyClipboardContent(expectedContent) {
    const clipboardText = await this.page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(expectedContent);
  }

  // Performance helpers
  async measurePageLoadTime() {
    const startTime = Date.now();
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
    const endTime = Date.now();
    return endTime - startTime;
  }

  async measureRenderTime(selector) {
    const startTime = Date.now();
    await this.page.waitForSelector(selector, { state: 'visible' });
    const endTime = Date.now();
    return endTime - startTime;
  }
}