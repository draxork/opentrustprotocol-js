import { NeutrosophicJudgment } from '../src/judgment';
import { 
  conflict_aware_weighted_average, 
  optimistic_fusion, 
  pessimistic_fusion 
} from '../src/fusion';

describe('Fusion Operators', () => {
  const createJudgment = (T: number, I: number, F: number, sourceId: string = 'test'): NeutrosophicJudgment => {
    return new NeutrosophicJudgment(T, I, F, [
      {
        source_id: sourceId,
        timestamp: '2025-09-20T20:30:00Z',
        description: `Test judgment: T=${T}, I=${I}, F=${F}`
      }
    ]);
  };

  describe('conflict_aware_weighted_average', () => {
    it('should fuse two judgments correctly', () => {
      const judgments = [
        createJudgment(0.8, 0.2, 0.0, 'source1'),
        createJudgment(0.6, 0.3, 0.1, 'source2')
      ];
      const weights = [0.6, 0.4];

      const result = conflict_aware_weighted_average(judgments, weights);

      expect(result.T).toBeCloseTo(0.72, 2);
      expect(result.I).toBeCloseTo(0.24, 2);
      expect(result.F).toBeCloseTo(0.04, 2);
      expect(result.T + result.I + result.F).toBeLessThanOrEqual(1.0);
    });

    it('should handle high conflict scenario', () => {
      const judgments = [
        createJudgment(0.9, 0.1, 0.0, 'conflicted'),  // Fixed: T + I + F = 1.0
        createJudgment(0.7, 0.2, 0.1, 'reliable')
      ];
      const weights = [0.5, 0.5];

      const result = conflict_aware_weighted_average(judgments, weights);

      expect(result.T).toBeCloseTo(0.8, 2);
      expect(result.I).toBeCloseTo(0.15, 2);
      expect(result.F).toBeCloseTo(0.05, 2);
      expect(result.T + result.I + result.F).toBeLessThanOrEqual(1.0);
    });

    it('should handle single judgment', () => {
      const judgments = [createJudgment(0.8, 0.2, 0.0)];
      const weights = [1.0];

      const result = conflict_aware_weighted_average(judgments, weights);

      expect(result.T).toBe(0.8);
      expect(result.I).toBe(0.2);
      expect(result.F).toBe(0.0);
    });

    it('should fallback to unweighted average when all weights are zero', () => {
      const judgments = [
        createJudgment(0.9, 0.1, 0.0, 'source1'),  // Fixed: T + I + F = 1.0
        createJudgment(0.8, 0.2, 0.0, 'source2')   // Fixed: T + I + F = 1.0
      ];
      const weights = [0.0, 0.0];

      const result = conflict_aware_weighted_average(judgments, weights);

      expect(result.T).toBeCloseTo(0.85, 2);
      expect(result.I).toBeCloseTo(0.15, 2);
      expect(result.F).toBeCloseTo(0.0, 2);
    });

    it('should throw error for empty judgments', () => {
      expect(() => {
        conflict_aware_weighted_average([], []);
      }).toThrow('Judgments list cannot be empty');
    });

    it('should throw error for mismatched weights', () => {
      const judgments = [createJudgment(0.8, 0.2, 0.0)];
      const weights = [0.5, 0.5];

      expect(() => {
        conflict_aware_weighted_average(judgments, weights);
      }).toThrow('Judgments list and weights list must have the same length');
    });

    it('should add provenance entry for fusion operation', () => {
      const judgments = [createJudgment(0.8, 0.2, 0.0)];
      const weights = [1.0];

      const result = conflict_aware_weighted_average(judgments, weights);

      expect(result.provenance_chain.length).toBe(2); // Original + fusion entry
      const fusionEntry = result.provenance_chain[1]!;
      expect(fusionEntry.source_id).toBe('otp-cawa-v1.1');
      expect(fusionEntry.metadata?.['operator']).toBe('conflict_aware_weighted_average');
    });
  });

  describe('optimistic_fusion', () => {
    it('should take maximum T and minimum F', () => {
      const judgments = [
        createJudgment(0.7, 0.2, 0.1, 'source1'),
        createJudgment(0.9, 0.1, 0.0, 'source2'),
        createJudgment(0.6, 0.4, 0.0, 'source3')  // Fixed: ensure conservation constraint
      ];

      const result = optimistic_fusion(judgments);

      // After scaling, the values should maintain proportional relationships
      expect(result.T).toBeGreaterThan(0.7); // scaled max T
      expect(result.F).toBe(0.0); // min F
      expect(result.I).toBeGreaterThan(0.1); // scaled average I
      expect(result.T + result.I + result.F).toBeLessThanOrEqual(1.0);
    });

    it('should handle single judgment', () => {
      const judgments = [createJudgment(0.8, 0.2, 0.0)];

      const result = optimistic_fusion(judgments);

      expect(result.T).toBe(0.8);
      expect(result.I).toBe(0.2);
      expect(result.F).toBe(0.0);
    });

    it('should add provenance entry for fusion operation', () => {
      const judgments = [createJudgment(0.8, 0.2, 0.0)];

      const result = optimistic_fusion(judgments);

      expect(result.provenance_chain.length).toBe(2);
      const fusionEntry = result.provenance_chain[1]!;
      expect(fusionEntry.source_id).toBe('otp-optimistic-v1.1');
    });

    it('should throw error for empty judgments', () => {
      expect(() => {
        optimistic_fusion([]);
      }).toThrow('Judgments list cannot be empty');
    });
  });

  describe('pessimistic_fusion', () => {
    it('should take minimum T and maximum F', () => {
      const judgments = [
        createJudgment(0.7, 0.2, 0.1, 'source1'),
        createJudgment(0.9, 0.1, 0.0, 'source2'),
        createJudgment(0.6, 0.2, 0.2, 'source3')  // Fixed: T + I + F = 1.0
      ];

      const result = pessimistic_fusion(judgments);

      expect(result.T).toBe(0.6); // min T
      expect(result.F).toBe(0.2); // max F
      expect(result.I).toBeCloseTo(0.167, 2); // average I
    });

    it('should handle single judgment', () => {
      const judgments = [createJudgment(0.8, 0.2, 0.0)];

      const result = pessimistic_fusion(judgments);

      expect(result.T).toBe(0.8);
      expect(result.I).toBe(0.2);
      expect(result.F).toBe(0.0);
    });

    it('should add provenance entry for fusion operation', () => {
      const judgments = [createJudgment(0.8, 0.2, 0.0)];

      const result = pessimistic_fusion(judgments);

      expect(result.provenance_chain.length).toBe(2);
      const fusionEntry = result.provenance_chain[1]!;
      expect(fusionEntry.source_id).toBe('otp-pessimistic-v1.1');
    });

    it('should throw error for empty judgments', () => {
      expect(() => {
        pessimistic_fusion([]);
      }).toThrow('Judgments list cannot be empty');
    });
  });

  describe('Input Validation', () => {
    it('should throw error for non-Judgment objects', () => {
      const invalidJudgments = [
        { T: 0.8, I: 0.2, F: 0.0 } as any,
        createJudgment(0.6, 0.3, 0.1)
      ];

      expect(() => {
        conflict_aware_weighted_average(invalidJudgments, [0.5, 0.5]);
      }).toThrow('All items in the judgments list must be of type NeutrosophicJudgment');
    });

    it('should throw error for non-numeric weights', () => {
      const judgments = [createJudgment(0.8, 0.2, 0.0)];
      const invalidWeights = ['0.5' as any];

      expect(() => {
        conflict_aware_weighted_average(judgments, invalidWeights);
      }).toThrow('All weights must be numeric');
    });
  });
});
