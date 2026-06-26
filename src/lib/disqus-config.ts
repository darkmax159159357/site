/**
 * Disqus configuration settings
 * 
 * This file contains the configuration for the Disqus comment system.
 * Update these values with your own Disqus account information.
 */

// Determine if we're running in development or production
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Disqus configuration object
 * 
 * Note about shortname:
 * The shortname is the unique identifier for your Disqus account.
 * It can be found in your Disqus admin settings.
 * 
 * For this site, we're using the site shortname: 'medusascans'
 */
const disqusConfig = {
  /**
   * Your Disqus shortname
   * This is the unique identifier for your Disqus account
   * You can find this in your Disqus admin settings
   * 
   * Note: This is your Disqus site shortname, not your username
   * Example: 'medusascans'
   */
  shortname: process.env.NEXT_PUBLIC_DISQUS_SHORTNAME || 'medusascans',
  
  /**
   * Your website domain
   * This is used to construct the URL for Disqus comments
   * In development, we still use the production domain for the URL
   * to ensure comments are consistent between environments
   */
  domain: process.env.NEXT_PUBLIC_DOMAIN || 'https://medusascans-relc.vercel.app',
  
  /**
   * Default language for Disqus
   */
  language: 'en',
  
  /**
   * Debug mode
   * Set to true to enable additional logging
   */
  debug: isDevelopment,
  
  /**
   * Categories for different sections of your site
   */
  categories: {
    mangaDetails: 'manga-details',
    mangaChapter: 'manga-chapter',
  }
};

export default disqusConfig; 