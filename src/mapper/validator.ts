/**
 * MapperValidator Implementation
 * ==============================
 * 
 * Validates mapper configurations against the OTP v2.0 JSON Schema specification.
 * Ensures all mapper configurations conform to the standard.
 */

import { MapperValidator as IMapperValidator, MapperType, ValidationError } from './types';

/**
 * JSON Schema definitions for each mapper type
 */
const MAPPER_SCHEMAS = {
  [MapperType.NUMERICAL]: {
    type: 'object',
    required: ['id', 'version', 'falsity_point', 'indeterminacy_point', 'truth_point'],
    properties: {
      id: { type: 'string', minLength: 1 },
      version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
      description: { type: 'string' },
      falsity_point: { type: 'number' },
      indeterminacy_point: { type: 'number' },
      truth_point: { type: 'number' },
      clamp_to_range: { type: 'boolean' },
      metadata: { type: 'object' }
    },
    additionalProperties: false
  },
  
  [MapperType.CATEGORICAL]: {
    type: 'object',
    required: ['id', 'version', 'mappings'],
    properties: {
      id: { type: 'string', minLength: 1 },
      version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
      description: { type: 'string' },
      mappings: {
        type: 'object',
        patternProperties: {
          '^.+$': {
            type: 'object',
            required: ['T', 'I', 'F'],
            properties: {
              T: { type: 'number', minimum: 0, maximum: 1 },
              I: { type: 'number', minimum: 0, maximum: 1 },
              F: { type: 'number', minimum: 0, maximum: 1 }
            },
            additionalProperties: false
          }
        }
      },
      default_judgment: {
        type: 'object',
        required: ['T', 'I', 'F'],
        properties: {
          T: { type: 'number', minimum: 0, maximum: 1 },
          I: { type: 'number', minimum: 0, maximum: 1 },
          F: { type: 'number', minimum: 0, maximum: 1 }
        },
        additionalProperties: false
      },
      metadata: { type: 'object' }
    },
    additionalProperties: false
  },
  
  [MapperType.BOOLEAN]: {
    type: 'object',
    required: ['id', 'version', 'true_map', 'false_map'],
    properties: {
      id: { type: 'string', minLength: 1 },
      version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
      description: { type: 'string' },
      true_map: {
        type: 'object',
        required: ['T', 'I', 'F'],
        properties: {
          T: { type: 'number', minimum: 0, maximum: 1 },
          I: { type: 'number', minimum: 0, maximum: 1 },
          F: { type: 'number', minimum: 0, maximum: 1 }
        },
        additionalProperties: false
      },
      false_map: {
        type: 'object',
        required: ['T', 'I', 'F'],
        properties: {
          T: { type: 'number', minimum: 0, maximum: 1 },
          I: { type: 'number', minimum: 0, maximum: 1 },
          F: { type: 'number', minimum: 0, maximum: 1 }
        },
        additionalProperties: false
      },
      metadata: { type: 'object' }
    },
    additionalProperties: false
  }
};

/**
 * Simple JSON Schema validator implementation
 * 
 * In a production environment, you would typically use a library like ajv
 * for more robust JSON Schema validation.
 */
class SimpleSchemaValidator {
  /**
   * Validate an object against a JSON Schema
   * 
   * @param obj - The object to validate
   * @param schema - The JSON Schema to validate against
   * @returns Validation result with errors
   */
  validate(obj: any, schema: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      this.validateObject(obj, schema, '', errors);
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  private validateObject(obj: any, schema: any, path: string, errors: string[]): void {
    if (schema.type === 'object') {
      this.validateObjectType(obj, schema, path, errors);
    } else if (schema.type === 'string') {
      this.validateStringType(obj, schema, path, errors);
    } else if (schema.type === 'number') {
      this.validateNumberType(obj, schema, path, errors);
    } else if (schema.type === 'boolean') {
      this.validateBooleanType(obj, schema, path, errors);
    }
    
    // Validate additional constraints
    this.validateConstraints(obj, schema, path, errors);
  }
  
  private validateObjectType(obj: any, schema: any, path: string, errors: string[]): void {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      errors.push(`${path}: Expected object, got ${typeof obj}`);
      return;
    }
    
    // Check required properties
    if (schema.required) {
      for (const prop of schema.required) {
        if (!(prop in obj)) {
          errors.push(`${path}: Missing required property '${prop}'`);
        }
      }
    }
    
    // Validate properties
    if (schema.properties) {
      for (const [prop, propSchema] of Object.entries(schema.properties)) {
        const propPath = path ? `${path}.${prop}` : prop;
        if (prop in obj) {
          this.validateObject(obj[prop], propSchema, propPath, errors);
        }
      }
    }
    
    // Check for additional properties
    if (schema.additionalProperties === false && schema.properties) {
      for (const prop of Object.keys(obj)) {
        if (!(prop in schema.properties)) {
          errors.push(`${path}: Additional property '${prop}' not allowed`);
        }
      }
    }
  }
  
