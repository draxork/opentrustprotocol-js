/**
 * Integration tests for OTP Mapper system
 */

import {
  NumericalMapper,
  CategoricalMapper,
  BooleanMapper,
  MapperRegistry,
  MapperValidator,
  getGlobalRegistry,
  conflict_aware_weighted_average
} from '../../src';

describe('OTP Mapper Integration Tests', () => {
  let registry: MapperRegistry;
  let validator: MapperValidator;

  beforeEach(() => {
    registry = new MapperRegistry();
    validator = new MapperValidator();
  });

  describe('Real-world Scenarios', () => {
    it('should handle DeFi risk assessment scenario', () => {
      // Health Factor Mapper
      const healthMapper = new NumericalMapper({
        id: 'defi-health-factor',
        version: '1.0.0',
        description: 'DeFi Health Factor Assessment',
        falsity_point: 1.0,    // Liquidación inminente
        indeterminacy_point: 1.5,  // Zona de riesgo
        truth_point: 3.0       // Posición segura
      });

      // Credit Score Mapper
      const creditMapper = new NumericalMapper({
        id: 'credit-score',
        version: '1.0.0',
        description: 'Credit Score Assessment',
        falsity_point: 300,    // Crédito pobre
        indeterminacy_point: 650,  // Crédito promedio
        truth_point: 850      // Crédito excelente
      });

      // KYC Status Mapper
      const kycMapper = new CategoricalMapper({
        id: 'kyc-status',
        version: '1.0.0',
        description: 'KYC Verification Status',
        mappings: {
          'VERIFIED': { T: 1.0, I: 0.0, F: 0.0 },
          'PENDING': { T: 0.0, I: 1.0, F: 0.0 },
          'REJECTED': { T: 0.0, I: 0.0, F: 1.0 },
          'PARTIAL': { T: 0.6, I: 0.3, F: 0.1 }
        },
        default_judgment: { T: 0.0, I: 0.0, F: 1.0 }
      });

      // Register mappers
      registry.register(healthMapper);
      registry.register(creditMapper);
      registry.register(kycMapper);

      // Test individual mappers
      const healthJudgment = healthMapper.apply(1.8);
      expect(healthJudgment.I).toBeGreaterThan(healthJudgment.T);
      expect(healthJudgment.F).toBeLessThan(0.5);

      const creditJudgment = creditMapper.apply(720);
      expect(creditJudgment.T).toBeGreaterThan(creditJudgment.F);

      const kycJudgment = kycMapper.apply('VERIFIED');
      expect(kycJudgment.T).toBe(1.0);

      // Test fusion of multiple sources
      const weights = [0.3, 0.5, 0.2]; // health, credit, kyc
      const fusedJudgment = conflict_aware_weighted_average(
        [healthJudgment, creditJudgment, kycJudgment],
        weights
      );

      expect(fusedJudgment.T + fusedJudgment.I + fusedJudgment.F).toBeCloseTo(1.0, 10);
      expect(fusedJudgment.provenance_chain.length).toBeGreaterThan(3);
    });

    it('should handle IoT monitoring scenario', () => {
      // Temperature Mapper
      const tempMapper = new NumericalMapper({
        id: 'server-room-temp',
        version: '1.0.0',
        description: 'Server Room Temperature Monitoring',
        falsity_point: 35.0,   // Too hot
        indeterminacy_point: 22.0,  // Optimal
        truth_point: 18.0      // Too cold
      });

      // Pressure Mapper
      const pressureMapper = new NumericalMapper({
        id: 'pressure-sensor',
        version: '1.0.0',
        description: 'Pressure Sensor Monitoring',
        falsity_point: 100,    // High pressure
        indeterminacy_point: 50,   // Normal
        truth_point: 20       // Low pressure
      });

      // System Status Mapper
      const statusMapper = new CategoricalMapper({
        id: 'system-status',
        version: '1.0.0',
        description: 'System Status Assessment',
        mappings: {
          'HEALTHY': { T: 1.0, I: 0.0, F: 0.0 },
          'WARNING': { T: 0.0, I: 1.0, F: 0.0 },
          'CRITICAL': { T: 0.0, I: 0.0, F: 1.0 },
          'MAINTENANCE': { T: 0.2, I: 0.6, F: 0.2 }
        },
        default_judgment: { T: 0.0, I: 0.0, F: 1.0 }
      });

      // Power Status Mapper
      const powerMapper = new BooleanMapper({
        id: 'power-status',
        version: '1.0.0',
        description: 'Power Supply Status',
        true_map: { T: 0.9, I: 0.1, F: 0.0 },  // Power on
        false_map: { T: 0.0, I: 0.0, F: 1.0 }  // Power off
      });

      // Register mappers
      registry.register(tempMapper);
      registry.register(pressureMapper);
      registry.register(statusMapper);
      registry.register(powerMapper);

      // Test IoT scenario
      const tempJudgment = tempMapper.apply(25.0);
      const pressureJudgment = pressureMapper.apply(45.0);
      const statusJudgment = statusMapper.apply('WARNING');
      const powerJudgment = powerMapper.apply(true);

      // All judgments should be valid
      expect(tempJudgment.T + tempJudgment.I + tempJudgment.F).toBeCloseTo(1.0, 10);
      expect(pressureJudgment.T + pressureJudgment.I + pressureJudgment.F).toBeCloseTo(1.0, 10);
      expect(statusJudgment.T + statusJudgment.I + statusJudgment.F).toBeCloseTo(1.0, 10);
      expect(powerJudgment.T + powerJudgment.I + powerJudgment.F).toBeCloseTo(1.0, 10);

      // Test fusion for overall system health
      const weights = [0.3, 0.3, 0.2, 0.2]; // temp, pressure, status, power
      const systemHealth = conflict_aware_weighted_average(
        [tempJudgment, pressureJudgment, statusJudgment, powerJudgment],
        weights
      );

      expect(systemHealth.T + systemHealth.I + systemHealth.F).toBeCloseTo(1.0, 10);
    });

    it('should handle supply chain tracking scenario', () => {
      // Product Status Mapper
      const productMapper = new CategoricalMapper({
        id: 'product-status',
        version: '1.0.0',
        description: 'Product Status in Supply Chain',
        mappings: {
          'PRODUCED': { T: 1.0, I: 0.0, F: 0.0 },
          'IN_TRANSIT': { T: 0.7, I: 0.3, F: 0.0 },
          'DELIVERED': { T: 0.9, I: 0.1, F: 0.0 },
          'DELAYED': { T: 0.0, I: 0.8, F: 0.2 },
          'LOST': { T: 0.0, I: 0.0, F: 1.0 },
          'DAMAGED': { T: 0.0, I: 0.2, F: 0.8 }
        },
        default_judgment: { T: 0.0, I: 1.0, F: 0.0 }
      });

      // Quality Score Mapper
      const qualityMapper = new NumericalMapper({
        id: 'quality-score',
        version: '1.0.0',
        description: 'Product Quality Assessment',
        falsity_point: 0,      // Poor quality
        indeterminacy_point: 50,   // Average quality
        truth_point: 100      // Excellent quality
      });

      // Temperature Control Mapper
      const tempControlMapper = new BooleanMapper({
        id: 'temperature-control',
        version: '1.0.0',
        description: 'Temperature Control System Status',
        true_map: { T: 0.8, I: 0.2, F: 0.0 },  // Temperature controlled
        false_map: { T: 0.0, I: 0.3, F: 0.7 }  // Temperature not controlled
      });

      // Register mappers
      registry.register(productMapper);
      registry.register(qualityMapper);
      registry.register(tempControlMapper);

      // Test supply chain scenario
      const productJudgment = productMapper.apply('IN_TRANSIT');
      const qualityJudgment = qualityMapper.apply(75);
      const tempJudgment = tempControlMapper.apply(true);

      // Test fusion for overall supply chain confidence
      const weights = [0.4, 0.4, 0.2]; // product, quality, temperature
      const supplyChainConfidence = conflict_aware_weighted_average(
        [productJudgment, qualityJudgment, tempJudgment],
        weights
      );

      expect(supplyChainConfidence.T + supplyChainConfidence.I + supplyChainConfidence.F).toBeCloseTo(1.0, 10);
      expect(supplyChainConfidence.provenance_chain.length).toBeGreaterThan(3);
    });
  });

  describe('Registry Integration', () => {
    it('should work with global registry', () => {
      const globalRegistry = getGlobalRegistry();
      
      const mapper = new NumericalMapper({
        id: 'global-test',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      });

      globalRegistry.register(mapper);
      
      expect(globalRegistry.has('global-test')).toBe(true);
      expect(globalRegistry.count()).toBe(1);
    });

    it('should export and validate configurations', () => {
      const mapper = new NumericalMapper({
        id: 'export-test',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      });

      registry.register(mapper);
      
      const exported = registry.export();
      expect(exported).toHaveLength(1);
      
      const config = exported[0];
      expect(() => validator.validate(config.parameters)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid mapper configurations gracefully', () => {
      const invalidConfigs = [
        {
          id: 'invalid-numerical',
          version: '1.0.0',
          falsity_point: 1.0,
          indeterminacy_point: 1.0, // Same as falsity_point
          truth_point: 1.0 // Same as others
        },
        {
          id: 'invalid-categorical',
          version: '1.0.0',
          mappings: {
            'INVALID': { T: 1.5, I: 0.0, F: 0.0 } // T > 1.0
          }
        },
        {
          id: 'invalid-boolean',
          version: '1.0.0',
          true_map: { T: 0.5, I: 0.5, F: 0.3 }, // T + I + F > 1.0
          false_map: { T: 0.0, I: 0.0, F: 1.0 }
        }
      ];

      for (const config of invalidConfigs) {
        expect(() => validator.validate(config)).toThrow();
      }
    });

    it('should handle registry errors gracefully', () => {
      const mapper1 = new NumericalMapper({
        id: 'duplicate',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      });

      const mapper2 = new CategoricalMapper({
        id: 'duplicate', // Same ID
        version: '1.0.0',
        mappings: { 'STATUS': { T: 1.0, I: 0.0, F: 0.0 } }
      });

      registry.register(mapper1);
      expect(() => registry.register(mapper2)).toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle multiple mappers efficiently', () => {
      const mappers = [];
      
      // Create multiple mappers
      for (let i = 0; i < 100; i++) {
        const mapper = new NumericalMapper({
          id: `mapper-${i}`,
          version: '1.0.0',
          falsity_point: 1.0,
          indeterminacy_point: 1.5,
          truth_point: 3.0
        });
        mappers.push(mapper);
        registry.register(mapper);
      }

      expect(registry.count()).toBe(100);
      
      // Test retrieval performance
      for (let i = 0; i < 100; i++) {
        const retrieved = registry.get(`mapper-${i}`);
        expect(retrieved).toBeDefined();
        expect(retrieved?.parameters.id).toBe(`mapper-${i}`);
      }
    });

    it('should handle fusion with many judgments efficiently', () => {
      const judgments = [];
      
      // Create many judgments
      for (let i = 0; i < 50; i++) {
        const mapper = new NumericalMapper({
          id: `test-${i}`,
          version: '1.0.0',
          falsity_point: 1.0,
          indeterminacy_point: 1.5,
          truth_point: 3.0
        });
        
        const judgment = mapper.apply(1.5 + (i * 0.01));
        judgments.push(judgment);
      }

      const weights = new Array(50).fill(1.0 / 50);
      
      const fused = conflict_aware_weighted_average(judgments, weights);
      expect(fused.T + fused.I + fused.F).toBeCloseTo(1.0, 10);
    });
  });
});
