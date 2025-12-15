/**
 * Form Validation Utilities
 * 
 * Provides validation functions for forms
 */

interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Common validation rules
export const rules = {
  required: (message = "Campo obrigatório"): ValidationRule => ({
    validate: (value) => value.trim().length > 0,
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => value.length >= min,
    message: message || `Mínimo ${min} caracteres`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => value.length <= max,
    message: message || `Máximo ${max} caracteres`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value) => regex.test(value),
    message,
  }),

  email: (message = "Email inválido"): ValidationRule => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  mnemonic: (message = "Mnemônico deve ter 24 palavras"): ValidationRule => ({
    validate: (value) => value.trim().split(/\s+/).length === 24,
    message,
  }),

  noSpecialChars: (message = "Caracteres especiais não permitidos"): ValidationRule => ({
    validate: (value) => /^[a-zA-Z0-9\s\-_.,!?]+$/.test(value),
    message,
  }),
};

// Validate a single field
export function validateField(value: string, validations: ValidationRule[]): ValidationResult {
  const errors: string[] = [];

  for (const rule of validations) {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate a form object
export function validateForm(
  data: Record<string, string>,
  schema: Record<string, ValidationRule[]>
): { valid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  let valid = true;

  for (const [field, validations] of Object.entries(schema)) {
    const result = validateField(data[field] || "", validations);
    if (!result.valid) {
      valid = false;
      errors[field] = result.errors;
    }
  }

  return { valid, errors };
}

// Post validation schema
export const postSchema = {
  title: [rules.required(), rules.minLength(5), rules.maxLength(200)],
  body: [rules.required(), rules.minLength(20), rules.maxLength(10000)],
  region: [rules.required()],
};

// Comment validation schema
export const commentSchema = {
  body: [rules.required(), rules.minLength(2), rules.maxLength(2000)],
};

// Report validation schema
export const reportSchema = {
  reason: [rules.required(), rules.minLength(10), rules.maxLength(500)],
};

export default { rules, validateField, validateForm };
