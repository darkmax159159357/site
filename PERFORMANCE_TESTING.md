# MedusaScans Performance Testing Guide

This guide explains how to measure the performance improvements in the MedusaScans website after implementing the optimizations.

## Available Testing Tools

We've created several tools to help you measure performance:

1. **Browser-based Performance Test** - Run in the browser console to measure image loading, rendering, and memory usage
2. **Performance Comparison Tool** - Compare results between old and new versions visually
3. **Lighthouse Test Script** - Run automated Lighthouse tests to measure Core Web Vitals
4. **Inline Performance Test** - A simplified script you can copy-paste directly into the console

## 1. Browser-based Performance Test

This test can be run directly in the browser console to measure real-world performance as users experience it.

### How to use:

1. Open the MedusaScans website in your browser and navigate to a manga chapter
2. Open browser developer tools (F12 or Ctrl+Shift+I)
3. Paste this code in the console:

```javascript
// Load the performance test script directly
const script = document.createElement('script');
script.src = '/performance-test.js';
document.head.appendChild(script);
script.onload = () => {
  console.log('Performance test script loaded!');
};
```

4. Run the test by typing:

```javascript
window.medusaPerformanceTest.runAllTests()
```

5. Wait for the tests to complete and copy the results object from the console

## 2. Performance Comparison Tool

This tool helps you visually compare performance between old and new versions.

### How to use:

1. Open `/performance-comparison.html` in your browser
2. Follow the instructions on the page to:
   - Run tests on the old version and paste results
   - Run tests on the new version and paste results
   - Click "Compare Results" to see the visual comparison

## 3. Lighthouse Test Script

This Node.js script runs automated Lighthouse tests to measure Core Web Vitals and other performance metrics.

### Prerequisites:

Install required dependencies:

```bash
npm install lighthouse chrome-launcher
```

### How to use:

1. Edit `run-lighthouse-test.js` to set the `TEST_URL` to a specific chapter URL you want to test
2. Run the test on the old version:

```bash
node run-lighthouse-test.js
```

3. Deploy your optimized version
4. Run the test on the new version with the `--after` flag:

```bash
node run-lighthouse-test.js --after
```

5. The script will automatically compare results and save them in the `lighthouse-results` directory

## 4. Inline Performance Test

If you're having trouble with the other methods, this simplified test can be run directly in the console.

### How to use:

1. Open the MedusaScans website in your browser and navigate to a manga chapter
2. Open browser developer tools (F12 or Ctrl+Shift+I)
3. Visit `/inline-performance-test.js` in a new tab
4. Copy the entire script
5. Paste it into the console on the manga chapter page
6. The test will run automatically and display results in the console
7. Copy the JSON output to compare with other versions

## Expected Performance Improvements

The optimizations should result in improvements in these key areas:

1. **Image Loading Performance**:
   - Faster image loading times
   - Better handling of image dimensions
   - Reduced layout shifts

2. **Page Rendering Performance**:
   - Improved First Contentful Paint (FCP)
   - Better Largest Contentful Paint (LCP)
   - Reduced Cumulative Layout Shift (CLS)

3. **Memory Usage**:
   - Reduced memory consumption
   - More efficient resource usage

4. **Scrolling Performance**:
   - Smoother scrolling
   - Fewer janky frames
   - Better responsiveness

## Troubleshooting

If you encounter issues with the testing tools:

- Make sure the development server is running (`npm run dev`)
- Check that you're testing on a chapter with multiple images
- Try using incognito/private browsing mode to avoid cache effects
- Clear browser cache between tests for more accurate results
- If you get a "Unexpected token '<'" error, try the inline performance test method instead

## Interpreting Results

When comparing results:

- **Lower is better** for most metrics (load times, memory usage, etc.)
- Look for significant improvements (>20%) in image loading times
- Check for reduced layout shifts (CLS should be closer to 0)
- Verify that scrolling performance is smoother (higher FPS, fewer jank frames)

The optimizations should result in a noticeable improvement in the overall user experience, especially on mobile devices and slower connections. 