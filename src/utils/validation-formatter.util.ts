import { FastifySchemaValidationError } from 'fastify/types/schema';

interface ValidationKeywordParams {
  type?: string;
  limit?: number;
  multipleOf?: number;
  format?: string;
  deps?: string[];
  allowedValues?: string[];
  missingProperty?: string;
  [key: string]: unknown;
}

type ValidationMessage = (params: ValidationKeywordParams) => string;

export const validationMessage: Record<string, ValidationMessage> = {
  // Type Validations
  type: (p) => `must be of type ${p.type}`,
  typeof: (p) => `must be a valid JavaScript type (${p.type})`,

  // Numeric Validations
  maximum: (p) => `must be a number less than or equal to ${p.limit}`,
  minimum: (p) => `must be a number greater than or equal to ${p.limit}`,
  exclusiveMaximum: (p) => `must be a number less than ${p.limit}`,
  exclusiveMinimum: (p) => `must be a number greater than ${p.limit}`,
  multipleOf: (p) => `must be a multiple of ${p.multipleOf}`,

  // String Validations
  maxLength: (p) => `must not exceed ${p.limit} characters`,
  minLength: (p) => `must be at least ${p.limit} characters`,
  pattern: () => `Invalid format or pattern`,
  format: (p) => {
    switch (p.format) {
      case 'email':
        return 'must be a valid email address';
      default:
        return `must match format ${p.format}"`;
    }
  },

  // Array Validations
  maxItems: (p) => `must not have more than ${p.limit} items`,
  minItems: (p) => `must have at least ${p.limit} items`,
  uniqueItems: () => `must not contain duplicate items`,
  contains: () => `must contain at least one valid item`,

  // Object Validations
  required: () => `must be present`,
  maxProperties: (p) => `must not have more than ${p.limit} properties`,
  minProperties: (p) => `must have at least ${p.limit} properties`,
  dependencies: (p) => `must meet field dependencies: ${p.deps?.join(', ')}`,
  propertyNames: () => `must have a valid property name`,
  additionalProperties: () => `must not have additional properties`,

  // Compound Validations
  oneOf: () => `must match exactly one schema`,
  anyOf: () => `must match at least one schema`,
  allOf: () => `must match all schemas`,
  not: () => `must not match schema`,
  if: () => `Conditional validation failed`,

  // Custom Keywords
  enum: (p) =>
    `must be one of the following values: ${(p.allowedValues ?? []).join(', ')}`,
  const: () => `Value does not match constant`,

  // Default
  default: () => 'Validation error occurred',
};
function getValidationMessage(error: FastifySchemaValidationError): string {
  const formatter = validationMessage[error.keyword];
  return formatter
    ? formatter(error.params as ValidationKeywordParams)
    : (error.message ?? 'Validation failed');
}

function getPropertyPath(error: FastifySchemaValidationError): string {
  let path = error.instancePath.substring(1).replace(/\//g, '.');
  const missingProperty = (error.params as ValidationKeywordParams)
    .missingProperty;

  if (missingProperty) {
    path = path ? `${path}.${missingProperty}` : missingProperty;
  }

  return path || '$root';
}

export function formatValidationErrors(errors: FastifySchemaValidationError[]) {
  const result: Record<string, string[]> = {};

  errors.forEach((error) => {
    const propertyPath = getPropertyPath(error);
    const message = getValidationMessage(error);

    result[propertyPath] = [message];
  });

  return result;
}
