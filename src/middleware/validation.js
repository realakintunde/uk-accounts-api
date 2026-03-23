// src/middleware/validation.js
const validator = require('validator');

function validateEmail(email) {
  const trimmed = validator.trim(email);
  if (!validator.isEmail(trimmed)) {
    throw new Error('Invalid email format');
  }
  return trimmed.toLowerCase();
}

function validatePassword(password) {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one number');
  }
  return password;
}

function validateCompanyName(name) {
  const trimmed = validator.trim(name);
  if (trimmed.length < 2 || trimmed.length > 255) {
    throw new Error('Company name must be between 2 and 255 characters');
  }
  return trimmed;
}

function validateCompanyNumber(number) {
  // UK company numbers are 8 digits
  const cleaned = number.replace(/\D/g, '');
  if (cleaned.length !== 8) {
    throw new Error('Company number must be 8 digits');
  }
  return cleaned;
}

function sanitizeString(str) {
  return validator.trim(validator.escape(str || ''));
}

function validateBusinessAddress(address) {
  const trimmed = validator.trim(address);
  if (trimmed.length < 5 || trimmed.length > 500) {
    throw new Error('Address must be between 5 and 500 characters');
  }
  return sanitizeString(trimmed);
}

module.exports = {
  validateEmail,
  validatePassword,
  validateCompanyName,
  validateCompanyNumber,
  sanitizeString,
  validateBusinessAddress
};
