import { NeutrosophicJudgment, ProvenanceEntry } from '../src/judgment';

describe('NeutrosophicJudgment', () => {
  const validProvenance: ProvenanceEntry[] = [
    {
      source_id: 'test-source',
      timestamp: '2025-09-20T20:30:00Z',
      description: 'Test judgment'
    }
  ];

  describe('Constructor', () => {
    it('should create a valid judgment with correct values', () => {
      const judgment = new NeutrosophicJudgment(0.8, 0.2, 0.0, validProvenance);
      
      expect(judgment.T).toBe(0.8);
      expect(judgment.I).toBe(0.2);
      expect(judgment.F).toBe(0.0);
      expect(judgment.provenance_chain).toEqual(validProvenance);
    });

    it('should create a valid judgment with boundary values', () => {
      const judgment = new NeutrosophicJudgment(1.0, 0.0, 0.0, validProvenance);
      
      expect(judgment.T).toBe(1.0);
      expect(judgment.I).toBe(0.0);
      expect(judgment.F).toBe(0.0);
    });

    it('should throw error for negative T value', () => {
      expect(() => {
        new NeutrosophicJudgment(-0.1, 0.5, 0.3, validProvenance);
      }).toThrow('T value must be between 0 and 1');
    });

    it('should throw error for negative I value', () => {
      expect(() => {
        new NeutrosophicJudgment(0.5, -0.1, 0.3, validProvenance);
      }).toThrow('I value must be between 0 and 1');
    });

    it('should throw error for negative F value', () => {
      expect(() => {
        new NeutrosophicJudgment(0.5, 0.3, -0.1, validProvenance);
      }).toThrow('F value must be between 0 and 1');
    });

    it('should throw error for T value > 1', () => {
      expect(() => {
        new NeutrosophicJudgment(1.1, 0.0, 0.0, validProvenance);
      }).toThrow('T value must be between 0 and 1');
    });

    it('should throw error for conservation constraint violation', () => {
      expect(() => {
        new NeutrosophicJudgment(0.8, 0.3, 0.2, validProvenance);
      }).toThrow('Conservation constraint violated: T + I + F > 1.0');
    });

    it('should throw error for empty provenance chain', () => {
      expect(() => {
        new NeutrosophicJudgment(0.8, 0.2, 0.0, []);
      }).toThrow('Provenance chain cannot be empty');
    });

    it('should throw error for missing source_id in provenance', () => {
      const invalidProvenance = [
        {
          timestamp: '2025-09-20T20:30:00Z',
          description: 'Missing source_id'
        }
      ] as ProvenanceEntry[];

      expect(() => {
        new NeutrosophicJudgment(0.8, 0.2, 0.0, invalidProvenance);
      }).toThrow('Provenance entry must have source_id');
    });

    it('should throw error for missing timestamp in provenance', () => {
      const invalidProvenance = [
        {
          source_id: 'test',
          description: 'Missing timestamp'
        }
      ] as ProvenanceEntry[];

      expect(() => {
        new NeutrosophicJudgment(0.8, 0.2, 0.0, invalidProvenance);
      }).toThrow('Provenance entry must have timestamp');
    });
  });

  describe('toJSON', () => {
    it('should return correct JSON representation', () => {
      const judgment = new NeutrosophicJudgment(0.8, 0.2, 0.0, validProvenance);
      const json = judgment.toJSON();
      
      expect(json).toEqual({
        T: 0.8,
        I: 0.2,
        F: 0.0,
        provenance_chain: validProvenance
      });
    });
  });

  describe('fromJSON', () => {
    it('should create judgment from JSON', () => {
      const json = {
        T: 0.8,
        I: 0.2,
        F: 0.0,
        provenance_chain: validProvenance
      };
      
      const judgment = NeutrosophicJudgment.fromJSON(json);
      
      expect(judgment.T).toBe(0.8);
      expect(judgment.I).toBe(0.2);
      expect(judgment.F).toBe(0.0);
      expect(judgment.provenance_chain).toEqual(validProvenance);
    });
  });

  describe('toString', () => {
    it('should return correct string representation', () => {
      const judgment = new NeutrosophicJudgment(0.8, 0.2, 0.0, validProvenance);
      const str = judgment.toString();
      
      expect(str).toBe('NeutrosophicJudgment(T=0.8, I=0.2, F=0)');
    });
  });

  describe('equals', () => {
    it('should return true for equal judgments', () => {
      const judgment1 = new NeutrosophicJudgment(0.8, 0.2, 0.0, validProvenance);
      const judgment2 = new NeutrosophicJudgment(0.8, 0.2, 0.0, validProvenance);
      
      expect(judgment1.equals(judgment2)).toBe(true);
    });

    it('should return false for different T values', () => {
      const judgment1 = new NeutrosophicJudgment(0.8, 0.2, 0.0, validProvenance);
      const judgment2 = new NeutrosophicJudgment(0.7, 0.2, 0.0, validProvenance);
      
      expect(judgment1.equals(judgment2)).toBe(false);
    });

    it('should return false for different provenance chains', () => {
      const provenance2: ProvenanceEntry[] = [
        {
          source_id: 'different-source',
          timestamp: '2025-09-20T20:30:00Z',
          description: 'Different provenance'
        }
      ];
      
      const judgment1 = new NeutrosophicJudgment(0.8, 0.2, 0.0, validProvenance);
      const judgment2 = new NeutrosophicJudgment(0.8, 0.2, 0.0, provenance2);
      
      expect(judgment1.equals(judgment2)).toBe(false);
    });
  });

  describe('Immutability', () => {
    it('should make provenance chain readonly', () => {
      const judgment = new NeutrosophicJudgment(0.8, 0.2, 0.0, validProvenance);
      
      expect(() => {
        (judgment.provenance_chain as any).push({
          source_id: 'hack',
          timestamp: '2025-09-20T20:30:00Z'
        });
      }).toThrow();
    });
  });
});
