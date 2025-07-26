import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers.js';
import { testTemplates, testWorkflows, importExportData } from '../fixtures/test-data.js';
import fs from 'fs';
import path from 'path';

test.describe('Import/Export Functionality', () => {
  let helpers;
  const testDataDir = path.join(process.cwd(), 'e2e', 'test-data');

  test.beforeAll(async () => {
    // Create test data directory
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    // Create test import files
    fs.writeFileSync(
      path.join(testDataDir, 'valid-import.json'),
      JSON.stringify(importExportData.validImport, null, 2)
    );
    
    fs.writeFileSync(
      path.join(testDataDir, 'invalid-import.json'),
      JSON.stringify(importExportData.invalidImport, null, 2)
    );
    
    fs.writeFileSync(
      path.join(testDataDir, 'corrupted-import.txt'),
      importExportData.corruptedImport
    );
  });

  test.afterAll(async () => {
    // Clean up test files
    fs.rmSync(testDataDir, { recursive: true, force: true });
  });

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.navigateToHomepage();
  });

  test('should export all data', async ({ page }) => {
    // Create some data first
    await helpers.navigateToTemplates();
    for (const template of testTemplates) {
      await helpers.createTemplate(template);
    }
    
    await helpers.navigateToWorkflows();
    for (const workflow of testWorkflows) {
      await helpers.createWorkflow(workflow);
    }
    
    // Export data
    await helpers.navigateToHomepage();
    await page.click('button:has-text("Settings")');
    
    const download = await helpers.exportData();
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/airprompts-export-\d{4}-\d{2}-\d{2}\.json/);
    
    // Save and verify content
    const exportPath = path.join(testDataDir, 'export.json');
    await download.saveAs(exportPath);
    
    const exportedData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    expect(exportedData.templates).toHaveLength(testTemplates.length);
    expect(exportedData.workflows).toHaveLength(testWorkflows.length);
    expect(exportedData.version).toBeDefined();
    expect(exportedData.exportDate).toBeDefined();
  });

  test('should import valid data file', async ({ page }) => {
    await page.click('button:has-text("Settings")');
    
    // Import data
    const importPath = path.join(testDataDir, 'valid-import.json');
    await helpers.importData(importPath);
    
    // Verify imported items
    await helpers.navigateToHomepage();
    await helpers.verifyItemExists(importExportData.validImport.templates[0].name);
    await helpers.verifyItemExists(importExportData.validImport.templates[1].name);
    await helpers.verifyItemExists(importExportData.validImport.workflows[0].name);
  });

  test('should handle invalid import file', async ({ page }) => {
    await page.click('button:has-text("Settings")');
    
    // Try to import invalid data
    const importPath = path.join(testDataDir, 'invalid-import.json');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Import")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(importPath);
    
    // Verify error message
    await expect(page.locator('.error-message')).toContainText('validation failed');
  });

  test('should handle corrupted import file', async ({ page }) => {
    await page.click('button:has-text("Settings")');
    
    // Try to import corrupted file
    const importPath = path.join(testDataDir, 'corrupted-import.txt');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Import")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(importPath);
    
    // Verify error message
    await expect(page.locator('.error-message')).toContainText('Invalid JSON');
  });

  test('should merge imported data with existing data', async ({ page }) => {
    // Create existing data
    await helpers.navigateToTemplates();
    await helpers.createTemplate(testTemplates[0]);
    
    // Import additional data
    await page.click('button:has-text("Settings")');
    await page.click('input[type="radio"][value="merge"]');
    
    const importPath = path.join(testDataDir, 'valid-import.json');
    await helpers.importData(importPath);
    
    // Verify both existing and imported data exist
    await helpers.navigateToHomepage();
    await helpers.verifyItemExists(testTemplates[0].name); // Existing
    await helpers.verifyItemExists(importExportData.validImport.templates[0].name); // Imported
    
    // Verify total count
    const totalTemplates = 1 + importExportData.validImport.templates.length;
    await helpers.navigateToTemplates();
    await helpers.verifyItemCount(totalTemplates);
  });

  test('should replace existing data on import', async ({ page }) => {
    // Create existing data
    await helpers.navigateToTemplates();
    for (const template of testTemplates) {
      await helpers.createTemplate(template);
    }
    
    // Import with replace option
    await page.click('button:has-text("Settings")');
    await page.click('input[type="radio"][value="replace"]');
    
    const importPath = path.join(testDataDir, 'valid-import.json');
    await helpers.importData(importPath);
    
    // Verify only imported data exists
    await helpers.navigateToHomepage();
    
    // Original templates should be gone
    for (const template of testTemplates) {
      await expect(page.locator(`text="${template.name}"`)).not.toBeVisible();
    }
    
    // Imported templates should exist
    await helpers.verifyItemExists(importExportData.validImport.templates[0].name);
    await helpers.verifyItemExists(importExportData.validImport.templates[1].name);
  });

  test('should handle duplicate names during import', async ({ page }) => {
    // Create template with same name as import
    await helpers.navigateToTemplates();
    await helpers.createTemplate({
      ...importExportData.validImport.templates[0],
      content: 'Different content'
    });
    
    // Import data with merge
    await page.click('button:has-text("Settings")');
    await page.click('input[type="radio"][value="merge"]');
    
    const importPath = path.join(testDataDir, 'valid-import.json');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Import")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(importPath);
    
    // Should show conflict resolution dialog
    await expect(page.locator('.conflict-dialog')).toBeVisible();
    await expect(page.locator('.conflict-item')).toContainText(importExportData.validImport.templates[0].name);
    
    // Choose to rename
    await page.click('button:has-text("Rename All")');
    
    // Verify both versions exist
    await helpers.navigateToHomepage();
    await helpers.verifyItemExists(importExportData.validImport.templates[0].name);
    await helpers.verifyItemExists(importExportData.validImport.templates[0].name + ' (imported)');
  });

  test('should export selected items only', async ({ page }) => {
    // Create data
    await helpers.navigateToTemplates();
    for (const template of testTemplates) {
      await helpers.createTemplate(template);
    }
    
    // Select specific items
    await helpers.navigateToHomepage();
    await page.click('.item-card:has-text("Test Email Template") input[type="checkbox"]');
    await page.click('.item-card:has-text("Code Review Template") input[type="checkbox"]');
    
    // Export selected
    await page.click('button:has-text("Export Selected")');
    const download = await page.waitForEvent('download');
    
    // Verify exported content
    const exportPath = path.join(testDataDir, 'selected-export.json');
    await download.saveAs(exportPath);
    
    const exportedData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    expect(exportedData.templates).toHaveLength(2);
    expect(exportedData.templates.map(t => t.name)).toContain('Test Email Template');
    expect(exportedData.templates.map(t => t.name)).toContain('Code Review Template');
    expect(exportedData.templates.map(t => t.name)).not.toContain('Bug Report Template');
  });

  test('should import from clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Copy valid data to clipboard
    const importData = JSON.stringify(importExportData.validImport, null, 2);
    await page.evaluate((data) => navigator.clipboard.writeText(data), importData);
    
    // Import from clipboard
    await page.click('button:has-text("Settings")');
    await page.click('button:has-text("Import from Clipboard")');
    
    // Verify success
    await expect(page.locator('.success-message')).toContainText('Imported from clipboard');
    
    // Verify imported items
    await helpers.navigateToHomepage();
    await helpers.verifyItemExists(importExportData.validImport.templates[0].name);
  });

  test('should show import preview', async ({ page }) => {
    await page.click('button:has-text("Settings")');
    
    // Start import
    const importPath = path.join(testDataDir, 'valid-import.json');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Import")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(importPath);
    
    // Check preview dialog
    await expect(page.locator('.import-preview')).toBeVisible();
    await expect(page.locator('.preview-stats')).toContainText(`${importExportData.validImport.templates.length} templates`);
    await expect(page.locator('.preview-stats')).toContainText(`${importExportData.validImport.workflows.length} workflows`);
    
    // Verify preview items
    for (const template of importExportData.validImport.templates) {
      await expect(page.locator('.preview-item')).toContainText(template.name);
    }
    
    // Confirm import
    await page.click('button:has-text("Confirm Import")');
    await expect(page.locator('.success-message')).toContainText('Import successful');
  });

  test('should validate workflow references during import', async ({ page }) => {
    // Create import data with workflow referencing non-existent template
    const invalidWorkflowData = {
      templates: [],
      workflows: [{
        name: 'Invalid Reference Workflow',
        description: 'Workflow with invalid template reference',
        category: 'development',
        steps: [
          { templateId: 'non-existent-template', order: 1 }
        ]
      }]
    };
    
    const invalidPath = path.join(testDataDir, 'invalid-workflow.json');
    fs.writeFileSync(invalidPath, JSON.stringify(invalidWorkflowData, null, 2));
    
    // Try to import
    await page.click('button:has-text("Settings")');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Import")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(invalidPath);
    
    // Should show warning about invalid references
    await expect(page.locator('.warning-message')).toContainText('missing template references');
    await expect(page.locator('.missing-reference')).toContainText('non-existent-template');
    
    // Option to skip invalid workflows
    await page.click('button:has-text("Skip Invalid")');
    await expect(page.locator('.success-message')).toContainText('Import completed with warnings');
  });
});