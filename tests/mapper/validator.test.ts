/**
 * Tests for MapperValidator
 */

import {
  MapperValidator,
  MapperType,
  ValidationError
} from '../../src/mapper';

describe('MapperValidator', () => {
  let validator: MapperValidator;

  beforeEach(() => {
    validator = new MapperValidator();
  });

  describe('Basic Validation', () => {
    it('should validate valid numerical mapper config', () => {
      const config = {
        id: 'test-numerical',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      };

      expect(() => validator.validate(config)).not.toThrow();
    });

    it('should validate valid categorical mapper config', () => {
      const config = {
        id: 'test-categorical',
        version: '1.0.0',
        mappings: {
          'VERIFIED': { T: 1.0, I: 0.0, F: 0.0 },
          'PENDING': { T: 0.0, I: 1.0, F: 0.0 }
        }
      };

      expect(() => validator.validate(config)).not.toThrow();
    });

    it('should validate valid boolean mapper config', () => {
      const config = {
        id: 'test-boolean',
        version: '1.0.0',
        true_map: { T: 0.9, I: 0.1, F: 0.0 },
        false_map: { T: 0.0, I: 0.0, F: 1.0 }
      };

      expect(() => validator.validate(config)).not.toThrow();
    });

    it('should throw error for invalid config object', () => {
      expect(() => validator.validate(null)).toThrow(ValidationError);
      expect(() => validator.validate(undefined)).toThrow(ValidationError);
      expect(() => validator.validate('invalid')).toThrow(ValidationError);
      expect(() => validator.validate(123)).toThrow(ValidationError);
    });

    it('should throw error when mapper type cannot be determined', () => {
      const config = {
        id: 'unknown',
        version: '1.0.0'
        // Missing type-specific properties
      };

      expect(() => validator.validate(config)).toThrow(ValidationError);
    });
  });

  describe('Numerical Mapper Validation', () => {
    it('should validate required properties', () => {
      const config = {
        id: 'test',
        version: '1.0.0'
        // Missing falsity_point, indeterminacy_point, truth_point
      };

      expect(() => validator.validate(config)).toThrow(ValidationError);
    });

    it('should validate property types', () => {
      const config = {
        id: 'test',
        version: '1.0.0',
        falsity_point: 'invalid', // Should be number
        indeterminacy_point: 1.5,
        truth_point: 3.0
      };

      expect(() => validator.validate(config)).toThrow(ValidationError);
    });

    it('should validate distinct points', () => {
      const config = {
        id: 'test',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.0, // Same as falsity_point
        truth_point: 1.0 // Same as others
      };

      expect(() => validator.validate(config)).toThrow(ValidationError);
    });

    it('should validate version format', () => {
      const config = {
        id: 'test',
        version: 'invalid-version', // Should be semantic version
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      };

      expect(() => validator.validate(config)).toThrow(ValidationError);
    });

    it('should validate ID is not empty', () => {
      const config = {
        id: '', // Empty ID
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      };

      expect(() => validator.validate(config)).toThrow(ValidationError);
    });
  });

  describe('Categorical Mapper Validation', () => {
    it('should validate required mappings property', () => {
      const config = {
        id: 'test',
        version: '1.0.0'
        // Missing mappings
      };

      expect(() => validator.validate(config)).toThrow(ValidationError);
    });

    it('should validate mappings structure', () => {
      const config = {
        id: 'test',
        version: '1.0.0',
        mappings: {
          'INVALID': { T: 1.5, I: 0.0, F: 0.0 } // T > 1.0
        }
      };

      expect(() => validator.validate(config)).toThrow(ValidationError);
    });

    it('should validate conservation constraint in mappings', () => {
      const config = {
        id: 'test',
        version: '1.0.0',
        mappings: {
          'INVALID': { T: 0.5, I: 0.5, F: 0.3 } // T + I + F > 1.0
        }
      };

      expect(() => validator.validate(config)).toThrow(ValidationError);
    });

    it('should validate default judgment', () => {
      const config = {
        id: 'test',
        version: '1.0.0',
        mappings: {
          'VALID': { T: 1.0, I: 0.0, F: 0.0 }
        },
        default_judgment: { T: 1.5, I: 0.0, F: 0.0 } // Invalid default
      };

      expect(() => validator.validate(config)).toThrow(ValidationError);
    });
  });

  describe('Boolean Mapper Validation', () => {
    it('should validate required true_map and false_map', () => {
      const config = {
        id: 'test',
        version: '1.0.0'
        // Missing true_map and false_map
      };

      expect(() => validator.validate(config)).toThrow(ValidationError);
    });

    it('should validate true_map structure', () => {
      const config = {
        id: 'test',
        version: '1.0.0',
        true_map: { T: 1.5, I: 0.0, F: 0.0 }, // Invalid
        false_map: { T: 0.0, I: 0.0, F: 1.0 }
      };

      expect(() => validator.validate(config)).toThrow(ValidationError);
    });

    it('should validate false_map structure', () => {
      const config = {
        id: 'test',
        version: '1.0.0',
        true_map: { T: 1.0, I: 0.0, F: 0.0 },
        false_map: { T: 0.5, I: 0.5, F: 0.3 } // T + I + F > 1.0
      };

      expect(() => validator.validate(config)).toThrow(ValidationError);
    });
  });

  describe('Schema Operations', () => {
    it('should get schema for numerical mapper', () => {
      const schema = validator.getSchema(MapperType.NUMERICAL);
      
      expect(schema.type).toBe('object');
      expect(schema.required).toContain('id');
      expect(schema.required).toContain('version');
      expect(schema.required).toContain('falsity_point');
      expect(schema.required).toContain('indeterminacy_point');
      expect(schema.required).toContain('truth_point');
    });

    it('should get schema for categorical mapper', () => {
      const schema = validator.getSchema(MapperType.CATEGORICAL);
      
      expect(schema.type).toBe('object');
      expect(schema.required).toContain('id');
      expect(schema.required).toContain('version');
      expect(schema.required).toContain('mappings');
    });

    it('should get schema for boolean mapper', () => {
      const schema = validator.getSchema(MapperType.BOOLEAN);
      
      expect(schema.type).toBe('object');
      expect(schema.required).toContain('id');
      expect(schema.required).toContain('version');
      expect(schema.required).toContain('true_map');
      expect(schema.required).toContain('false_map');
    });

    it('should throw error for unknown mapper type', () => {
      expect(() => validator.getSchema('unknown' as MapperType)).toThrow(ValidationError);
    });
  });

  describe('Multiple Validation', () => {
    it('should validate multiple configs', () => {
      const configs = [
        {
          id: 'numerical',
          version: '1.0.0',
          falsity_point: 1.0,
          indeterminacy_point: 1.5,
          truth_point: 3.0
        },
        {
          id: 'categorical',
          version: '1.0.0',
          mappings: {
            'STATUS': { T: 1.0, I: 0.0, F: 0.0 }
          }
        },
        {
          id: 'boolean',
          version: '1.0.0',
          true_map: { T: 0.9, I: 0.1, F: 0.0 },
          false_map: { T: 0.0, I: 0.0, F: 1.0 }
        }
      ];

      const results = validator.validateMultiple(configs);
      
      expect(results).toHaveLength(3);
      expect(results[0]!.valid).toBe(true);
      expect(results[1]!.valid).toBe(true);
      expect(results[2]!.valid).toBe(true);
    });

    it('should handle invalid configs in multiple validation', () => {
      const configs = [
        {
          id: 'valid',
          version: '1.0.0',
          falsity_point: 1.0,
          indeterminacy_point: 1.5,
          truth_point: 3.0
        },
        {
          id: 'invalid',
          version: '1.0.0',
          falsity_point: 'invalid', // Invalid type
          indeterminacy_point: 1.5,
          truth_point: 3.0
        }
      ];

      const results = validator.validateMultiple(configs);
      
      expect(results).toHaveLength(2);
      expect(results[0]!.valid).toBe(true);
      expect(results[1]!.valid).toBe(false);
      expect(results[1]!.error).toContain('Expected number');
    });
  });

  describe('Utility Methods', () => {
    it('should get available types', () => {
      const types = validator.getAvailableTypes();
      
      expect(types).toContain(MapperType.NUMERICAL);
      expect(types).toContain(MapperType.CATEGORICAL);
      expect(types).toContain(MapperType.BOOLEAN);
    });

    it('should check if type is supported', () => {
      expect(validator.isTypeSupported(MapperType.NUMERICAL)).toBe(true);
      expect(validator.isTypeSupported(MapperType.CATEGORICAL)).toBe(true);
      expect(validator.isTypeSupported(MapperType.BOOLEAN)).toBe(true);
      expect(validator.isTypeSupported('unknown')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty mappings in categorical mapper', () => {
      const config = {
        id: 'test',
        version: '1.0.0',
        mappings: {}
      };

      // Empty mappings should be valid (though not very useful)
      expect(() => validator.validate(config)).not.toThrow();
    });

    it('should handle optional properties', () => {
      const config = {
        id: 'test',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0,
        description: 'Optional description',
        metadata: { optional: true }
      };

      expect(() => validator.validate(config)).not.toThrow();
    });

    it('should handle clamp_to_range property', () => {
      const config = {
        id: 'test',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0,
        clamp_to_range: false
      };

      expect(() => validator.validate(config)).not.toThrow();
    });
  });
});
