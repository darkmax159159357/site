#!/usr/bin/env node

/**
 * Image Optimization Script for GlintScans
 * 
 * This script optimizes manga images to improve loading performance.
 * It can:
 * 1. Compress images with minimal visual quality loss
 * 2. Convert JPEG/PNG to WebP for better compression
 * 3. Create responsive image sizes
 * 
 * Usage:
 * node optimize-images.js <input-directory>
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Check if the required tools are installed
function checkRequirements() {
  try {
    execSync('convert --version', { stdio: 'ignore' });
    execSync('cwebp -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error('Error: Required tools are missing. Please install:');
    console.error('- ImageMagick (for the "convert" command)');
    console.error('- libwebp (for the "cwebp" command)');
    console.error('\nInstallation:');
    console.error('Ubuntu/Debian: sudo apt-get install imagemagick webp');
    console.error('macOS: brew install imagemagick webp');
    console.error('Windows: Install via chocolatey or download from websites');
    return false;
  }
}

// Process a single image
async function optimizeImage(imagePath, outputDir, options = {}) {
  const {
    quality = 85,
    convertToWebP = true,
    resize = false,
    maxWidth = 1200,
  } = options;

  const filename = path.basename(imagePath);
  const fileExt = path.extname(imagePath).toLowerCase();
  const baseName = path.basename(imagePath, fileExt);
  
  // Skip if already WebP and we're converting to WebP
  if (fileExt === '.webp' && convertToWebP) {
    console.log(`${filename} is already WebP format, skipping conversion`);
    return;
  }

  try {
    console.log(`Processing ${filename}...`);

    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    
    // Optimize the original image first
    const optimizedPath = path.join(outputDir, filename);
    
    if (resize) {
      // Resize and optimize original format
      execSync(`convert "${imagePath}" -strip -resize "${maxWidth}x>" -quality ${quality} "${optimizedPath}"`, { stdio: 'ignore' });
    } else {
      // Just optimize original format without resizing
      execSync(`convert "${imagePath}" -strip -quality ${quality} "${optimizedPath}"`, { stdio: 'ignore' });
    }
    
    // Create WebP version if requested
    if (convertToWebP) {
      const webpPath = path.join(outputDir, `${baseName}.webp`);
      execSync(`cwebp -q ${quality} "${optimizedPath}" -o "${webpPath}"`, { stdio: 'ignore' });
      
      // Get file sizes for comparison
      const originalSize = (await fs.stat(optimizedPath)).size;
      const webpSize = (await fs.stat(webpPath)).size;
      
      const savings = ((originalSize - webpSize) / originalSize * 100).toFixed(2);
      console.log(`  WebP saved ${savings}% (${formatBytes(originalSize)} → ${formatBytes(webpSize)})`);
    }
    
    return optimizedPath;
  } catch (error) {
    console.error(`  Error processing ${filename}: ${error.message}`);
    return null;
  }
}

// Process all images in a directory
async function processDirectory(inputDir, outputDir, options = {}) {
  try {
    // List all files in the directory
    const files = await fs.readdir(inputDir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    
    let processed = 0;
    let errors = 0;
    
    // Process each file/subdirectory
    for (const file of files) {
      const filePath = path.join(inputDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        // Recursively process subdirectories
        const subOutputDir = path.join(outputDir, file);
        const results = await processDirectory(filePath, subOutputDir, options);
        processed += results.processed;
        errors += results.errors;
      } else {
        // Process images only
        const ext = path.extname(file).toLowerCase();
        if (imageExtensions.includes(ext)) {
          const result = await optimizeImage(filePath, outputDir, options);
          if (result) {
            processed++;
          } else {
            errors++;
          }
        }
      }
    }
    
    return { processed, errors };
  } catch (error) {
    console.error(`Error processing directory ${inputDir}: ${error.message}`);
    return { processed: 0, errors: 1 };
  }
}

// Format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Create an interactive prompt
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Main function
async function main() {
  // Check for required tools
  if (!checkRequirements()) {
    process.exit(1);
  }
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Error: Please provide an input directory.');
    console.error('Usage: node optimize-images.js <input-directory> [options]');
    process.exit(1);
  }
  
  const inputDir = args[0];
  const outputDir = args[1] || path.join(inputDir, 'optimized');
  
  // Confirm with the user
  console.log(`\nImage Optimization for GlintScans`);
  console.log(`----------------------------`);
  console.log(`Input directory: ${inputDir}`);
  console.log(`Output directory: ${outputDir}`);
  
  const options = {
    quality: 85,
    convertToWebP: true,
    resize: false,
    maxWidth: 1200,
  };
  
  // Ask for options
  console.log(`\nConfiguring optimization options:`);
  
  options.quality = parseInt(await prompt(`JPEG/WebP quality (10-100, default 85): `) || '85');
  options.convertToWebP = (await prompt(`Convert images to WebP? (y/n, default y): `) || 'y').toLowerCase() === 'y';
  options.resize = (await prompt(`Resize large images? (y/n, default n): `) || 'n').toLowerCase() === 'y';
  
  if (options.resize) {
    options.maxWidth = parseInt(await prompt(`Max width in pixels (default 1200): `) || '1200');
  }
  
  console.log(`\nStarting image optimization with the following settings:`);
  console.log(`- Quality: ${options.quality}%`);
  console.log(`- Convert to WebP: ${options.convertToWebP ? 'Yes' : 'No'}`);
  console.log(`- Resize large images: ${options.resize ? 'Yes' : 'No'}`);
  if (options.resize) {
    console.log(`- Max width: ${options.maxWidth}px`);
  }
  
  const confirm = await prompt(`\nProceed with optimization? (y/n): `);
  if (confirm.toLowerCase() !== 'y') {
    console.log('Optimization canceled.');
    process.exit(0);
  }
  
  // Process directory
  console.log(`\nProcessing images in ${inputDir}...`);
  const startTime = Date.now();
  
  try {
    const results = await processDirectory(inputDir, outputDir, options);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\nOptimization completed in ${duration} seconds:`);
    console.log(`- Successfully processed: ${results.processed} images`);
    console.log(`- Errors: ${results.errors} images`);
    console.log(`- Output directory: ${outputDir}`);
  } catch (error) {
    console.error(`\nFailed to complete optimization: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main(); 