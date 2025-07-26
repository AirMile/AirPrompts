import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers.js';
import { testTemplates, testVariables } from '../fixtures/test-data.js';

test.describe('Template CRUD Operations', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.navigateToHomepage();
  });

  test('should create a new template', async ({ page }) => {
    const template = testTemplates[0];
    
    // Navigate to templates
    await helpers.navigateToTemplates();
    
    // Create template
    await helpers.createTemplate(template);
    
    // Verify template appears in list
    await helpers.verifyItemExists(template.name);
    
    // Verify template details
    await page.click(`text="${template.name}"`);
    await expect(page.locator('input[name="name"]')).toHaveValue(template.name);
    await expect(page.locator('textarea[name="description"]')).toHaveValue(template.description);
    await expect(page.locator('textarea[name="content"]')).toHaveValue(template.content);
  });

  test('should read and display template details', async ({ page }) => {
    await helpers.navigateToTemplates();
    
    // Click on first template
    const firstTemplate = page.locator('.template-card').first();
    const templateName = await firstTemplate.locator('.template-name').textContent();
    await firstTemplate.click();
    
    // Verify template details are displayed
    await expect(page.locator('h2')).toContainText(templateName);
    await expect(page.locator('.template-content')).toBeVisible();
    await expect(page.locator('.variable-list')).toBeVisible();
  });

  test('should update an existing template', async ({ page }) => {
    await helpers.navigateToTemplates();
    
    // Open first template for editing
    const firstTemplate = page.locator('.template-card').first();
    await firstTemplate.click();
    await page.click('button:has-text("Edit")');
    
    // Update template
    const updatedName = 'Updated Template Name';
    const updatedContent = 'Updated content with {new_variable}';
    
    await page.fill('input[name="name"]', updatedName);
    await page.fill('textarea[name="content"]', updatedContent);
    await page.click('button:has-text("Save")');
    
    // Verify update
    await expect(page.locator('.success-message')).toContainText('Template updated');
    await helpers.verifyItemExists(updatedName);
    
    // Verify new variable is detected
    await expect(page.locator('.variable-chip:has-text("new_variable")')).toBeVisible();
  });

  test('should delete a template', async ({ page }) => {
    const template = testTemplates[1];
    
    // Create a template first
    await helpers.navigateToTemplates();
    await helpers.createTemplate(template);
    
    // Delete the template
    await helpers.deleteTemplate(template.name);
    
    // Verify template is removed
    await expect(page.locator(`text="${template.name}"`)).not.toBeVisible();
  });

  test('should handle duplicate template names', async ({ page }) => {
    const template = testTemplates[0];
    
    // Create first template
    await helpers.navigateToTemplates();
    await helpers.createTemplate(template);
    
    // Try to create duplicate
    await page.click('button:has-text("New Template")');
    await page.fill('input[name="name"]', template.name);
    await page.fill('textarea[name="content"]', 'Different content');
    await page.click('button:has-text("Save Template")');
    
    // Verify error message
    await expect(page.locator('.error-message')).toContainText('already exists');
  });

  test('should validate required fields', async ({ page }) => {
    await helpers.navigateToTemplates();
    await page.click('button:has-text("New Template")');
    
    // Try to save without filling required fields
    await page.click('button:has-text("Save Template")');
    
    // Verify validation messages
    await expect(page.locator('.field-error:near(input[name="name"])')).toContainText('required');
    await expect(page.locator('.field-error:near(textarea[name="content"])')).toContainText('required');
  });

  test('should copy template content to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    await helpers.navigateToTemplates();
    
    // Open first template
    const firstTemplate = page.locator('.template-card').first();
    await firstTemplate.click();
    
    // Copy content
    await page.click('button:has-text("Copy")');
    
    // Verify clipboard content
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toBeTruthy();
    await expect(page.locator('.success-message')).toContainText('Copied');
  });

  test('should filter templates by category', async ({ page }) => {
    // Create templates in different categories
    await helpers.navigateToTemplates();
    await helpers.createTemplate(testTemplates[0]); // communication
    await helpers.createTemplate(testTemplates[1]); // development
    
    // Filter by communication category
    await page.selectOption('select[name="category-filter"]', 'communication');
    
    // Verify only communication templates are visible
    await helpers.verifyItemExists(testTemplates[0].name);
    await expect(page.locator(`text="${testTemplates[1].name}"`)).not.toBeVisible();
    
    // Filter by development category
    await page.selectOption('select[name="category-filter"]', 'development');
    
    // Verify only development templates are visible
    await helpers.verifyItemExists(testTemplates[1].name);
    await expect(page.locator(`text="${testTemplates[0].name}"`)).not.toBeVisible();
  });

  test('should mark template as favorite', async ({ page }) => {
    await helpers.navigateToTemplates();
    
    // Toggle favorite on first template
    const firstTemplate = page.locator('.template-card').first();
    const favoriteButton = firstTemplate.locator('button[aria-label="Toggle favorite"]');
    
    await favoriteButton.click();
    await expect(favoriteButton).toHaveClass(/active/);
    
    // Filter by favorites
    await page.click('button:has-text("Favorites")');
    
    // Verify template appears in favorites
    const templateName = await firstTemplate.locator('.template-name').textContent();
    await helpers.verifyItemExists(templateName);
  });

  test('should execute template with variables', async ({ page }) => {
    const template = testTemplates[0];
    const variables = testVariables.email;
    
    // Create and open template
    await helpers.navigateToTemplates();
    await helpers.createTemplate(template);
    await page.click(`text="${template.name}"`);
    
    // Fill in variables
    for (const [key, value] of Object.entries(variables)) {
      await page.fill(`input[name="${key}"]`, value);
    }
    
    // Execute template
    await page.click('button:has-text("Execute")');
    
    // Verify output
    const output = await page.locator('.template-output').textContent();
    expect(output).toContain(variables.recipient_name);
    expect(output).toContain(variables.subject);
    expect(output).toContain(variables.sender_name);
    expect(output).not.toContain('{'); // No unresolved variables
  });
});