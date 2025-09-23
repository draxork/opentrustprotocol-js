/**
 * BooleanMapper Implementation
 * ============================
 * 
 * Transforms boolean values into predefined Neutrosophic Judgments.
 * Supports multiple input formats: boolean, integer (0/1), and string representations.
 */

import { NeutrosophicJudgment } from '../judgment';
import { 
  Mapper, 
  MapperType, 
  BooleanParams, 
  ValidationError,
  createTimestamp,
  validateJudgmentValues,
  normalizeBooleanInput
} from './types';

/**
 * BooleanMapper for transforming boolean values
 * 
 * Maps `True` and `False` inputs to specific Neutrosophic Judgments.
 * Supports multiple input formats:
 * - Boolean: true, false
 * - Integer: 1, 0
 * - String: 'true'/'false', 'yes'/'no', '1'/'0', 'on'/'off', 'enabled'/'disabled'
 * 
 * Example:
 * ```typescript
 * const mapper = new BooleanMapper({
 *   id: 'ssl-certificate',
 *   version: '1.0.0',
 *   true_map: { T: 0.9, I: 0.1, F: 0.0 },  // Valid certificate
 *   false_map: { T: 0.0, I: 0.0, F: 1.0 }  // Invalid certificate
 * });
 * 
 * const judgment = mapper.apply(true);
 * // Result: T=0.9, I=0.1, F=0.0
 * ```
 */
export class BooleanMapper implements Mapper {
  public readonly mapper_type = MapperType.BOOLEAN;
  public readonly parameters: BooleanParams;

  constructor(params: BooleanParams) {
    this.parameters = params;
    this.validate();
  }

  /**
   * Validate the mapper configuration
   */
  validate(): boolean {
    const { true_map, false_map } = this.parameters;
    
    // Validate true_map
    try {
      validateJudgmentValues(true_map.T, true_map.I, true_map.F);
    } catch (error) {
      throw new ValidationError(`Invalid true_map in BooleanMapper: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Validate false_map
    try {
      validateJudgmentValues(false_map.T, false_map.I, false_map.F);
    } catch (error) {
      throw new ValidationError(`Invalid false_map in BooleanMapper: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return true;
  }

  /**
   * Apply the boolean mapping to an input value
   * 
   * Supports boolean, integer (0/1), and string representations.
   * 
   * @param input_value - The boolean-like value to transform
   * @returns A NeutrosophicJudgment corresponding to the boolean state
   * @throws InputError if the input value cannot be interpreted as a boolean
   */
  apply(input_value: boolean | number | string): NeutrosophicJudgment {
    // Normalize the input to a boolean
    const normalized_input = normalizeBooleanInput(input_value);
    
    // Get the appropriate judgment data
    const judgment_data = normalized_input ? this.parameters.true_map : this.parameters.false_map;
    
    // Create provenance entry
    const provenance_entry = this.createProvenanceEntry(input_value);
    
    return new NeutrosophicJudgment(
      judgment_data.T,
      judgment_data.I,
      judgment_data.F,
      [provenance_entry as any]
    );
  }

  /**
   * Create provenance entry for mapper application
   * 
   * @param input_value - The input value that was transformed
   * @param timestamp - Optional timestamp (defaults to current time)
   * @returns A provenance entry object
   */
  createProvenanceEntry(input_value: any, timestamp?: string): Record<string, any> {
    const ts = timestamp || createTimestamp();
    
    return {
      source_id: this.parameters.id,
      timestamp: ts,
      description: `Mapper transformation using ${this.parameters.id}`,
      metadata: {
        mapper_version: this.parameters.version,
        mapper_type: this.mapper_type,
        original_input: {
          value: String(input_value),
          type: this.mapper_type,
          normalized: String(normalizeBooleanInput(input_value))
        }
      }
    };
  }

  /**
   * Get the judgment for true values
   * 
   * @returns The true judgment data
   */
  getTrueJudgment(): { T: number; I: number; F: number } {
    return this.parameters.true_map;
  }

  /**
   * Get the judgment for false values
   * 
   * @returns The false judgment data
   */
  getFalseJudgment(): { T: number; I: number; F: number } {
    return this.parameters.false_map;
  }

  /**
   * Update the true judgment mapping
   * 
   * @param judgment - The new true judgment
   * @throws ValidationError if judgment values are invalid
   */
  setTrueJudgment(judgment: { T: number; I: number; F: number }): void {
    validateJudgmentValues(judgment.T, judgment.I, judgment.F);
    this.parameters.true_map = judgment;
  }

  /**
   * Update the false judgment mapping
   * 
   * @param judgment - The new false judgment
   * @throws ValidationError if judgment values are invalid
   */
  setFalseJudgment(judgment: { T: number; I: number; F: number }): void {
    validateJudgmentValues(judgment.T, judgment.I, judgment.F);
    this.parameters.false_map = judgment;
  }

  /**
   * Test if an input can be normalized to a boolean
   * 
   * @param input_value - The input to test
   * @returns true if the input can be normalized
   */
  canNormalize(input_value: any): boolean {
    try {
      normalizeBooleanInput(input_value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the normalized boolean value for an input
   * 
   * @param input_value - The input to normalize
   * @returns The normalized boolean value
   * @throws InputError if the input cannot be normalized
   */
  normalize(input_value: any): boolean {
    return normalizeBooleanInput(input_value);
  }

  /**
   * Get all supported string representations for boolean values
   * 
   * @returns Object with true and false string arrays
   */
  getSupportedStrings(): { true: string[]; false: string[] } {
    return {
      true: ['true', 'yes', '1', 'on', 'enabled'],
      false: ['false', 'no', '0', 'off', 'disabled']
    };
  }

  /**
   * Create a BooleanMapper with standard trust mappings
   * 
   * @param id - The mapper ID
   * @param version - The mapper version
   * @returns A BooleanMapper with standard mappings
   */
  static createStandardTrustMapper(id: string, version: string = '1.0.0'): BooleanMapper {
    return new BooleanMapper({
      id,
      version,
      true_map: { T: 1.0, I: 0.0, F: 0.0 },    // Complete trust
      false_map: { T: 0.0, I: 0.0, F: 1.0 }    // Complete distrust
    });
  }

  /**
   * Create a BooleanMapper with security-focused mappings
   * 
   * @param id - The mapper ID
   * @param version - The mapper version
   * @returns A BooleanMapper with security mappings
   */
  static createSecurityMapper(id: string, version: string = '1.0.0'): BooleanMapper {
    return new BooleanMapper({
      id,
      version,
      true_map: { T: 0.9, I: 0.1, F: 0.0 },    // High trust with some uncertainty
      false_map: { T: 0.0, I: 0.0, F: 1.0 }    // Complete failure
    });
  }

  /**
   * Create a BooleanMapper with conservative mappings
   * 
   * @param id - The mapper ID
   * @param version - The mapper version
   * @returns A BooleanMapper with conservative mappings
   */
  static createConservativeMapper(id: string, version: string = '1.0.0'): BooleanMapper {
    return new BooleanMapper({
      id,
      version,
      true_map: { T: 0.7, I: 0.3, F: 0.0 },    // Moderate trust with uncertainty
      false_map: { T: 0.0, I: 0.2, F: 0.8 }    // High failure with some uncertainty
    });
  }
}
