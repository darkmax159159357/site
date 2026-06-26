// Performance Test Script for MedusaScans
// Run this in the browser console on the chapter reading page

console.log('🔍 Starting MedusaScans Performance Test');

// Function to test image loading performance
function testImageLoadingPerformance() {
  console.log('📊 Testing Image Loading Performance...');
  
  // Get all manga images
  const mangaImages = document.querySelectorAll('.manga-image-container img, .manga-reader-image');
  console.log(`Found ${mangaImages.length} manga images`);
  
  // Track loading times
  const loadTimes = [];
  let loadedCount = 0;
  
  // Performance metrics
  const metrics = {
    totalImages: mangaImages.length,
    loadedImages: 0,
    averageLoadTime: 0,
    maxLoadTime: 0,
    minLoadTime: Infinity,
    totalLoadTime: 0
  };
  
  // Start time
  const startTime = performance.now();
  
  // Create a promise for each image
  const imagePromises = Array.from(mangaImages).map((img, index) => {
    return new Promise((resolve) => {
      if (img.complete) {
        // Image already loaded
        const loadTime = 0;
        loadTimes.push({ index, loadTime });
        loadedCount++;
        resolve();
      } else {
        // Set up load event
        const imgStartTime = performance.now();
        img.addEventListener('load', () => {
          const loadTime = performance.now() - imgStartTime;
          loadTimes.push({ index, loadTime });
          loadedCount++;
          console.log(`Image ${index + 1}/${mangaImages.length} loaded in ${loadTime.toFixed(2)}ms`);
          resolve();
        });
        
        // Handle errors
        img.addEventListener('error', () => {
          console.error(`Image ${index + 1} failed to load`);
          resolve();
        });
      }
    });
  });
  
  // Wait for all images to load
  return Promise.all(imagePromises).then(() => {
    const totalTime = performance.now() - startTime;
    
    // Calculate metrics
    metrics.loadedImages = loadedCount;
    metrics.totalLoadTime = totalTime;
    
    if (loadTimes.length > 0) {
      const times = loadTimes.map(item => item.loadTime);
      metrics.averageLoadTime = times.reduce((a, b) => a + b, 0) / times.length;
      metrics.maxLoadTime = Math.max(...times);
      metrics.minLoadTime = Math.min(...times);
    }
    
    console.log('📊 Image Loading Performance Results:');
    console.log(`Total Images: ${metrics.totalImages}`);
    console.log(`Loaded Images: ${metrics.loadedImages}`);
    console.log(`Total Load Time: ${metrics.totalLoadTime.toFixed(2)}ms`);
    console.log(`Average Load Time: ${metrics.averageLoadTime.toFixed(2)}ms`);
    console.log(`Max Load Time: ${metrics.maxLoadTime.toFixed(2)}ms`);
    console.log(`Min Load Time: ${metrics.minLoadTime.toFixed(2)}ms`);
    
    return metrics;
  });
}

// Function to test page rendering performance
function testPageRenderingPerformance() {
  console.log('📊 Testing Page Rendering Performance...');
  
  // Get performance entries
  const perfEntries = performance.getEntriesByType('navigation');
  
  if (perfEntries.length > 0) {
    const navEntry = perfEntries[0];
    
    console.log('📊 Page Rendering Performance Results:');
    console.log(`DOM Content Loaded: ${navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart}ms`);
    console.log(`DOM Interactive: ${navEntry.domInteractive}ms`);
    console.log(`DOM Complete: ${navEntry.domComplete}ms`);
    console.log(`Load Event: ${navEntry.loadEventEnd - navEntry.loadEventStart}ms`);
    console.log(`Total Page Load Time: ${navEntry.loadEventEnd}ms`);
    
    // Calculate First Contentful Paint if available
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    
    if (fcp) {
      console.log(`First Contentful Paint: ${fcp.startTime}ms`);
    }
    
    return {
      domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
      domInteractive: navEntry.domInteractive,
      domComplete: navEntry.domComplete,
      loadEvent: navEntry.loadEventEnd - navEntry.loadEventStart,
      totalPageLoadTime: navEntry.loadEventEnd,
      firstContentfulPaint: fcp ? fcp.startTime : null
    };
  } else {
    console.warn('Navigation timing data not available');
    return null;
  }
}