  private validateStringType(obj: any, schema: any, path: string, errors: string[]): void {
    if (typeof obj !== 'string') {
      errors.push(`${path}: Expected string, got ${typeof obj}`);
      return;
    }
    
    if (schema.minLength && obj.length < schema.minLength) {
      errors.push(`${path}: String too short (minimum ${schema.minLength} characters)`);
    }
    
    if (schema.pattern && !new RegExp(schema.pattern).test(obj)) {
      errors.push(`${path}: String does not match pattern ${schema.pattern}`);
    }
  }
  
  private validateNumberType(obj: any, schema: any, path: string, errors: string[]): void {
    if (typeof obj !== 'number') {
      errors.push(`${path}: Expected number, got ${typeof obj}`);
      return;
    }
    
    if (schema.minimum !== undefined && obj < schema.minimum) {
      errors.push(`${path}: Number too small (minimum ${schema.minimum})`);
    }
    
    if (schema.maximum !== undefined && obj > schema.maximum) {
      errors.push(`${path}: Number too large (maximum ${schema.maximum})`);
    }
  }
  
  private validateBooleanType(obj: any, _schema: any, path: string, errors: string[]): void {
    if (typeof obj !== 'boolean') {
      errors.push(`${path}: Expected boolean, got ${typeof obj}`);
    }
  }
  
  private validateConstraints(_obj: any, _schema: any, _path: string, _errors: string[]): void {
    // Add any additional constraint validations here
  }
}

/**
 * MapperValidator for validating mapper configurations against JSON Schema
 * 
 * Ensures all mapper configurations conform to the OTP v2.0 specification.
 * 
 * Example:
 * ```typescript
 * const validator = new MapperValidator();
 * 
 * const config = {
 *   id: 'defi-health-factor',
 *   version: '1.0.0',
 *   falsity_point: 1.0,
 *   indeterminacy_point: 1.5,
 *   truth_point: 3.0
 * };
 * 
 * validator.validate(config); // Returns true if valid
 * ```
 */
export class MapperValidator implements IMapperValidator {
  private schemaValidator: SimpleSchemaValidator;
  
  constructor() {
    this.schemaValidator = new SimpleSchemaValidator();
  }
  
  /**
   * Validate a mapper configuration against JSON Schema
   * 
   * @param config - The mapper configuration
   * @returns true if valid, throws error if invalid
   * @throws ValidationError if the configuration is invalid
   */
  validate(config: any): boolean {
    if (!config || typeof config !== 'object') {
      throw new ValidationError('Mapper configuration must be an object');
    }
    
    // Determine mapper type from configuration
    let mapperType: MapperType | null = null;
    
    if ('falsity_point' in config && 'indeterminacy_point' in config && 'truth_point' in config) {
      mapperType = MapperType.NUMERICAL;
    } else if ('mappings' in config) {
      mapperType = MapperType.CATEGORICAL;
    } else if ('true_map' in config && 'false_map' in config) {
      mapperType = MapperType.BOOLEAN;
    }
    
    if (!mapperType) {
      throw new ValidationError('Cannot determine mapper type from configuration');
    }
    
    // Get the appropriate schema
    const schema = this.getSchema(mapperType);
    
    // Validate against schema
    const result = this.schemaValidator.validate(config, schema);
    
    if (!result.valid) {
      throw new ValidationError(`Schema validation failed: ${result.errors.join(', ')}`);
    }
    
    // Additional custom validations
    this.performCustomValidations(config, mapperType);
    
    return true;
  }
  
