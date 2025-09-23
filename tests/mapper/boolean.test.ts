/**
 * Tests for BooleanMapper
 */

import {
  BooleanMapper,
  MapperType,
  InputError,
  ValidationError
} from '../../src/mapper';

describe('BooleanMapper', () => {
  let mapper: BooleanMapper;

  beforeEach(() => {
    mapper = new BooleanMapper({
      id: 'test-boolean',
      version: '1.0.0',
      true_map: { T: 0.9, I: 0.1, F: 0.0 },
      false_map: { T: 0.0, I: 0.0, F: 1.0 }
    });
  });

  describe('Construction', () => {
    it('should create a valid BooleanMapper', () => {
      expect(mapper.mapper_type).toBe(MapperType.BOOLEAN);
      expect(mapper.parameters.id).toBe('test-boolean');
      expect(mapper.parameters.version).toBe('1.0.0');
    });

    it('should throw error for invalid true_map', () => {
      expect(() => {
        new BooleanMapper({
          id: 'invalid',
          version: '1.0.0',
          true_map: { T: 1.5, I: 0.0, F: 0.0 }, // T > 1.0
          false_map: { T: 0.0, I: 0.0, F: 1.0 }
        });
      }).toThrow(ValidationError);
    });

    it('should throw error for invalid false_map', () => {
      expect(() => {
        new BooleanMapper({
          id: 'invalid',
          version: '1.0.0',
          true_map: { T: 1.0, I: 0.0, F: 0.0 },
          false_map: { T: 0.5, I: 0.5, F: 0.3 } // T + I + F > 1.0
        });
      }).toThrow(ValidationError);
    });
  });

  describe('Boolean Input', () => {
    it('should map true correctly', () => {
      const judgment = mapper.apply(true);
      expect(judgment.T).toBe(0.9);
      expect(judgment.I).toBe(0.1);
      expect(judgment.F).toBe(0.0);
    });

    it('should map false correctly', () => {
      const judgment = mapper.apply(false);
      expect(judgment.T).toBe(0.0);
      expect(judgment.I).toBe(0.0);
      expect(judgment.F).toBe(1.0);
    });
  });

  describe('Numeric Input', () => {
    it('should map 1 as true', () => {
      const judgment = mapper.apply(1);
      expect(judgment.T).toBe(0.9);
      expect(judgment.I).toBe(0.1);
      expect(judgment.F).toBe(0.0);
    });

    it('should map 0 as false', () => {
      const judgment = mapper.apply(0);
      expect(judgment.T).toBe(0.0);
      expect(judgment.I).toBe(0.0);
      expect(judgment.F).toBe(1.0);
    });

    it('should throw error for invalid numeric input', () => {
      expect(() => mapper.apply(2)).toThrow(InputError);
      expect(() => mapper.apply(-1)).toThrow(InputError);
      expect(() => mapper.apply(0.5)).toThrow(InputError);
    });
  });

  describe('String Input', () => {
    it('should map valid true strings', () => {
      const trueStrings = ['true', 'TRUE', 'yes', 'YES', '1', 'on', 'ON', 'enabled', 'ENABLED'];
      
      for (const str of trueStrings) {
        const judgment = mapper.apply(str);
        expect(judgment.T).toBe(0.9);
        expect(judgment.I).toBe(0.1);
        expect(judgment.F).toBe(0.0);
      }
    });

    it('should map valid false strings', () => {
      const falseStrings = ['false', 'FALSE', 'no', 'NO', '0', 'off', 'OFF', 'disabled', 'DISABLED'];
      
      for (const str of falseStrings) {
        const judgment = mapper.apply(str);
        expect(judgment.T).toBe(0.0);
        expect(judgment.I).toBe(0.0);
        expect(judgment.F).toBe(1.0);
      }
    });

    it('should throw error for invalid string input', () => {
      expect(() => mapper.apply('maybe')).toThrow(InputError);
      expect(() => mapper.apply('invalid')).toThrow(InputError);
      expect(() => mapper.apply('')).toThrow(InputError);
    });
  });

  describe('Input Validation', () => {
    it('should throw error for invalid input types', () => {
      expect(() => mapper.apply(null as any)).toThrow(InputError);
      expect(() => mapper.apply(undefined as any)).toThrow(InputError);
      expect(() => mapper.apply({} as any)).toThrow(InputError);
      expect(() => mapper.apply([] as any)).toThrow(InputError);
    });
  });

  describe('Provenance Chain', () => {
    it('should create provenance entry', () => {
      const judgment = mapper.apply(true);
      expect(judgment.provenance_chain).toHaveLength(1);
      
      const provenance = judgment.provenance_chain[0]!;
      expect(provenance.source_id).toBe('test-boolean');
      expect(provenance.metadata?.['mapper_type']).toBe(MapperType.BOOLEAN);
      expect(provenance.metadata?.['original_input']?.['normalized']).toBe('true');
    });
  });

  describe('Utility Methods', () => {
    it('should get true and false judgments', () => {
      const trueJudgment = mapper.getTrueJudgment();
      expect(trueJudgment).toEqual({ T: 0.9, I: 0.1, F: 0.0 });
      
      const falseJudgment = mapper.getFalseJudgment();
      expect(falseJudgment).toEqual({ T: 0.0, I: 0.0, F: 1.0 });
    });

    it('should update true judgment', () => {
      mapper.setTrueJudgment({ T: 1.0, I: 0.0, F: 0.0 });
      
      const judgment = mapper.apply(true);
      expect(judgment.T).toBe(1.0);
      expect(judgment.I).toBe(0.0);
      expect(judgment.F).toBe(0.0);
    });

    it('should update false judgment', () => {
      mapper.setFalseJudgment({ T: 0.0, I: 0.5, F: 0.5 });
      
      const judgment = mapper.apply(false);
      expect(judgment.T).toBe(0.0);
      expect(judgment.I).toBe(0.5);
      expect(judgment.F).toBe(0.5);
    });

    it('should throw error when setting invalid judgments', () => {
      expect(() => {
        mapper.setTrueJudgment({ T: 1.5, I: 0.0, F: 0.0 });
      }).toThrow(ValidationError);
      
      expect(() => {
        mapper.setFalseJudgment({ T: 0.5, I: 0.5, F: 0.3 });
      }).toThrow(ValidationError);
    });
  });

  describe('Normalization', () => {
    it('should check if input can be normalized', () => {
      expect(mapper.canNormalize(true)).toBe(true);
      expect(mapper.canNormalize(false)).toBe(true);
      expect(mapper.canNormalize(1)).toBe(true);
      expect(mapper.canNormalize(0)).toBe(true);
      expect(mapper.canNormalize('true')).toBe(true);
      expect(mapper.canNormalize('false')).toBe(true);
      
      expect(mapper.canNormalize('maybe')).toBe(false);
      expect(mapper.canNormalize(2)).toBe(false);
      expect(mapper.canNormalize(null)).toBe(false);
    });

    it('should normalize input correctly', () => {
      expect(mapper.normalize(true)).toBe(true);
      expect(mapper.normalize(false)).toBe(false);
      expect(mapper.normalize(1)).toBe(true);
      expect(mapper.normalize(0)).toBe(false);
      expect(mapper.normalize('true')).toBe(true);
      expect(mapper.normalize('false')).toBe(false);
    });

    it('should get supported strings', () => {
      const supported = mapper.getSupportedStrings();
      
      expect(supported.true).toContain('true');
      expect(supported.true).toContain('yes');
      expect(supported.true).toContain('1');
      expect(supported.true).toContain('on');
      expect(supported.true).toContain('enabled');
      
      expect(supported.false).toContain('false');
      expect(supported.false).toContain('no');
      expect(supported.false).toContain('0');
      expect(supported.false).toContain('off');
      expect(supported.false).toContain('disabled');
    });
  });

  describe('Static Factory Methods', () => {
    it('should create standard trust mapper', () => {
      const trustMapper = BooleanMapper.createStandardTrustMapper('trust-test');
      
      const trueJudgment = trustMapper.apply(true);
      expect(trueJudgment.T).toBe(1.0);
      expect(trueJudgment.I).toBe(0.0);
      expect(trueJudgment.F).toBe(0.0);
      
      const falseJudgment = trustMapper.apply(false);
      expect(falseJudgment.T).toBe(0.0);
      expect(falseJudgment.I).toBe(0.0);
      expect(falseJudgment.F).toBe(1.0);
    });

    it('should create security mapper', () => {
      const securityMapper = BooleanMapper.createSecurityMapper('security-test');
      
      const trueJudgment = securityMapper.apply(true);
      expect(trueJudgment.T).toBe(0.9);
      expect(trueJudgment.I).toBe(0.1);
      expect(trueJudgment.F).toBe(0.0);
      
      const falseJudgment = securityMapper.apply(false);
      expect(falseJudgment.T).toBe(0.0);
      expect(falseJudgment.I).toBe(0.0);
      expect(falseJudgment.F).toBe(1.0);
    });

    it('should create conservative mapper', () => {
      const conservativeMapper = BooleanMapper.createConservativeMapper('conservative-test');
      
      const trueJudgment = conservativeMapper.apply(true);
      expect(trueJudgment.T).toBe(0.7);
      expect(trueJudgment.I).toBe(0.3);
      expect(trueJudgment.F).toBe(0.0);
      
      const falseJudgment = conservativeMapper.apply(false);
      expect(falseJudgment.T).toBe(0.0);
      expect(falseJudgment.I).toBe(0.2);
      expect(falseJudgment.F).toBe(0.8);
    });
  });

  describe('Real-world Examples', () => {
    it('should work with SSL certificate validation', () => {
      const sslMapper = new BooleanMapper({
        id: 'ssl-certificate',
        version: '1.0.0',
        true_map: { T: 0.9, I: 0.1, F: 0.0 },  // Valid certificate
        false_map: { T: 0.0, I: 0.0, F: 1.0 }  // Invalid certificate
      });

      // Test different SSL states
      const validSSL = sslMapper.apply(true);
      expect(validSSL.T).toBeGreaterThan(validSSL.I);
      expect(validSSL.F).toBe(0.0);
      
      const invalidSSL = sslMapper.apply(false);
      expect(invalidSSL.F).toBe(1.0);
      expect(invalidSSL.T).toBe(0.0);
      
      const stringValid = sslMapper.apply('true');
      expect(stringValid.T).toBe(0.9);
      
      const stringInvalid = sslMapper.apply('false');
      expect(stringInvalid.F).toBe(1.0);
    });

    it('should work with feature flags', () => {
      const featureMapper = new BooleanMapper({
        id: 'feature-flag',
        version: '1.0.0',
        true_map: { T: 1.0, I: 0.0, F: 0.0 },  // Feature enabled
        false_map: { T: 0.0, I: 0.0, F: 1.0 }  // Feature disabled
      });

      // Test feature flag states
      const enabled = featureMapper.apply('enabled');
      expect(enabled.T).toBe(1.0);
      
      const disabled = featureMapper.apply('disabled');
      expect(disabled.F).toBe(1.0);
      
      const numericEnabled = featureMapper.apply(1);
      expect(numericEnabled.T).toBe(1.0);
      
      const numericDisabled = featureMapper.apply(0);
      expect(numericDisabled.F).toBe(1.0);
    });

    it('should work with user permissions', () => {
      const permissionMapper = BooleanMapper.createConservativeMapper('user-permission');
      
      // Test permission states
      const hasPermission = permissionMapper.apply(true);
      expect(hasPermission.T).toBeGreaterThan(hasPermission.I);
      
      const noPermission = permissionMapper.apply(false);
      expect(noPermission.F).toBeGreaterThan(noPermission.I);
      expect(noPermission.I).toBeGreaterThan(0); // Some uncertainty even when denied
    });
  });
});
