// Lighthouse Performance Test Script for MedusaScans
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Configuration
const TEST_URL = 'http://localhost:3000/read/'; // Add a chapter ID to test
const OUTPUT_DIR = path.join(__dirname, 'lighthouse-results');
const NUM_RUNS = 3; // Number of test runs for averaging

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Lighthouse options
const opts = {
  chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
  onlyCategories: ['performance'],
  output: 'json',
};

// Run Lighthouse test
async function runLighthouseTest(url) {
  console.log(`Running Lighthouse test for: ${url}`);
  
  // Launch Chrome
  const chrome = await chromeLauncher.launch({ chromeFlags: opts.chromeFlags });
  opts.port = chrome.port;
  
  try {
    // Run Lighthouse
    const results = await lighthouse(url, opts);
    
    // Close Chrome
    await chrome.kill();
    
    return results.lhr;
  } catch (error) {
    console.error('Error running Lighthouse:', error);
    await chrome.kill();
    throw error;
  }
}

// Format results for display
function formatResults(results) {
  const { categories, audits } = results;
  
  return {
    timestamp: new Date().toISOString(),
    url: results.finalUrl,
    scores: {
      performance: categories.performance.score * 100,
    },
    metrics: {
      firstContentfulPaint: audits['first-contentful-paint'].numericValue,
      largestContentfulPaint: audits['largest-contentful-paint'].numericValue,
      totalBlockingTime: audits['total-blocking-time'].numericValue,
      cumulativeLayoutShift: audits['cumulative-layout-shift'].numericValue,
      speedIndex: audits['speed-index'].numericValue,
      timeToInteractive: audits['interactive'].numericValue,
      firstMeaningfulPaint: audits['first-meaningful-paint'].numericValue,
    },
    resourceSummary: audits['resource-summary'].details.items.reduce((acc, item) => {
      acc[item.resourceType] = {
        requestCount: item.requestCount,
        transferSize: item.transferSize,
      };
      return acc;
    }, {}),
  };
}

