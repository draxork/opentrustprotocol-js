/**
 * Tests for NumericalMapper
 */

import {
  NumericalMapper,
  MapperType,
  InputError,
  ValidationError
} from '../../src/mapper';

describe('NumericalMapper', () => {
  let mapper: NumericalMapper;

  beforeEach(() => {
    mapper = new NumericalMapper({
      id: 'test-numerical',
      version: '1.0.0',
      falsity_point: 1.0,
      indeterminacy_point: 1.5,
      truth_point: 3.0
    });
  });

  describe('Construction', () => {
    it('should create a valid NumericalMapper', () => {
      expect(mapper.mapper_type).toBe(MapperType.NUMERICAL);
      expect(mapper.parameters.id).toBe('test-numerical');
      expect(mapper.parameters.version).toBe('1.0.0');
    });

    it('should throw error for non-distinct points', () => {
      expect(() => {
        new NumericalMapper({
          id: 'invalid',
          version: '1.0.0',
          falsity_point: 1.0,
          indeterminacy_point: 1.0,
          truth_point: 1.0
        });
      }).toThrow(ValidationError);
    });
  });

  describe('Basic Mapping', () => {
    it('should map falsity point correctly', () => {
      const judgment = mapper.apply(1.0);
      expect(judgment.F).toBeCloseTo(1.0, 10);
      expect(judgment.I).toBeCloseTo(0.0, 10);
      expect(judgment.T).toBeCloseTo(0.0, 10);
    });

    it('should map indeterminacy point correctly', () => {
      const judgment = mapper.apply(1.5);
      expect(judgment.F).toBeCloseTo(0.0, 10);
      expect(judgment.I).toBeCloseTo(1.0, 10);
      expect(judgment.T).toBeCloseTo(0.0, 10);
    });

    it('should map truth point correctly', () => {
      const judgment = mapper.apply(3.0);
      expect(judgment.F).toBeCloseTo(0.0, 10);
      expect(judgment.I).toBeCloseTo(0.0, 10);
      expect(judgment.T).toBeCloseTo(1.0, 10);
    });
  });

  describe('Interpolation', () => {
    it('should interpolate between falsity and indeterminacy points', () => {
      const judgment = mapper.apply(1.25);
      expect(judgment.F).toBeCloseTo(0.5, 10);
      expect(judgment.I).toBeCloseTo(0.5, 10);
      expect(judgment.T).toBeCloseTo(0.0, 10);
    });

    it('should interpolate between indeterminacy and truth points', () => {
      const judgment = mapper.apply(2.25);
      expect(judgment.F).toBeCloseTo(0.0, 10);
      expect(judgment.I).toBeCloseTo(0.5, 10);
      expect(judgment.T).toBeCloseTo(0.5, 10);
    });
  });

  describe('Conservation Constraint', () => {
    it('should maintain conservation constraint T + I + F = 1.0', () => {
      const testValues = [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0];
      
      for (const value of testValues) {
        const judgment = mapper.apply(value);
        const total = judgment.T + judgment.I + judgment.F;
        expect(total).toBeCloseTo(1.0, 10);
      }
    });
  });

  describe('Range Handling', () => {
    it('should clamp values when clamp_to_range is true (default)', () => {
      const lowJudgment = mapper.apply(0.5);
      const highJudgment = mapper.apply(4.0);
      
      // Both should be clamped to the range [1.0, 3.0]
      // Note: The provenance chain will be different, so we only check T, I, F values
      const lowExpected = mapper.apply(1.0);
      const highExpected = mapper.apply(3.0);
      
      expect(lowJudgment.T).toBe(lowExpected.T);
      expect(lowJudgment.I).toBe(lowExpected.I);
      expect(lowJudgment.F).toBe(lowExpected.F);
      
      expect(highJudgment.T).toBe(highExpected.T);
      expect(highJudgment.I).toBe(highExpected.I);
      expect(highJudgment.F).toBe(highExpected.F);
    });

    it('should throw error when clamp_to_range is false and value is out of range', () => {
      const noClampMapper = new NumericalMapper({
        id: 'no-clamp',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0,
        clamp_to_range: false
      });

      expect(() => noClampMapper.apply(0.5)).toThrow(InputError);
      expect(() => noClampMapper.apply(4.0)).toThrow(InputError);
    });
  });

  describe('Input Validation', () => {
    it('should throw error for non-numeric input', () => {
      expect(() => mapper.apply('invalid' as any)).toThrow(InputError);
      expect(() => mapper.apply(null as any)).toThrow(InputError);
      expect(() => mapper.apply(undefined as any)).toThrow(InputError);
    });
  });

  describe('Provenance Chain', () => {
    it('should create provenance entry', () => {
      const judgment = mapper.apply(2.0);
      expect(judgment.provenance_chain).toHaveLength(1);
      
      const provenance = judgment.provenance_chain[0]!;
      expect(provenance.source_id).toBe('test-numerical');
      expect(provenance.metadata?.['mapper_type']).toBe(MapperType.NUMERICAL);
    });
  });

  describe('Edge Cases', () => {
    it('should handle reverse order points', () => {
      const reverseMapper = new NumericalMapper({
        id: 'reverse',
        version: '1.0.0',
        falsity_point: 3.0,
        indeterminacy_point: 1.5,
        truth_point: 1.0
      });

      const judgment = reverseMapper.apply(2.0);
      const total = judgment.T + judgment.I + judgment.F;
      expect(total).toBeCloseTo(1.0, 10);
    });

    it('should handle negative points', () => {
      const negativeMapper = new NumericalMapper({
        id: 'negative',
        version: '1.0.0',
        falsity_point: -1.0,
        indeterminacy_point: 0.0,
        truth_point: 1.0
      });

      const judgment = negativeMapper.apply(0.0);
      expect(judgment.I).toBeCloseTo(1.0, 10);
    });
  });

  describe('Real-world Examples', () => {
    it('should work with DeFi health factor', () => {
      const healthMapper = new NumericalMapper({
        id: 'defi-health-factor',
        version: '1.0.0',
        falsity_point: 1.0,    // Liquidación
        indeterminacy_point: 1.5,  // Riesgo
        truth_point: 3.0       // Seguro
      });

      // Health factor 1.8 should be risky but not liquidating
      const judgment = healthMapper.apply(1.8);
      expect(judgment.I).toBeGreaterThan(judgment.T);
      expect(judgment.F).toBeLessThan(0.5);
      expect(judgment.T + judgment.I + judgment.F).toBeCloseTo(1.0, 10);
    });

    it('should work with temperature monitoring', () => {
      const tempMapper = new NumericalMapper({
        id: 'server-room-temp',
        version: '1.0.0',
        falsity_point: 35.0,   // Too hot
        indeterminacy_point: 22.0,  // Optimal
        truth_point: 18.0      // Too cold
      });

      // Room temperature 25°C should be warm but not critical
      const judgment = tempMapper.apply(25.0);
      expect(judgment.I).toBeGreaterThan(judgment.T);
      expect(judgment.F).toBeGreaterThan(judgment.T);
      expect(judgment.T + judgment.I + judgment.F).toBeCloseTo(1.0, 10);
    });
  });
});