  /**
   * Get the JSON Schema for a mapper type
   * 
   * @param mapperType - The mapper type
   * @returns The JSON Schema object
   */
  getSchema(mapperType: MapperType): any {
    const schema = MAPPER_SCHEMAS[mapperType];
    if (!schema) {
      throw new ValidationError(`No schema defined for mapper type: ${mapperType}`);
    }
    return schema;
  }
  
  /**
   * Perform custom validations beyond JSON Schema
   * 
   * @param config - The mapper configuration
   * @param mapperType - The mapper type
   * @throws ValidationError if custom validation fails
   */
  private performCustomValidations(config: any, mapperType: MapperType): void {
    switch (mapperType) {
      case MapperType.NUMERICAL:
        this.validateNumericalMapper(config);
        break;
      case MapperType.CATEGORICAL:
        this.validateCategoricalMapper(config);
        break;
      case MapperType.BOOLEAN:
        this.validateBooleanMapper(config);
        break;
    }
  }
  
  /**
   * Validate NumericalMapper specific constraints
   * 
   * @param config - The mapper configuration
   * @throws ValidationError if validation fails
   */
  private validateNumericalMapper(config: any): void {
    const { falsity_point, indeterminacy_point, truth_point } = config;
    
    // Ensure points are distinct
    const points = [falsity_point, indeterminacy_point, truth_point];
    const uniquePoints = [...new Set(points)];
    
    if (uniquePoints.length < 3) {
      throw new ValidationError(
        'falsity_point, indeterminacy_point, and truth_point must be distinct for NumericalMapper'
      );
    }
  }
  
  /**
   * Validate CategoricalMapper specific constraints
   * 
   * @param config - The mapper configuration
   * @throws ValidationError if validation fails
   */
  private validateCategoricalMapper(config: any): void {
    const { mappings, default_judgment } = config;
    
    // Validate judgment values in mappings
    for (const [category, judgment] of Object.entries(mappings)) {
      this.validateJudgmentValues(judgment, `mappings.${category}`);
    }
    
    // Validate default judgment if provided
    if (default_judgment) {
      this.validateJudgmentValues(default_judgment, 'default_judgment');
    }
  }
  
  /**
   * Validate BooleanMapper specific constraints
   * 
   * @param config - The mapper configuration
   * @throws ValidationError if validation fails
   */
  private validateBooleanMapper(config: any): void {
    const { true_map, false_map } = config;
    
    // Validate judgment values
    this.validateJudgmentValues(true_map, 'true_map');
    this.validateJudgmentValues(false_map, 'false_map');
  }
  
  /**
   * Validate judgment values (T, I, F)
   * 
   * @param judgment - The judgment object
   * @param path - The path for error reporting
   * @throws ValidationError if validation fails
   */
  private validateJudgmentValues(judgment: any, path: string): void {
    if (!judgment || typeof judgment !== 'object') {
      throw new ValidationError(`${path}: Judgment must be an object`);
    }
    
    const { T, I, F } = judgment;
    
    // Check for required properties
    if (typeof T !== 'number' || typeof I !== 'number' || typeof F !== 'number') {
      throw new ValidationError(`${path}: T, I, F must be numbers`);
    }
    
    // Range validation
    if (T < 0 || T > 1 || I < 0 || I > 1 || F < 0 || F > 1) {
      throw new ValidationError(`${path}: T, I, F values must be between 0 and 1`);
    }
    
    // Conservation constraint validation
    const sum = T + I + F;
    if (sum > 1.0) {
      throw new ValidationError(`${path}: Conservation constraint violated: T + I + F = ${sum} > 1.0`);
    }
  }
  
  /**
   * Validate multiple mapper configurations
   * 
   * @param configs - Array of mapper configurations
   * @returns Array of validation results
   */
  validateMultiple(configs: any[]): Array<{ config: any; valid: boolean; error?: string }> {
    return configs.map(config => {
      try {
        this.validate(config);
        return { config, valid: true };
      } catch (error) {
        return { config, valid: false, error: error instanceof Error ? error.message : String(error) };
      }
    });
  }
  
  /**
   * Get all available mapper types
   * 
   * @returns Array of mapper type strings
   */
  getAvailableTypes(): string[] {
    return Object.values(MapperType);
  }
  
  /**
   * Check if a mapper type is supported
   * 
   * @param mapperType - The mapper type to check
   * @returns true if the type is supported
   */
  isTypeSupported(mapperType: string): boolean {
    return Object.values(MapperType).includes(mapperType as MapperType);
  }
}
