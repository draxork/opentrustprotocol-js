/**
 * Tests for the judgment-id module - Judgment ID System for Circle of Trust
 */

import {
  NeutrosophicJudgment,
  generateJudgmentId,
  ensureJudgmentId,
  createOutcomeJudgment,
  OutcomeType
} from '../src/index';

describe('Judgment ID System', () => {
  let testJudgment: NeutrosophicJudgment;

  beforeEach(() => {
    testJudgment = new NeutrosophicJudgment(
      0.8, 0.2, 0.0,
      [{ source_id: 'test-sensor', timestamp: '2023-01-01T00:00:00Z' }]
    );
  });

  describe('generateJudgmentId', () => {
    it('should generate a valid SHA-256 hash', () => {
      const judgmentId = generateJudgmentId(testJudgment);
      
      // Should be a valid SHA-256 hash (64 hex characters)
      expect(judgmentId).toHaveLength(64);
      expect(judgmentId).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate identical IDs for identical judgments', () => {
      const judgment1 = new NeutrosophicJudgment(
        0.8, 0.2, 0.0,
        [{ source_id: 'sensor1', timestamp: '2023-01-01T00:00:00Z' }]
      );
      
      const judgment2 = new NeutrosophicJudgment(
        0.8, 0.2, 0.0,
        [{ source_id: 'sensor1', timestamp: '2023-01-01T00:00:00Z' }]
      );
      
      const id1 = generateJudgmentId(judgment1);
      const id2 = generateJudgmentId(judgment2);
      
      // Should be identical for identical judgments
      expect(id1).toBe(id2);
    });

    it('should generate different IDs for different judgments', () => {
      const judgment1 = new NeutrosophicJudgment(
        0.8, 0.2, 0.0,
        [{ source_id: 'sensor1', timestamp: '2023-01-01T00:00:00Z' }]
      );
      
      const judgment2 = new NeutrosophicJudgment(
        0.7, 0.3, 0.0,
        [{ source_id: 'sensor1', timestamp: '2023-01-01T00:00:00Z' }]
      );
      
      const id1 = generateJudgmentId(judgment1);
      const id2 = generateJudgmentId(judgment2);
      
      // Should be different for different judgments
      expect(id1).not.toBe(id2);
    });
  });

  describe('ensureJudgmentId', () => {
    it('should add judgment_id to judgment without one', () => {
      const judgment = new NeutrosophicJudgment(
        0.8, 0.2, 0.0,
        [{ source_id: 'sensor1', timestamp: '2023-01-01T00:00:00Z' }]
      );
      
      // Should not have judgment_id initially
      const hasJudgmentId = judgment.provenance_chain.some(entry => (entry as any).judgment_id);
      expect(hasJudgmentId).toBe(false);
      
      const judgmentWithId = ensureJudgmentId(judgment);
      
      // Should have judgment_id after ensuring
      const hasJudgmentIdAfter = judgmentWithId.provenance_chain.some(entry => (entry as any).judgment_id);
      expect(hasJudgmentIdAfter).toBe(true);
      
      // Extract the judgment_id
      let judgmentId: string | null = null;
      for (const entry of judgmentWithId.provenance_chain) {
        if ((entry as any).judgment_id) {
          judgmentId = (entry as any).judgment_id;
          break;
        }
      }
      
      expect(judgmentId).toBeTruthy();
      expect(judgmentId).toHaveLength(64);
    });

    it('should return same judgment if it already has judgment_id', () => {
      // Create judgment with existing judgment_id
      const judgmentWithExistingId = new NeutrosophicJudgment(
        0.8, 0.2, 0.0,
        [
          { source_id: 'sensor1', timestamp: '2023-01-01T00:00:00Z' },
          { source_id: 'otp-judgment-id-generator', timestamp: '2023-01-01T00:00:01Z', judgment_id: 'existing_id' } as any
        ]
      );
      
      const result = ensureJudgmentId(judgmentWithExistingId);
      
      // Should return the same judgment without modification
      expect(result).toBe(judgmentWithExistingId);
    });
  });

  describe('createOutcomeJudgment', () => {
    it('should create a valid outcome judgment', () => {
      const outcome = createOutcomeJudgment(
        'original_judgment_id',
        1.0, 0.0, 0.0,
        OutcomeType.SUCCESS,
        'test-oracle'
      );
      
      expect(outcome.links_to_judgment_id).toBe('original_judgment_id');
      expect(outcome.T).toBe(1.0);
      expect(outcome.I).toBe(0.0);
      expect(outcome.F).toBe(0.0);
      expect(outcome.outcome_type).toBe(OutcomeType.SUCCESS);
      expect(outcome.oracle_source).toBe('test-oracle');
      expect(outcome.judgment_id).toBeTruthy();
      expect(outcome.judgment_id).toHaveLength(64);
    });

    it('should validate outcome judgment parameters', () => {
      // Test invalid T value
      expect(() => {
        createOutcomeJudgment(
          'original_judgment_id',
          1.5, 0.0, 0.0,  // Invalid T > 1.0
          OutcomeType.SUCCESS,
          'test-oracle'
        );
      }).toThrow('T value must be between 0 and 1');
    });

    it('should validate conservation constraint', () => {
      // Test conservation constraint violation
      expect(() => {
        createOutcomeJudgment(
          'original_judgment_id',
          0.8, 0.3, 0.3,  // T + I + F = 1.4 > 1.0
          OutcomeType.SUCCESS,
          'test-oracle'
        );
      }).toThrow('Conservation constraint violated');
    });
  });

  describe('OutcomeType enum', () => {
    it('should have correct enum values', () => {
      expect(OutcomeType.SUCCESS).toBe('success');
      expect(OutcomeType.FAILURE).toBe('failure');
      expect(OutcomeType.PARTIAL).toBe('partial');
    });
  });
});

