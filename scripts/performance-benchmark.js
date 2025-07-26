#!/usr/bin/env node

/**
 * Performance benchmark script for AirPrompts
 */

const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const fs = require('fs').promises;
const path = require('path');

const BENCHMARK_CONFIG = {
  url: 'http://localhost:5173',
  runs: 3,
  scenarios: [
    {
      name: 'Initial Load',
      actions: []
    },
    {
      name: 'Template Creation',
      actions: [
        { type: 'click', selector: 'button:has-text("New Template")' },
        { type: 'type', selector: 'input[name="name"]', text: 'Performance Test Template' },
        { type: 'type', selector: 'textarea[name="content"]', text: 'Test content with {variable}' },
        { type: 'click', selector: 'button:has-text("Save")' }
      ]
    },
    {
      name: 'Search Performance',
      actions: [
        { type: 'type', selector: 'input[placeholder*="Search"]', text: 'test', delay: 50 }
      ]
    },
    {
      name: 'Large Dataset',
      setup: async (page) => {
        // Inject large dataset
        await page.evaluate(() => {
          const templates = Array.from({ length: 1000 }, (_, i) => ({
            id: `template-${i}`,
            name: `Template ${i}`,
            content: `Content for template ${i}`,
            category: ['development', 'marketing', 'communication'][i % 3]
          }));
          
          localStorage.setItem('templates', JSON.stringify(templates));
          location.reload();
        });
        
        await page.waitForNavigation();
      },
      actions: []
    }
  ],
  metrics: [
    'first-contentful-paint',
    'largest-contentful-paint',
    'total-blocking-time',
    'cumulative-layout-shift',
    'speed-index'
  ]
};

async function runLighthouse(url, options = {}) {
  const chrome = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const { port } = new URL(chrome.wsEndpoint());
  
  const runnerResult = await lighthouse(url, {
    port,
    output: 'json',
    onlyCategories: ['performance'],
    throttling: {
      cpuSlowdownMultiplier: 1,
      ...options.throttling
    }
  });
  
  await chrome.close();
  
  return runnerResult.lhr;
}

