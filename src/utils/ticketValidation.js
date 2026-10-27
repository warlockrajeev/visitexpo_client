/**
 * @file ticketValidation.js
 * @description Input filter and validation helpers to prevent symbol spam, gibberish, and malformed inputs in support tickets.
 */

export const INVALID_START_REGEX = /^[^a-zA-Z0-9\s"']/;
export const CONSECUTIVE_SYMBOLS_REGEX = /[!@#$%^&*()_+={}\[\]|\\:;\"'<>,~`]{3,}/;
export const START_SYMBOLS_REGEX = /^[^a-zA-Z0-9\s]{2,}/;
export const REPEATED_CHARS_REGEX = /(.)\1{4,}/;

/**
 * Real-time keystroke/paste filter for ticket title, description, and reply inputs.
 * Blocks random symbols like )(*&^%$#@ from ever being typed or pasted.
 */
export const filterTicketInput = (newVal, prevVal = '') => {
  if (!newVal) return newVal;
  // If user is clearing or backspacing, allow
  if (newVal.length < prevVal.length) return newVal;

  // Prevent starting with symbol spam like ), (, *, &, ^, %, $, #, @, etc.
  if (INVALID_START_REGEX.test(newVal)) return prevVal;

  // Prevent 2+ non-alphanumeric symbols right at start
  if (START_SYMBOLS_REGEX.test(newVal)) return prevVal;

  // Prevent 3+ consecutive symbols anywhere
  if (CONSECUTIVE_SYMBOLS_REGEX.test(newVal)) return prevVal;

  // Prevent 5+ identical repeated characters
  if (REPEATED_CHARS_REGEX.test(newVal)) return prevVal;

  // Prevent HTML/script tag start
  if (/<[a-z]/i.test(newVal)) return prevVal;

  return newVal;
};

/**
 * Validates text before submitting ticket or reply.
 */
export const validateTicketInput = (text, fieldName = 'Text') => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { valid: false, error: `${fieldName} is required.` };
  }
  const trimmed = text.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters.` };
  }
  if (INVALID_START_REGEX.test(trimmed)) {
    return { valid: false, error: `${fieldName} must start with a letter or number, not symbols.` };
  }
  const letterMatches = trimmed.match(/[a-zA-Z]/g);
  if (!letterMatches || letterMatches.length === 0) {
    return { valid: false, error: `${fieldName} must contain genuine words or text, not just symbols or numbers.` };
  }
  const nonSpaceChars = trimmed.replace(/\s+/g, '');
  if (nonSpaceChars.length >= 4) {
    const alphaNumMatches = nonSpaceChars.match(/[a-zA-Z0-9]/g) || [];
    if (alphaNumMatches.length / nonSpaceChars.length < 0.5) {
      return { valid: false, error: `Too many random symbols in ${fieldName.toLowerCase()}. Please enter meaningful text.` };
    }
  }
  if (CONSECUTIVE_SYMBOLS_REGEX.test(trimmed)) {
    return { valid: false, error: `Random symbol spam detected in ${fieldName.toLowerCase()}. Please enter genuine text.` };
  }
  if (REPEATED_CHARS_REGEX.test(trimmed)) {
    return { valid: false, error: `Excessive repeated characters detected in ${fieldName.toLowerCase()}.` };
  }
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return { valid: false, error: `HTML tags or code scripts are not allowed in ${fieldName.toLowerCase()}.` };
  }
  return { valid: true };
};
