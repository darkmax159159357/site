"use client";
export * from "./wrapper";
export * from "./patch-router/link";
export * from "./patch-router/router";
export { Link } from "./patch-router/link";
export { useRouter } from "./patch-router/router";

// Setup global popstate handler to ensure proper navigation with browser back button
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    // Force a proper cleanup and re-render when browser back button is pressed
    // This helps ensure Next.js router properly handles the navigation
    const event = new Event('router-back-button');
    window.dispatchEvent(event);
  });
}
