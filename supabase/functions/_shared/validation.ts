/**
 * INPUT VALIDATION SCHEMAS
 * 
 * Centralized Zod schemas for validating edge function inputs.
 * Prevents injection attacks, validates formats, and enforces length limits.
 */

// Barcode validation: 8-13 digits (EAN-8, EAN-13, UPC-A, etc.)
export const barcodeSchema = {
  barcode: (value: unknown) => {
    if (typeof value !== 'string') {
      throw new Error('Barcode must be a string');
    }
    const trimmed = value.trim();
    if (!/^\d{8,14}$/.test(trimmed)) {
      throw new Error('Barcode must be 8-14 digits');
    }
    return trimmed;
  }
};

// Product name validation: 2-200 characters
export const productNameSchema = {
  productName: (value: unknown) => {
    if (typeof value !== 'string') {
      throw new Error('Product name must be a string');
    }
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      throw new Error('Product name must be at least 2 characters');
    }
    if (trimmed.length > 200) {
      throw new Error('Product name must be less than 200 characters');
    }
    return trimmed;
  }
};

// Region validation: only allowed values
export const regionSchema = {
  region: (value: unknown) => {
    if (value === undefined || value === null) {
      return 'world';
    }
    if (typeof value !== 'string') {
      throw new Error('Region must be a string');
    }
    const allowed = ['world', 'us', 'uk', 'fr', 'de', 'ca', 'au', 'global'];
    if (!allowed.includes(value)) {
      return 'world'; // Default to world for unknown regions
    }
    return value;
  }
};

// Ingredients validation: array or string, max 10000 chars
export const ingredientsSchema = {
  ingredients: (value: unknown) => {
    if (!value) {
      throw new Error('Ingredients are required');
    }
    
    if (Array.isArray(value)) {
      // Validate each ingredient string
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('All ingredients must be strings');
        }
        if (item.length > 500) {
          throw new Error('Individual ingredient must be less than 500 characters');
        }
      }
      return value;
    }
    
    if (typeof value === 'string') {
      if (value.length > 10000) {
        throw new Error('Ingredients text must be less than 10000 characters');
      }
      return value;
    }
    
    throw new Error('Ingredients must be a string or array');
  }
};

// Generic string validation
export const stringSchema = (fieldName: string, maxLength: number = 200) => ({
  [fieldName]: (value: unknown) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value !== 'string') {
      throw new Error(`${fieldName} must be a string`);
    }
    const trimmed = value.trim();
    if (trimmed.length > maxLength) {
      throw new Error(`${fieldName} must be less than ${maxLength} characters`);
    }
    return trimmed || undefined;
  }
});

// Labels/tags validation
export const labelsSchema = {
  labels: (value: unknown) => {
    if (!value) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value.slice(0, 1000); // Limit string length
    }
    if (Array.isArray(value)) {
      return value.slice(0, 50).map(v => String(v).slice(0, 100)); // Limit array and item length
    }
    return undefined;
  }
};

// Validate an object against multiple schema rules
export function validate<T>(data: unknown, schema: Record<string, (value: unknown) => any>): T {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid input data');
  }
  
  const result: any = {};
  const dataObj = data as Record<string, unknown>;
  
  for (const [key, validator] of Object.entries(schema)) {
    try {
      result[key] = validator(dataObj[key]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Validation error for ${key}: ${errorMessage}`);
    }
  }
  
  return result as T;
}
