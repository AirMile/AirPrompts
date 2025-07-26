import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers.js';
import { testTemplates, testWorkflows, largeDataset } from '../fixtures/test-data.js';

test.describe('Search Functionality', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.navigateToHomepage();
    
    // Create test data
    await helpers.navigateToTemplates();
    for (const template of testTemplates) {
      await helpers.createTemplate(template);
    }
    
    await helpers.navigateToWorkflows();
    for (const workflow of testWorkflows) {
      await helpers.createWorkflow(workflow);
    }
    
    await helpers.navigateToHomepage();
  });

  test('should search templates by name', async ({ page }) => {
    await helpers.searchForItem('Email');
    
    // Verify only email-related items are visible
    await helpers.verifyItemExists('Test Email Template');
    await helpers.verifyItemExists('Email Campaign Workflow');
    
    // Verify non-matching items are hidden
    await expect(page.locator('text="Code Review Template"')).not.toBeVisible();
    await expect(page.locator('text="Bug Report Template"')).not.toBeVisible();
  });

  test('should search with case-insensitive matching', async ({ page }) => {
    // Search with different cases
    await helpers.searchForItem('EMAIL');
    await helpers.verifyItemExists('Test Email Template');
    
    await helpers.searchForItem('email');
    await helpers.verifyItemExists('Test Email Template');
    
    await helpers.searchForItem('EmAiL');
    await helpers.verifyItemExists('Test Email Template');
  });

  test('should search by description content', async ({ page }) => {
    await helpers.searchForItem('code review feedback');
    
    // Verify template with matching description is found
    await helpers.verifyItemExists('Code Review Template');
    
    // Verify exact match isn't required
    await helpers.searchForItem('feedback');
    await helpers.verifyItemExists('Code Review Template');
  });

  test('should search by category', async ({ page }) => {
    await helpers.searchForItem('development');
    
    // Verify all development items are visible
    await helpers.verifyItemExists('Code Review Template');
    await helpers.verifyItemExists('Bug Report Template');
    await helpers.verifyItemExists('Development Review Workflow');
    
    // Verify non-development items are hidden
    await expect(page.locator('text="Test Email Template"')).not.toBeVisible();
    await expect(page.locator('text="Email Campaign Workflow"')).not.toBeVisible();
  });

  test('should show no results message for empty search', async ({ page }) => {
    await helpers.searchForItem('nonexistenttemplatename12345');
    
    // Verify no results message
    await expect(page.locator('.no-results')).toBeVisible();
    await expect(page.locator('.no-results')).toContainText('No items found');
    
    // Verify all items are hidden
    const itemCount = await page.locator('.item-card:visible').count();
    expect(itemCount).toBe(0);
  });

  test('should clear search and show all items', async ({ page }) => {
    // Perform search
    await helpers.searchForItem('Email');
    let visibleCount = await page.locator('.item-card:visible').count();
    expect(visibleCount).toBeGreaterThan(0);
    expect(visibleCount).toBeLessThan(testTemplates.length + testWorkflows.length);
    
    // Clear search
    await page.fill('input[placeholder*="Search"]', '');
    await page.waitForTimeout(300); // Debounce delay
    
    // Verify all items are visible again
    visibleCount = await page.locator('.item-card:visible').count();
    expect(visibleCount).toBe(testTemplates.length + testWorkflows.length);
  });

  test('should combine search with filters', async ({ page }) => {
    // Apply category filter first
    await page.selectOption('select[name="category-filter"]', 'development');
    
    // Then search within filtered results
    await helpers.searchForItem('review');
    
    // Should only show development items with "review"
    await helpers.verifyItemExists('Code Review Template');
    await helpers.verifyItemExists('Development Review Workflow');
    
    // Bug Report Template should be hidden (doesn't match search)
    await expect(page.locator('text="Bug Report Template"')).not.toBeVisible();
  });

  test('should search with special characters', async ({ page }) => {
    // Create template with special characters
    await helpers.navigateToTemplates();
    await helpers.createTemplate({
      name: 'C++ Template',
      description: 'Template for C++ code',
      category: 'development',
      content: 'C++ code: {code}'
    });
    
    await helpers.navigateToHomepage();
    
    // Search for special characters
    await helpers.searchForItem('C++');
    await helpers.verifyItemExists('C++ Template');
    
    // Test other special characters
    await helpers.searchForItem('C+');
    await helpers.verifyItemExists('C++ Template');
  });

  test('should highlight search terms in results', async ({ page }) => {
    await helpers.searchForItem('Email');
    
    // Check for highlighted terms
    const highlightedElements = page.locator('.search-highlight');
    await expect(highlightedElements).toHaveCount(2); // Email appears in 2 items
    
    // Verify highlight styling
    const highlight = highlightedElements.first();
    await expect(highlight).toHaveCSS('background-color', 'rgb(254, 240, 138)'); // yellow-200
  });

  test('should handle search performance with large dataset', async ({ page }) => {
    // Create many items
    await helpers.navigateToTemplates();
    const manyTemplates = largeDataset.generateTemplates(50);
    
    for (const template of manyTemplates) {
      await helpers.createTemplate(template);
    }
    
    await helpers.navigateToHomepage();
    
    // Measure search performance
    const startTime = Date.now();
    await helpers.searchForItem('Template 25');
    
    // Wait for search results
    await helpers.verifyItemExists('Template 25');
    const searchTime = Date.now() - startTime;
    
    // Search should complete within reasonable time
    expect(searchTime).toBeLessThan(1000); // Less than 1 second
    
    // Verify correct result
    const visibleCount = await page.locator('.item-card:visible').count();
    expect(visibleCount).toBe(1);
  });

  test('should maintain search state when navigating', async ({ page }) => {
    // Perform search
    await helpers.searchForItem('Email');
    await helpers.verifyItemExists('Test Email Template');
    
    // Navigate to a template
    await page.click('text="Test Email Template"');
    await expect(page.locator('h2')).toContainText('Test Email Template');
    
    // Navigate back
    await page.goBack();
    
    // Verify search is maintained
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toHaveValue('Email');
    await helpers.verifyItemExists('Test Email Template');
  });

  test('should search within template content', async ({ page }) => {
    // Search for variable names that appear in content
    await helpers.searchForItem('recipient_name');
    
    // Should find template containing this variable
    await helpers.verifyItemExists('Test Email Template');
    
    // Search for partial variable name
    await helpers.searchForItem('recipient');
    await helpers.verifyItemExists('Test Email Template');
  });

  test('should provide search suggestions', async ({ page }) => {
    // Start typing
    await page.fill('input[placeholder*="Search"]', 'Em');
    
    // Wait for suggestions
    await expect(page.locator('.search-suggestions')).toBeVisible();
    
    // Verify suggestions contain relevant items
    const suggestions = page.locator('.search-suggestion');
    await expect(suggestions).toHaveCount(2); // Email items
    
    // Click suggestion
    await suggestions.first().click();
    
    // Verify search is completed
    await expect(page.locator('input[placeholder*="Search"]')).toHaveValue('Test Email Template');
    await helpers.verifyItemExists('Test Email Template');
  });

  test('should handle search with keyboard navigation', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    // Focus search with keyboard shortcut
    await page.keyboard.press('Control+K');
    await expect(searchInput).toBeFocused();
    
    // Type search term
    await searchInput.type('Email');
    
    // Navigate results with arrow keys
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.item-card').first()).toHaveClass(/focused/);
    
    // Select with Enter
    await page.keyboard.press('Enter');
    await expect(page.locator('h2')).toContainText('Email');
    
    // Escape to clear search
    await page.keyboard.press('Escape');
    await helpers.navigateToHomepage();
    await expect(searchInput).toHaveValue('');
  });
});