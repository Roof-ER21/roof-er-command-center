/**
 * Slug Generation Service
 * Generates URL-friendly slugs for employee profiles
 */

/**
 * Generates a unique slug for an employee
 * Format: firstname-lastname-xxxx (where xxxx is a random 4-character suffix)
 */
export function generateEmployeeSlug(firstName: string, lastName: string): string {
  // Convert to lowercase and remove special characters
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Generate random 4-character suffix
  const suffix = Math.random().toString(36).substring(2, 6);

  return `${cleanFirst}-${cleanLast}-${suffix}`;
}

/**
 * Validates if a slug is properly formatted
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 5;
}

/**
 * Sanitizes a string to be slug-friendly
 */
export function sanitizeForSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