async function measureScenario(scenario) {
  console.log(`\n📊 Measuring: ${scenario.name}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  
  for (let run = 0; run < BENCHMARK_CONFIG.runs; run++) {
    console.log(`   Run ${run + 1}/${BENCHMARK_CONFIG.runs}...`);
    
    const page = await browser.newPage();
    
    // Enable performance metrics
    await page.evaluateOnNewDocument(() => {
      window.__PERFORMANCE_METRICS__ = {
        marks: [],
        measures: []
      };
      
      const originalMark = performance.mark.bind(performance);
      const originalMeasure = performance.measure.bind(performance);
      
      performance.mark = function(name) {
        window.__PERFORMANCE_METRICS__.marks.push({ name, time: performance.now() });
        return originalMark(name);
      };
      
      performance.measure = function(name, start, end) {
        const result = originalMeasure(name, start, end);
        window.__PERFORMANCE_METRICS__.measures.push({
          name,
          duration: performance.getEntriesByName(name)[0].duration
        });
        return result;
      };
    });
    
    const metrics = {
      navigation: {},
      runtime: {},
      memory: {}
    };
    
    // Set up observers
    const client = await page.target().createCDPSession();
    await client.send('Performance.enable');
    
    // Navigate to page
    const startTime = Date.now();
    await page.goto(BENCHMARK_CONFIG.url, { waitUntil: 'networkidle2' });
    
    // Run setup if provided
    if (scenario.setup) {
      await scenario.setup(page);
    }
    
    // Get navigation timing
    metrics.navigation = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
      };
    });
    
    // Execute scenario actions
    for (const action of scenario.actions) {
      switch (action.type) {
        case 'click':
          await page.waitForSelector(action.selector);
          await page.click(action.selector);
          break;
        case 'type':
          await page.waitForSelector(action.selector);
          if (action.delay) {
            await page.type(action.selector, action.text, { delay: action.delay });
          } else {
            await page.fill(action.selector, action.text);
          }
          break;
        case 'wait':
          await page.waitForTimeout(action.duration);
          break;
      }
    }
    
    // Collect runtime metrics
    await page.waitForTimeout(1000); // Let things settle
    
    metrics.runtime = await page.evaluate(() => {
      const measures = window.__PERFORMANCE_METRICS__.measures;
      const resourceTiming = performance.getEntriesByType('resource');
      
      return {
        measures,
        jsHeapSize: performance.memory ? performance.memory.usedJSHeapSize : 0,
        domNodes: document.querySelectorAll('*').length,
        jsResources: resourceTiming.filter(r => r.name.endsWith('.js')).length,
        totalResourceSize: resourceTiming.reduce((sum, r) => sum + (r.transferSize || 0), 0)
      };
    });
    
    // Get performance metrics from Chrome
    const performanceMetrics = await client.send('Performance.getMetrics');
    metrics.chrome = performanceMetrics.metrics.reduce((acc, metric) => {
      acc[metric.name] = metric.value;
      return acc;
    }, {});
    
    results.push(metrics);
    
    await page.close();
  }
  
  await browser.close();
  
  return aggregateResults(results);
}

function aggregateResults(results) {
  const aggregated = {
    navigation: {},
    runtime: {},
    chrome: {}
  };
  
  // Calculate averages for navigation metrics
  const navKeys = Object.keys(results[0].navigation);
  navKeys.forEach(key => {
    const values = results.map(r => r.navigation[key]);
    aggregated.navigation[key] = {
      avg: average(values),
      min: Math.min(...values),
      max: Math.max(...values)
    };
  });
  
  // Calculate averages for runtime metrics
  const runtimeKeys = Object.keys(results[0].runtime).filter(k => typeof results[0].runtime[k] === 'number');
  runtimeKeys.forEach(key => {
    const values = results.map(r => r.runtime[key]);
    aggregated.runtime[key] = {
      avg: average(values),
      min: Math.min(...values),
      max: Math.max(...values)
    };
  });
  
  return aggregated;
}

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

async function generateReport(benchmarkResults, lighthouseResults) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      performanceScore: lighthouseResults.categories.performance.score * 100,
      metrics: {}
    },
    scenarios: benchmarkResults,
    lighthouse: {
      metrics: lighthouseResults.audits
    }
  };
  
  // Extract key metrics
  BENCHMARK_CONFIG.metrics.forEach(metric => {
    if (lighthouseResults.audits[metric]) {
      report.summary.metrics[metric] = {
        value: lighthouseResults.audits[metric].numericValue,
        score: lighthouseResults.audits[metric].score
      };
    }
  });
  
  return report;
}

async function runBenchmarks() {
  console.log('🚀 Starting Performance Benchmarks for AirPrompts\n');
  
  try {
    // Check if dev server is running
    const response = await fetch(BENCHMARK_CONFIG.url).catch(() => null);
    if (!response) {
      console.error('❌ Dev server is not running. Please run "npm run dev" first.');
      process.exit(1);
    }
    
    // Run Lighthouse analysis
    console.log('🔦 Running Lighthouse analysis...');
    const lighthouseResults = await runLighthouse(BENCHMARK_CONFIG.url);
    console.log(`   Performance Score: ${(lighthouseResults.categories.performance.score * 100).toFixed(1)}/100`);
    
    // Run scenario benchmarks
    const benchmarkResults = {};
    
    for (const scenario of BENCHMARK_CONFIG.scenarios) {
      benchmarkResults[scenario.name] = await measureScenario(scenario);
    }
    
    // Generate report
    const report = await generateReport(benchmarkResults, lighthouseResults);
    
    // Save report
    const reportPath = path.join(process.cwd(), 'performance-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n📈 Performance Summary:');
    console.log(`   Overall Score: ${report.summary.performanceScore.toFixed(1)}/100`);
    console.log('\n   Key Metrics:');
    
    Object.entries(report.summary.metrics).forEach(([metric, data]) => {
      const metricName = metric.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      console.log(`   ${metricName}: ${data.value.toFixed(0)}ms (score: ${(data.score * 100).toFixed(0)})`);
    });
    
    console.log('\n   Scenario Results:');
    Object.entries(benchmarkResults).forEach(([scenario, results]) => {
      console.log(`\n   ${scenario}:`);
      console.log(`     Load Time: ${results.navigation.loadTime.avg.toFixed(0)}ms`);
      console.log(`     DOM Nodes: ${results.runtime.domNodes.avg.toFixed(0)}`);
      console.log(`     JS Heap: ${(results.runtime.jsHeapSize.avg / 1024 / 1024).toFixed(1)}MB`);
    });
    
    console.log(`\n✅ Report saved to: ${reportPath}`);
    
    // Check against thresholds
    const performanceOk = report.summary.performanceScore >= 90;
    const fcpOk = report.summary.metrics['first-contentful-paint'].value < 1500;
    const lcpOk = report.summary.metrics['largest-contentful-paint'].value < 2500;
    
    if (!performanceOk || !fcpOk || !lcpOk) {
      console.error('\n❌ Performance thresholds not met!');
      process.exit(1);
    }
    
    console.log('\n✅ All performance thresholds passed!');
    
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  }
}

// Run benchmarks
runBenchmarks();