// Save results to file
function saveResults(results, label) {
  const filename = `lighthouse-${label}-${Date.now()}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  console.log(`Results saved to: ${filepath}`);
  
  return filepath;
}

// Run multiple tests and average the results
async function runMultipleTests(url, label, numRuns = 3) {
  console.log(`Starting ${numRuns} test runs for ${label}...`);
  
  const allResults = [];
  const formattedResults = [];
  
  for (let i = 0; i < numRuns; i++) {
    console.log(`Run ${i + 1}/${numRuns}`);
    try {
      // Wait between runs to avoid throttling
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      const result = await runLighthouseTest(url);
      allResults.push(result);
      formattedResults.push(formatResults(result));
    } catch (error) {
      console.error(`Error in run ${i + 1}:`, error);
    }
  }
  
  // Save individual results
  formattedResults.forEach((result, i) => {
    saveResults(result, `${label}-run-${i + 1}`);
  });
  
  // Calculate averages
  if (formattedResults.length === 0) {
    console.error('No successful test runs!');
    return null;
  }
  
  const averageResults = {
    timestamp: new Date().toISOString(),
    url,
    label,
    numRuns: formattedResults.length,
    scores: {
      performance: average(formattedResults.map(r => r.scores.performance)),
    },
    metrics: {
      firstContentfulPaint: average(formattedResults.map(r => r.metrics.firstContentfulPaint)),
      largestContentfulPaint: average(formattedResults.map(r => r.metrics.largestContentfulPaint)),
      totalBlockingTime: average(formattedResults.map(r => r.metrics.totalBlockingTime)),
      cumulativeLayoutShift: average(formattedResults.map(r => r.metrics.cumulativeLayoutShift)),
      speedIndex: average(formattedResults.map(r => r.metrics.speedIndex)),
      timeToInteractive: average(formattedResults.map(r => r.metrics.timeToInteractive)),
      firstMeaningfulPaint: average(formattedResults.map(r => r.metrics.firstMeaningfulPaint)),
    },
  };
  
  // Save average results
  saveResults(averageResults, `${label}-average`);
  
  return averageResults;
}

// Helper function to calculate average
function average(arr) {
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

// Compare before and after results
function compareResults(before, after) {
  if (!before || !after) {
    console.error('Missing results for comparison');
    return;
  }
  
  console.log('\n=== PERFORMANCE COMPARISON ===\n');
  console.log(`URL: ${before.url}`);
  console.log(`Test runs: ${before.numRuns} before, ${after.numRuns} after\n`);
  
  // Compare performance score
  const scoreDiff = after.scores.performance - before.scores.performance;
  console.log(`Performance Score: ${before.scores.performance.toFixed(1)} → ${after.scores.performance.toFixed(1)} (${formatChange(scoreDiff)}%)`);
  
  // Compare metrics
  console.log('\nCore Web Vitals and Metrics:');
  console.log('---------------------------');
  
  Object.entries(before.metrics).forEach(([key, beforeVal]) => {
    const afterVal = after.metrics[key];
    const diff = afterVal - beforeVal;
    const percentChange = (diff / beforeVal) * 100;
    
    // Determine if lower is better (true for all current metrics)
    const isImprovement = percentChange < 0;
    
    console.log(`${formatMetricName(key)}: ${formatTime(beforeVal)} → ${formatTime(afterVal)} (${isImprovement ? 'improved' : 'regressed'} by ${formatChange(Math.abs(percentChange))}%)`);
  });
  
  return {
    before,
    after,
    comparison: {
      performanceScoreChange: scoreDiff,
      metricChanges: Object.entries(before.metrics).reduce((acc, [key, beforeVal]) => {
        const afterVal = after.metrics[key];
        acc[key] = {
          before: beforeVal,
          after: afterVal,
          difference: afterVal - beforeVal,
          percentChange: ((afterVal - beforeVal) / beforeVal) * 100,
        };
        return acc;
      }, {}),
    },
  };
}

// Helper function to format metric names
function formatMetricName(key) {
  const names = {
    firstContentfulPaint: 'First Contentful Paint',
    largestContentfulPaint: 'Largest Contentful Paint',
    totalBlockingTime: 'Total Blocking Time',
    cumulativeLayoutShift: 'Cumulative Layout Shift',
    speedIndex: 'Speed Index',
    timeToInteractive: 'Time to Interactive',
    firstMeaningfulPaint: 'First Meaningful Paint',
  };
  
  return names[key] || key;
}

// Helper function to format time values
function formatTime(ms) {
  if (ms < 1000) {
    return `${ms.toFixed(1)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

// Helper function to format change values
function formatChange(value) {
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}

// Main function
async function main() {
  try {
    if (!TEST_URL.includes('/read/')) {
      console.error('Please specify a chapter URL in the TEST_URL variable');
      process.exit(1);
    }
    
    console.log('=== LIGHTHOUSE PERFORMANCE TEST ===');
    console.log(`Testing URL: ${TEST_URL}`);
    console.log(`Number of runs: ${NUM_RUNS}`);
    console.log('==================================\n');
    
    // Run tests
    const beforeResults = await runMultipleTests(TEST_URL, 'before', NUM_RUNS);
    
    console.log('\nTests completed!');
    console.log('To compare with the optimized version:');
    console.log('1. Deploy your optimized version');
    console.log('2. Run this script again with:');
    console.log('   node run-lighthouse-test.js --after');
    console.log('3. The script will automatically compare with the previous results');
    
    // Check if we're running the "after" comparison
    if (process.argv.includes('--after')) {
      // Find the most recent "before" results
      const files = fs.readdirSync(OUTPUT_DIR);
      const beforeFile = files
        .filter(f => f.includes('before-average'))
        .sort()
        .pop();
      
      if (beforeFile) {
        const beforePath = path.join(OUTPUT_DIR, beforeFile);
        const beforeData = JSON.parse(fs.readFileSync(beforePath, 'utf8'));
        
        // Compare results
        const comparison = compareResults(beforeData, beforeResults);
        
        // Save comparison
        const comparisonPath = path.join(OUTPUT_DIR, `comparison-${Date.now()}.json`);
        fs.writeFileSync(comparisonPath, JSON.stringify(comparison, null, 2));
        console.log(`\nComparison saved to: ${comparisonPath}`);
      } else {
        console.error('No "before" results found for comparison');
      }
    }
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the main function
main(); 