// Function to test scrolling performance
function testScrollingPerformance() {
  console.log('📊 Testing Scrolling Performance...');
  
  // Measure frames per second during scrolling
  let lastTime = performance.now();
  let frames = 0;
  let totalFrameTime = 0;
  let minFrameTime = Infinity;
  let maxFrameTime = 0;
  let measurements = [];
  let measuring = false;
  
  function frameCounter(timestamp) {
    if (measuring) {
      const frameTime = timestamp - lastTime;
      
      // Only count reasonable frame times
      if (frameTime > 0 && frameTime < 100) {
        frames++;
        totalFrameTime += frameTime;
        minFrameTime = Math.min(minFrameTime, frameTime);
        maxFrameTime = Math.max(maxFrameTime, frameTime);
        measurements.push(frameTime);
      }
      
      lastTime = timestamp;
      requestAnimationFrame(frameCounter);
    }
  }
  
  // Start measuring
  function startMeasuring() {
    console.log('Starting scroll measurement...');
    frames = 0;
    totalFrameTime = 0;
    minFrameTime = Infinity;
    maxFrameTime = 0;
    measurements = [];
    measuring = true;
    lastTime = performance.now();
    requestAnimationFrame(frameCounter);
    
    // Simulate scrolling
    let scrollPos = 0;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollStep = maxScroll / 100;
    
    function smoothScroll() {
      if (scrollPos >= maxScroll || !measuring) {
        return;
      }
      
      scrollPos = Math.min(scrollPos + scrollStep, maxScroll);
      window.scrollTo(0, scrollPos);
      
      if (scrollPos < maxScroll) {
        setTimeout(smoothScroll, 16); // ~60fps
      } else {
        // End measuring after a short delay
        setTimeout(() => {
          measuring = false;
          reportScrollMetrics();
        }, 500);
      }
    }
    
    smoothScroll();
  }
  
  // Report metrics
  function reportScrollMetrics() {
    const avgFrameTime = totalFrameTime / frames;
    const fps = 1000 / avgFrameTime;
    
    console.log('📊 Scrolling Performance Results:');
    console.log(`Total Frames: ${frames}`);
    console.log(`Average Frame Time: ${avgFrameTime.toFixed(2)}ms`);
    console.log(`Average FPS: ${fps.toFixed(2)}`);
    console.log(`Min Frame Time: ${minFrameTime.toFixed(2)}ms`);
    console.log(`Max Frame Time: ${maxFrameTime.toFixed(2)}ms`);
    
    // Calculate jank (frames that took too long)
    const jankThreshold = 1000 / 30; // 30fps threshold
    const jankFrames = measurements.filter(time => time > jankThreshold).length;
    const jankPercentage = (jankFrames / frames) * 100;
    
    console.log(`Jank Frames: ${jankFrames} (${jankPercentage.toFixed(2)}%)`);
    
    return {
      frames,
      avgFrameTime,
      fps,
      minFrameTime,
      maxFrameTime,
      jankFrames,
      jankPercentage
    };
  }
  
  // Return the test functions
  return {
    start: startMeasuring
  };
}

// Function to test memory usage
function testMemoryUsage() {
  console.log('📊 Testing Memory Usage...');
  
  if (performance.memory) {
    const memoryInfo = performance.memory;
    
    console.log('📊 Memory Usage Results:');
    console.log(`Total JS Heap Size: ${(memoryInfo.totalJSHeapSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Used JS Heap Size: ${(memoryInfo.usedJSHeapSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`JS Heap Size Limit: ${(memoryInfo.jsHeapSizeLimit / (1024 * 1024)).toFixed(2)} MB`);
    
    return {
      totalHeapSize: memoryInfo.totalJSHeapSize,
      usedHeapSize: memoryInfo.usedJSHeapSize,
      heapSizeLimit: memoryInfo.jsHeapSizeLimit
    };
  } else {
    console.warn('Memory performance API not available');
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🔍 Running All Performance Tests...');
  
  // Test page rendering first
  const renderingMetrics = testPageRenderingPerformance();
  
  // Then test image loading
  const imageMetrics = await testImageLoadingPerformance();
  
  // Test memory usage
  const memoryMetrics = testMemoryUsage();
  
  // Prepare scrolling test
  const scrollTest = testScrollingPerformance();
  
  // Combine all metrics
  const allMetrics = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    rendering: renderingMetrics,
    images: imageMetrics,
    memory: memoryMetrics
  };
  
  console.log('📊 All Performance Test Results:');
  console.log(allMetrics);
  
  // Return the metrics and scrolling test
  return {
    metrics: allMetrics,
    scrollTest
  };
}

// Export the test functions
window.medusaPerformanceTest = {
  runAllTests,
  testImageLoadingPerformance,
  testPageRenderingPerformance,
  testScrollingPerformance,
  testMemoryUsage
};

console.log('🔍 Performance Test Ready! Run window.medusaPerformanceTest.runAllTests() to start testing'); 