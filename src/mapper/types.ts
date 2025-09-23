/**
 * OTP Mapper Types and Interfaces
 * ===============================
 * 
 * This module defines the core types and interfaces for the OTP Mapper system,
 * providing a foundation for transforming raw data into Neutrosophic Judgments.
 */

import { NeutrosophicJudgment } from '../judgment';

/**
 * Enum for mapper types
 */
export enum MapperType {
  NUMERICAL = 'numerical',
  CATEGORICAL = 'categorical',
  BOOLEAN = 'boolean'
}

/**
 * Base interface for all mapper parameters
 */
export interface BaseMapperParams {
  /** Unique identifier for the mapper */
  id: string;
  /** Version of the mapper */
  version: string;
  /** Description of the mapper's purpose */
  description?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Parameters for NumericalMapper
 */
export interface NumericalParams extends BaseMapperParams {
  /** Point representing maximum falsity */
  falsity_point: number;
  /** Point representing maximum indeterminacy */
  indeterminacy_point: number;
  /** Point representing maximum truth */
  truth_point: number;
  /** Whether to clamp input values to the defined range */
  clamp_to_range?: boolean;
}

/**
 * Parameters for CategoricalMapper
 */
export interface CategoricalParams extends BaseMapperParams {
  /** Mapping of categories to judgment values */
  mappings: Record<string, { T: number; I: number; F: number }>;
  /** Default judgment for unknown categories */
  default_judgment?: { T: number; I: number; F: number };
}

/**
 * Parameters for BooleanMapper
 */
export interface BooleanParams extends BaseMapperParams {
  /** Mapping for true values */
  true_map: { T: number; I: number; F: number };
  /** Mapping for false values */
  false_map: { T: number; I: number; F: number };
}

/**
 * Union type for all parameter types
 */
export type MapperParams = NumericalParams | CategoricalParams | BooleanParams;

/**
 * Base interface for all mappers
 */
export interface Mapper {
  /** Mapper type */
  readonly mapper_type: MapperType;
  /** Mapper parameters */
  readonly parameters: MapperParams;
  
  /**
   * Apply the mapper to transform input data
   * @param input - The input data to transform
   * @returns A NeutrosophicJudgment representing the transformed data
   */
  apply(input: any): NeutrosophicJudgment;
  
  /**
   * Validate the mapper configuration
   * @returns true if valid, throws error if invalid
   */
  validate(): boolean;
  
  /**
   * Create a provenance entry for the transformation
   * @param input_value - The input value that was transformed
   * @param timestamp - Optional timestamp (defaults to current time)
   * @returns A provenance entry object
   */
  createProvenanceEntry(input_value: any, timestamp?: string): Record<string, any>;
}

/**
 * Custom error classes for mapper operations
 */
export class MapperError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'MapperError';
  }
}

export class InputError extends MapperError {
  constructor(message: string) {
    super(message, 'INPUT_ERROR');
    this.name = 'InputError';
  }
}

export class ValidationError extends MapperError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Registry interface for managing mappers
 */
export interface MapperRegistry {
  /**
   * Register a mapper
   * @param mapper - The mapper to register
   */
  register(mapper: Mapper): void;
  
  /**
   * Get a mapper by ID
   * @param id - The mapper ID
   * @returns The mapper or undefined if not found
   */
  get(id: string): Mapper | undefined;
  
  /**
   * List all registered mapper IDs
   * @returns Array of mapper IDs
   */
  list(): string[];
  
  /**
   * Remove a mapper by ID
   * @param id - The mapper ID
   * @returns true if removed, false if not found
   */
  unregister(id: string): boolean;
  
  /**
   * Get the count of registered mappers
   * @returns Number of registered mappers
   */
  count(): number;
  
  /**
   * Clear all registered mappers
   */
  clear(): void;
}

/**
 * Validator interface for mapper configurations
 */
export interface MapperValidator {
  /**
   * Validate a mapper configuration against JSON Schema
   * @param config - The mapper configuration
   * @returns true if valid, throws error if invalid
   */
  validate(config: any): boolean;
  
  /**
   * Get the JSON Schema for a mapper type
   * @param mapperType - The mapper type
   * @returns The JSON Schema object
   */
  getSchema(mapperType: MapperType): any;
}

/**
 * Utility function to create a timestamp
 * @returns ISO 8601 timestamp string
 */
export function createTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Utility function to validate judgment values
 * @param t - Truth value
 * @param i - Indeterminacy value  
 * @param f - Falsity value
 * @throws ValidationError if values are invalid
 */
export function validateJudgmentValues(t: number, i: number, f: number): void {
  // Range validation
  if (t < 0 || t > 1) {
    throw new ValidationError(`T value must be between 0 and 1, got ${t}`);
  }
  if (i < 0 || i > 1) {
    throw new ValidationError(`I value must be between 0 and 1, got ${i}`);
  }
  if (f < 0 || f > 1) {
    throw new ValidationError(`F value must be between 0 and 1, got ${f}`);
  }
  
  // Conservation constraint validation
  const sum = t + i + f;
  if (sum > 1.0) {
    throw new ValidationError(`Conservation constraint violated: T + I + F = ${sum} > 1.0`);
  }
}

/**
 * Utility function to create a judgment object
 * @param t - Truth value
 * @param i - Indeterminacy value
 * @param f - Falsity value
 * @returns Judgment object with validated values
 * @throws ValidationError if values are invalid
 */
export function createJudgment(t: number, i: number, f: number): { T: number; I: number; F: number } {
  validateJudgmentValues(t, i, f);
  return { T: t, I: i, F: f };
}

/**
 * Utility function to normalize boolean input
 * @param input - Input value to normalize
 * @returns Normalized boolean
 * @throws InputError if input cannot be normalized
 */
export function normalizeBooleanInput(input: any): boolean {
  if (typeof input === 'boolean') {
    return input;
  }
  
  if (typeof input === 'number') {
    if (input === 1) return true;
    if (input === 0) return false;
    throw new InputError(`Numeric input must be 0 or 1, got ${input}`);
  }
  
  if (typeof input === 'string') {
    const lower = input.toLowerCase();
    if (['true', 'yes', '1', 'on', 'enabled'].includes(lower)) return true;
    if (['false', 'no', '0', 'off', 'disabled'].includes(lower)) return false;
    throw new InputError(`String input must be a valid boolean representation, got '${input}'`);
  }
  
  throw new InputError(`Input must be boolean, number (0/1), or string, got ${typeof input}`);
}