describe('Fusion Operators with Judgment ID', () => {
  let judgment1: NeutrosophicJudgment;
  let judgment2: NeutrosophicJudgment;

  beforeEach(() => {
    judgment1 = new NeutrosophicJudgment(
      0.8, 0.2, 0.0,
      [{ source_id: 'sensor1', timestamp: '2023-01-01T00:00:00Z' }]
    );
    judgment2 = new NeutrosophicJudgment(
      0.6, 0.3, 0.1,
      [{ source_id: 'sensor2', timestamp: '2023-01-01T00:00:01Z' }]
    );
  });

  describe('conflict_aware_weighted_average', () => {
    it('should generate judgment_id', () => {
      const { conflict_aware_weighted_average } = require('../src/index');
      
      const fused = conflict_aware_weighted_average([judgment1, judgment2], [0.6, 0.4]);
      
      // Should have judgment_id in provenance chain
      const hasJudgmentId = fused.provenance_chain.some((entry: any) => entry.judgment_id);
      expect(hasJudgmentId).toBe(true);
      
      // Extract judgment_id
      let judgmentId: string | null = null;
      for (const entry of fused.provenance_chain) {
        if ((entry as any).judgment_id) {
          judgmentId = (entry as any).judgment_id;
          break;
        }
      }
      
      expect(judgmentId).toBeTruthy();
      expect(judgmentId).toHaveLength(64);
    });
  });

  describe('optimistic_fusion', () => {
    it('should generate judgment_id', () => {
      const { optimistic_fusion } = require('../src/index');
      
      const fused = optimistic_fusion([judgment1, judgment2]);
      
      // Should have judgment_id in provenance chain
      const hasJudgmentId = fused.provenance_chain.some((entry: any) => entry.judgment_id);
      expect(hasJudgmentId).toBe(true);
    });
  });

  describe('pessimistic_fusion', () => {
    it('should generate judgment_id', () => {
      const { pessimistic_fusion } = require('../src/index');
      
      const fused = pessimistic_fusion([judgment1, judgment2]);
      
      // Should have judgment_id in provenance chain
      const hasJudgmentId = fused.provenance_chain.some((entry: any) => entry.judgment_id);
      expect(hasJudgmentId).toBe(true);
    });
  });
});
