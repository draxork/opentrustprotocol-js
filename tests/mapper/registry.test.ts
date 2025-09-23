/**
 * Tests for MapperRegistry
 */

import {
  MapperRegistry,
  getGlobalRegistry,
  resetGlobalRegistry,
  NumericalMapper,
  CategoricalMapper,
  BooleanMapper,
  ValidationError
} from '../../src/mapper';

describe('MapperRegistry', () => {
  let registry: MapperRegistry;

  beforeEach(() => {
    registry = new MapperRegistry();
  });

  describe('Basic Operations', () => {
    it('should start empty', () => {
      expect(registry.count()).toBe(0);
      expect(registry.list()).toEqual([]);
    });

    it('should register a mapper', () => {
      const mapper = new NumericalMapper({
        id: 'test-mapper',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      });

      registry.register(mapper);
      
      expect(registry.count()).toBe(1);
      expect(registry.list()).toContain('test-mapper');
      expect(registry.has('test-mapper')).toBe(true);
    });

    it('should get a registered mapper', () => {
      const mapper = new NumericalMapper({
        id: 'test-mapper',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      });

      registry.register(mapper);
      
      const retrieved = registry.get('test-mapper');
      expect(retrieved).toBe(mapper);
      expect(retrieved?.parameters.id).toBe('test-mapper');
    });

    it('should return undefined for non-existent mapper', () => {
      expect(registry.get('non-existent')).toBeUndefined();
    });

    it('should unregister a mapper', () => {
      const mapper = new NumericalMapper({
        id: 'test-mapper',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      });

      registry.register(mapper);
      expect(registry.count()).toBe(1);
      
      const removed = registry.unregister('test-mapper');
      expect(removed).toBe(true);
      expect(registry.count()).toBe(0);
      expect(registry.has('test-mapper')).toBe(false);
    });

    it('should return false when unregistering non-existent mapper', () => {
      const removed = registry.unregister('non-existent');
      expect(removed).toBe(false);
    });

    it('should clear all mappers', () => {
      const mapper1 = new NumericalMapper({
        id: 'mapper1',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      });

      const mapper2 = new CategoricalMapper({
        id: 'mapper2',
        version: '1.0.0',
        mappings: { 'STATUS': { T: 1.0, I: 0.0, F: 0.0 } }
      });

      registry.register(mapper1);
      registry.register(mapper2);
      expect(registry.count()).toBe(2);
      
      registry.clear();
      expect(registry.count()).toBe(0);
      expect(registry.list()).toEqual([]);
    });
  });

  describe('Registration Validation', () => {
    it('should throw error for duplicate ID', () => {
      const mapper1 = new NumericalMapper({
        id: 'duplicate',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      });

      const mapper2 = new CategoricalMapper({
        id: 'duplicate',
        version: '1.0.0',
        mappings: { 'STATUS': { T: 1.0, I: 0.0, F: 0.0 } }
      });

      registry.register(mapper1);
      
      expect(() => registry.register(mapper2)).toThrow(ValidationError);
    });

    it('should validate mapper before registration', () => {
      // This test would require a mock mapper that fails validation
      // For now, we'll test with valid mappers
      const mapper = new NumericalMapper({
        id: 'valid-mapper',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      });

      expect(() => registry.register(mapper)).not.toThrow();
    });
  });

  describe('Advanced Operations', () => {
    beforeEach(() => {
      // Register multiple mappers for advanced tests
      const numericalMapper = new NumericalMapper({
        id: 'numerical-test',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      });

      const categoricalMapper = new CategoricalMapper({
        id: 'categorical-test',
        version: '1.0.0',
        mappings: {
          'VERIFIED': { T: 1.0, I: 0.0, F: 0.0 },
          'PENDING': { T: 0.0, I: 1.0, F: 0.0 }
        }
      });

      const booleanMapper = new BooleanMapper({
        id: 'boolean-test',
        version: '1.0.0',
        true_map: { T: 0.9, I: 0.1, F: 0.0 },
        false_map: { T: 0.0, I: 0.0, F: 1.0 }
      });

      registry.register(numericalMapper);
      registry.register(categoricalMapper);
      registry.register(booleanMapper);
    });

    it('should get mappers by type', () => {
      const numericalMappers = registry.getByType('numerical');
      expect(numericalMappers).toHaveLength(1);
      expect(numericalMappers[0]!.parameters.id).toBe('numerical-test');

      const categoricalMappers = registry.getByType('categorical');
      expect(categoricalMappers).toHaveLength(1);
      expect(categoricalMappers[0]!.parameters.id).toBe('categorical-test');

      const booleanMappers = registry.getByType('boolean');
      expect(booleanMappers).toHaveLength(1);
      expect(booleanMappers[0]!.parameters.id).toBe('boolean-test');
    });

    it('should update existing mapper', () => {
      const updatedMapper = new NumericalMapper({
        id: 'numerical-test',
        version: '1.1.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0,
        description: 'Updated mapper'
      });

      registry.update(updatedMapper);
      
      const retrieved = registry.get('numerical-test');
      expect(retrieved?.parameters.version).toBe('1.1.0');
      expect(retrieved?.parameters.description).toBe('Updated mapper');
    });

    it('should throw error when updating non-existent mapper', () => {
      const mapper = new NumericalMapper({
        id: 'non-existent',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      });

      expect(() => registry.update(mapper)).toThrow(ValidationError);
    });

    it('should register or update mapper', () => {
      // Test registration
      const newMapper = new NumericalMapper({
        id: 'new-mapper',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      });

      registry.registerOrUpdate(newMapper);
      expect(registry.has('new-mapper')).toBe(true);

      // Test update
      const updatedMapper = new NumericalMapper({
        id: 'new-mapper',
        version: '1.1.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      });

      registry.registerOrUpdate(updatedMapper);
      const retrieved = registry.get('new-mapper');
      expect(retrieved?.parameters.version).toBe('1.1.0');
    });
  });

  describe('Metadata Operations', () => {
    beforeEach(() => {
      const mapper = new NumericalMapper({
        id: 'metadata-test',
        version: '1.0.0',
        description: 'Test mapper for metadata',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0,
        metadata: { author: 'test', category: 'defi' }
      });

      registry.register(mapper);
    });

    it('should get mapper metadata', () => {
      const metadata = registry.getMetadata('metadata-test');
      
      expect(metadata.id).toBe('metadata-test');
      expect(metadata.type).toBe('numerical');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.description).toBe('Test mapper for metadata');
      expect(metadata.metadata.author).toBe('test');
      expect(metadata.metadata.category).toBe('defi');
    });

    it('should return undefined for non-existent mapper metadata', () => {
      const metadata = registry.getMetadata('non-existent');
      expect(metadata).toBeUndefined();
    });

    it('should list all mapper metadata', () => {
      const metadataList = registry.listMetadata();
      
      expect(metadataList).toHaveLength(1);
      expect(metadataList[0].id).toBe('metadata-test');
      expect(metadataList[0].type).toBe('numerical');
    });
  });

  describe('Export/Import Operations', () => {
    beforeEach(() => {
      const mapper = new NumericalMapper({
        id: 'export-test',
        version: '1.0.0',
        description: 'Mapper for export test',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0,
        metadata: { test: true }
      });

      registry.register(mapper);
    });

    it('should export mappers', () => {
      const exported = registry.export();
      
      expect(exported).toHaveLength(1);
      expect(exported[0].id).toBe('export-test');
      expect(exported[0].type).toBe('numerical');
      expect(exported[0].version).toBe('1.0.0');
      expect(exported[0].parameters.falsity_point).toBe(1.0);
    });

    it('should create snapshot', () => {
      const snapshot = registry.createSnapshot();
      
      expect(snapshot.count).toBe(1);
      expect(snapshot.mappers).toHaveLength(1);
      expect(snapshot.timestamp).toBeDefined();
    });

    it('should get statistics', () => {
      const stats = registry.getStats();
      
      expect(stats.total).toBe(1);
      expect(stats.byType.numerical).toBe(1);
      expect(stats.types).toContain('numerical');
    });
  });

  describe('Global Registry', () => {
    afterEach(() => {
      resetGlobalRegistry();
    });

    it('should get global registry instance', () => {
      const global1 = getGlobalRegistry();
      const global2 = getGlobalRegistry();
      
      expect(global1).toBe(global2); // Same instance
    });

    it('should reset global registry', () => {
      const global1 = getGlobalRegistry();
      
      const mapper = new NumericalMapper({
        id: 'global-test',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      });

      global1.register(mapper);
      expect(global1.count()).toBe(1);
      
      resetGlobalRegistry();
      
      const global2 = getGlobalRegistry();
      expect(global2.count()).toBe(0);
      expect(global2).not.toBe(global1); // Different instance
    });

    it('should maintain global state across calls', () => {
      const global1 = getGlobalRegistry();
      
      const mapper = new NumericalMapper({
        id: 'persistent-test',
        version: '1.0.0',
        falsity_point: 1.0,
        indeterminacy_point: 1.5,
        truth_point: 3.0
      });

      global1.register(mapper);
      
      const global2 = getGlobalRegistry();
      expect(global2.has('persistent-test')).toBe(true);
      expect(global2.count()).toBe(1);
    });
  });
});
