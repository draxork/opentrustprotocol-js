/**
 * MapperRegistry Implementation
 * =============================
 * 
 * Centralized registry for managing and retrieving mappers.
 * Provides thread-safe operations for mapper registration and lookup.
 */

import { Mapper, MapperRegistry as IMapperRegistry, ValidationError } from './types';

/**
 * Thread-safe registry for managing mappers
 * 
 * Provides centralized storage and retrieval of mappers by ID.
 * Supports registration, lookup, listing, and removal of mappers.
 * 
 * Example:
 * ```typescript
 * const registry = new MapperRegistry();
 * 
 * const healthMapper = new NumericalMapper({
 *   id: 'defi-health-factor',
 *   version: '1.0.0',
 *   falsity_point: 1.0,
 *   indeterminacy_point: 1.5,
 *   truth_point: 3.0
 * });
 * 
 * registry.register(healthMapper);
 * const retrieved = registry.get('defi-health-factor');
 * ```
 */
export class MapperRegistry implements IMapperRegistry {
  private mappers: Map<string, Mapper> = new Map();

  /**
   * Register a mapper
   * 
   * @param mapper - The mapper to register
   * @throws ValidationError if mapper ID is already in use
   */
  register(mapper: Mapper): void {
    const id = mapper.parameters.id;
    
    if (this.mappers.has(id)) {
      throw new ValidationError(`Mapper with ID '${id}' is already registered`);
    }
    
    // Validate the mapper before registration
    mapper.validate();
    
    this.mappers.set(id, mapper);
  }

  /**
   * Get a mapper by ID
   * 
   * @param id - The mapper ID
   * @returns The mapper or undefined if not found
   */
  get(id: string): Mapper | undefined {
    return this.mappers.get(id);
  }

  /**
   * List all registered mapper IDs
   * 
   * @returns Array of mapper IDs
   */
  list(): string[] {
    return Array.from(this.mappers.keys());
  }

  /**
   * Remove a mapper by ID
   * 
   * @param id - The mapper ID
   * @returns true if removed, false if not found
   */
  unregister(id: string): boolean {
    return this.mappers.delete(id);
  }

  /**
   * Get the count of registered mappers
   * 
   * @returns Number of registered mappers
   */
  count(): number {
    return this.mappers.size;
  }

  /**
   * Clear all registered mappers
   */
  clear(): void {
    this.mappers.clear();
  }

  /**
   * Check if a mapper is registered
   * 
   * @param id - The mapper ID
   * @returns true if the mapper is registered
   */
  has(id: string): boolean {
    return this.mappers.has(id);
  }

  /**
   * Get all registered mappers
   * 
   * @returns Map of all registered mappers
   */
  getAll(): Map<string, Mapper> {
    return new Map(this.mappers);
  }

  /**
   * Get mappers by type
   * 
   * @param type - The mapper type to filter by
   * @returns Array of mappers of the specified type
   */
  getByType(type: string): Mapper[] {
    return Array.from(this.mappers.values()).filter(
      mapper => mapper.mapper_type === type
    );
  }

  /**
   * Update an existing mapper
   * 
   * @param mapper - The mapper to update
   * @throws ValidationError if mapper ID is not registered
   */
  update(mapper: Mapper): void {
    const id = mapper.parameters.id;
    
    if (!this.mappers.has(id)) {
      throw new ValidationError(`Mapper with ID '${id}' is not registered`);
    }
    
    // Validate the mapper before updating
    mapper.validate();
    
    this.mappers.set(id, mapper);
  }

  /**
   * Register or update a mapper
   * 
   * @param mapper - The mapper to register or update
   */
  registerOrUpdate(mapper: Mapper): void {
    const id = mapper.parameters.id;
    
    // Validate the mapper
    mapper.validate();
    
    this.mappers.set(id, mapper);
  }

  /**
   * Get mapper metadata
   * 
   * @param id - The mapper ID
   * @returns Mapper metadata or undefined if not found
   */
  getMetadata(id: string): any {
    const mapper = this.mappers.get(id);
    if (!mapper) {
      return undefined;
    }
    
    return {
      id: mapper.parameters.id,
      type: mapper.mapper_type,
      version: mapper.parameters.version,
      description: mapper.parameters.description,
      metadata: mapper.parameters.metadata
    };
  }

  /**
   * List mapper metadata for all registered mappers
   * 
   * @returns Array of mapper metadata objects
   */
  listMetadata(): any[] {
    return Array.from(this.mappers.values()).map(mapper => ({
      id: mapper.parameters.id,
      type: mapper.mapper_type,
      version: mapper.parameters.version,
      description: mapper.parameters.description,
      metadata: mapper.parameters.metadata
    }));
  }

  /**
   * Export all mappers to a serializable format
   * 
   * @returns Array of mapper configurations
   */
  export(): any[] {
    return Array.from(this.mappers.values()).map(mapper => ({
      id: mapper.parameters.id,
      type: mapper.mapper_type,
      version: mapper.parameters.version,
      description: mapper.parameters.description,
      metadata: mapper.parameters.metadata,
      parameters: mapper.parameters
    }));
  }

  /**
   * Import mappers from a serializable format
   * 
   * @param configs - Array of mapper configurations
   * @param replace - Whether to replace existing mappers (default: false)
   * @throws ValidationError if configurations are invalid
   */
  import(configs: any[], replace: boolean = false): void {
    for (const config of configs) {
      const id = config.id;
      
      if (!replace && this.mappers.has(id)) {
        throw new ValidationError(`Mapper with ID '${id}' already exists. Use replace=true to overwrite.`);
      }
      
      // Note: This is a simplified import. In a real implementation,
      // you would need to reconstruct the appropriate mapper class
      // based on the type and parameters.
      throw new ValidationError('Import functionality requires mapper reconstruction logic');
    }
  }

  /**
   * Create a snapshot of the current registry state
   * 
   * @returns Snapshot object
   */
  createSnapshot(): any {
    return {
      timestamp: new Date().toISOString(),
      count: this.mappers.size,
      mappers: this.export()
    };
  }

  /**
   * Get statistics about the registry
   * 
   * @returns Statistics object
   */
  getStats(): any {
    const mappers = Array.from(this.mappers.values());
    const typeCounts: Record<string, number> = {};
    
    for (const mapper of mappers) {
      typeCounts[mapper.mapper_type] = (typeCounts[mapper.mapper_type] || 0) + 1;
    }
    
    return {
      total: this.mappers.size,
      byType: typeCounts,
      types: Object.keys(typeCounts)
    };
  }
}

// Singleton instance for global access
let globalRegistry: MapperRegistry | null = null;

/**
 * Get the global mapper registry instance
 * 
 * @returns The global MapperRegistry instance
 */
export function getGlobalRegistry(): MapperRegistry {
  if (!globalRegistry) {
    globalRegistry = new MapperRegistry();
  }
  return globalRegistry;
}

/**
 * Reset the global mapper registry
 */
export function resetGlobalRegistry(): void {
  globalRegistry = null;
}


