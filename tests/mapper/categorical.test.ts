/**
 * Tests for CategoricalMapper
 */

import {
  CategoricalMapper,
  MapperType,
  InputError,
  ValidationError
} from '../../src/mapper';

describe('CategoricalMapper', () => {
  let mapper: CategoricalMapper;

  beforeEach(() => {
    mapper = new CategoricalMapper({
      id: 'test-categorical',
      version: '1.0.0',
      mappings: {
        'VERIFIED': { T: 1.0, I: 0.0, F: 0.0 },
        'PENDING': { T: 0.0, I: 1.0, F: 0.0 },
        'REJECTED': { T: 0.0, I: 0.0, F: 1.0 },
        'PARTIAL': { T: 0.6, I: 0.3, F: 0.1 }
      },
      default_judgment: { T: 0.0, I: 0.0, F: 1.0 }
    });
  });

  describe('Construction', () => {
    it('should create a valid CategoricalMapper', () => {
      expect(mapper.mapper_type).toBe(MapperType.CATEGORICAL);
      expect(mapper.parameters.id).toBe('test-categorical');
      expect(mapper.parameters.version).toBe('1.0.0');
    });

    it('should throw error for invalid judgment values', () => {
      expect(() => {
        new CategoricalMapper({
          id: 'invalid',
          version: '1.0.0',
          mappings: {
            'INVALID': { T: 1.5, I: 0.0, F: 0.0 } // T > 1.0
          }
        });
      }).toThrow(ValidationError);
    });

    it('should throw error for conservation constraint violation', () => {
      expect(() => {
        new CategoricalMapper({
          id: 'invalid',
          version: '1.0.0',
          mappings: {
            'INVALID': { T: 0.5, I: 0.5, F: 0.3 } // T + I + F > 1.0
          }
        });
      }).toThrow(ValidationError);
    });
  });

  describe('Basic Mapping', () => {
    it('should map VERIFIED correctly', () => {
      const judgment = mapper.apply('VERIFIED');
      expect(judgment.T).toBe(1.0);
      expect(judgment.I).toBe(0.0);
      expect(judgment.F).toBe(0.0);
    });

    it('should map PENDING correctly', () => {
      const judgment = mapper.apply('PENDING');
      expect(judgment.T).toBe(0.0);
      expect(judgment.I).toBe(1.0);
      expect(judgment.F).toBe(0.0);
    });

    it('should map REJECTED correctly', () => {
      const judgment = mapper.apply('REJECTED');
      expect(judgment.T).toBe(0.0);
      expect(judgment.I).toBe(0.0);
      expect(judgment.F).toBe(1.0);
    });

    it('should map PARTIAL correctly', () => {
      const judgment = mapper.apply('PARTIAL');
      expect(judgment.T).toBe(0.6);
      expect(judgment.I).toBe(0.3);
      expect(judgment.F).toBe(0.1);
    });
  });

  describe('Default Judgment', () => {
    it('should use default judgment for unknown category', () => {
      const judgment = mapper.apply('UNKNOWN');
      expect(judgment.T).toBe(0.0);
      expect(judgment.I).toBe(0.0);
      expect(judgment.F).toBe(1.0);
    });

    it('should throw error when no default and category not found', () => {
      const noDefaultMapper = new CategoricalMapper({
        id: 'no-default',
        version: '1.0.0',
        mappings: {
          'KNOWN': { T: 1.0, I: 0.0, F: 0.0 }
        }
        // No default_judgment
      });

      expect(() => noDefaultMapper.apply('UNKNOWN')).toThrow(InputError);
    });
  });

  describe('Input Validation', () => {
    it('should throw error for non-string input', () => {
      expect(() => mapper.apply(123 as any)).toThrow(InputError);
      expect(() => mapper.apply(null as any)).toThrow(InputError);
      expect(() => mapper.apply(undefined as any)).toThrow(InputError);
      expect(() => mapper.apply(true as any)).toThrow(InputError);
    });
  });

  describe('Provenance Chain', () => {
    it('should create provenance entry', () => {
      const judgment = mapper.apply('VERIFIED');
      expect(judgment.provenance_chain).toHaveLength(1);
      
      const provenance = judgment.provenance_chain[0]!;
      expect(provenance.source_id).toBe('test-categorical');
      expect(provenance.metadata?.['mapper_type']).toBe(MapperType.CATEGORICAL);
    });
  });

  describe('Utility Methods', () => {
    it('should get all categories', () => {
      const categories = mapper.getCategories();
      expect(categories).toContain('VERIFIED');
      expect(categories).toContain('PENDING');
      expect(categories).toContain('REJECTED');
      expect(categories).toContain('PARTIAL');
      expect(categories).toHaveLength(4);
    });

    it('should check if category exists', () => {
      expect(mapper.hasCategory('VERIFIED')).toBe(true);
      expect(mapper.hasCategory('UNKNOWN')).toBe(false);
    });

    it('should get judgment for category', () => {
      const judgment = mapper.getJudgmentForCategory('VERIFIED');
      expect(judgment).toEqual({ T: 1.0, I: 0.0, F: 0.0 });
      
      const unknownJudgment = mapper.getJudgmentForCategory('UNKNOWN');
      expect(unknownJudgment).toBeUndefined();
    });
  });

  describe('Dynamic Operations', () => {
    it('should add new category', () => {
      mapper.addCategory('NEW_STATUS', { T: 0.8, I: 0.2, F: 0.0 });
      
      expect(mapper.hasCategory('NEW_STATUS')).toBe(true);
      
      const judgment = mapper.apply('NEW_STATUS');
      expect(judgment.T).toBe(0.8);
      expect(judgment.I).toBe(0.2);
      expect(judgment.F).toBe(0.0);
    });

    it('should throw error when adding invalid category', () => {
      expect(() => {
        mapper.addCategory('INVALID', { T: 1.5, I: 0.0, F: 0.0 });
      }).toThrow(ValidationError);
    });

    it('should remove category', () => {
      expect(mapper.hasCategory('PARTIAL')).toBe(true);
      
      const removed = mapper.removeCategory('PARTIAL');
      expect(removed).toBe(true);
      expect(mapper.hasCategory('PARTIAL')).toBe(false);
      
      const notRemoved = mapper.removeCategory('NONEXISTENT');
      expect(notRemoved).toBe(false);
    });

    it('should update default judgment', () => {
      mapper.setDefaultJudgment({ T: 0.5, I: 0.5, F: 0.0 });
      
      const judgment = mapper.apply('UNKNOWN');
      expect(judgment.T).toBe(0.5);
      expect(judgment.I).toBe(0.5);
      expect(judgment.F).toBe(0.0);
    });

    it('should clear default judgment', () => {
      mapper.clearDefaultJudgment();
      
      expect(() => mapper.apply('UNKNOWN')).toThrow(InputError);
    });
  });

  describe('Real-world Examples', () => {
    it('should work with KYC status', () => {
      const kycMapper = new CategoricalMapper({
        id: 'kyc-status',
        version: '1.0.0',
        mappings: {
          'VERIFIED': { T: 1.0, I: 0.0, F: 0.0 },
          'PENDING': { T: 0.0, I: 1.0, F: 0.0 },
          'REJECTED': { T: 0.0, I: 0.0, F: 1.0 },
          'PARTIAL': { T: 0.6, I: 0.3, F: 0.1 },
          'EXPIRED': { T: 0.2, I: 0.6, F: 0.2 }
        },
        default_judgment: { T: 0.0, I: 0.0, F: 1.0 }
      });

      // Test different KYC statuses
      const verified = kycMapper.apply('VERIFIED');
      expect(verified.T).toBe(1.0);
      
      const pending = kycMapper.apply('PENDING');
      expect(pending.I).toBe(1.0);
      
      const expired = kycMapper.apply('EXPIRED');
      expect(expired.I).toBeGreaterThan(expired.T);
      expect(expired.I).toBeGreaterThan(expired.F);
    });

    it('should work with product status', () => {
      const productMapper = new CategoricalMapper({
        id: 'product-status',
        version: '1.0.0',
        mappings: {
          'AVAILABLE': { T: 1.0, I: 0.0, F: 0.0 },
          'LOW_STOCK': { T: 0.7, I: 0.3, F: 0.0 },
          'OUT_OF_STOCK': { T: 0.0, I: 0.0, F: 1.0 },
          'DISCONTINUED': { T: 0.0, I: 0.0, F: 1.0 }
        },
        default_judgment: { T: 0.0, I: 1.0, F: 0.0 }
      });

      // Test different product statuses
      const available = productMapper.apply('AVAILABLE');
      expect(available.T).toBe(1.0);
      
      const lowStock = productMapper.apply('LOW_STOCK');
      expect(lowStock.T).toBeGreaterThan(lowStock.I);
      
      const unknown = productMapper.apply('UNKNOWN_STATUS');
      expect(unknown.I).toBe(1.0); // Uses default judgment
    });
  });
});
