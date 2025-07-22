import { randomUUID } from 'crypto';

/**
 * Generate a UUID for database entities
 * @returns {string} UUID string
 */
export const generateId = () => {
  return randomUUID();
};

/**
 * Generate multiple IDs at once
 * @param {number} count - Number of IDs to generate
 * @returns {string[]} Array of UUID strings
 */
export const generateIds = (count) => {
  return Array.from({ length: count }, () => generateId());
};

/**
 * Validate if a string is a valid UUID
 * @param {string} id - String to validate
 * @returns {boolean} True if valid UUID
 */
export const isValidUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};