/**
 * CategoricalMapper Implementation
 * ================================
 * 
 * Transforms string/categorical values into predefined Neutrosophic Judgments.
 * Maps predefined string categories to specific T, I, F values.
 */

import { NeutrosophicJudgment } from '../judgment';
import { 
  Mapper, 
  MapperType, 
  CategoricalParams, 
  InputError, 
  ValidationError,
  createTimestamp,
  validateJudgmentValues
} from './types';

/**
 * CategoricalMapper for transforming string/categorical values
 * 
 * Maps predefined string categories to specific Neutrosophic Judgments.
 * Supports a default_judgment for unknown categories.
 * 
 * Example:
 * ```typescript
 * const mapper = new CategoricalMapper({
 *   id: 'kyc-status',
 *   version: '1.0.0',
 *   mappings: {
 *     'VERIFIED': { T: 1.0, I: 0.0, F: 0.0 },
 *     'PENDING': { T: 0.0, I: 1.0, F: 0.0 },
 *     'REJECTED': { T: 0.0, I: 0.0, F: 1.0 }
 *   },
 *   default_judgment: { T: 0.0, I: 0.0, F: 1.0 }
 * });
 * 
 * const judgment = mapper.apply('VERIFIED');
 * // Result: T=1.0, I=0.0, F=0.0
 * ```
 */
export class CategoricalMapper implements Mapper {
  public readonly mapper_type = MapperType.CATEGORICAL;
  public readonly parameters: CategoricalParams;

  constructor(params: CategoricalParams) {
    this.parameters = params;
    this.validate();
  }

  /**
   * Validate the mapper configuration
   */
  validate(): boolean {
    const { mappings, default_judgment } = this.parameters;
    
    // Validate that all judgments in mappings are valid
    for (const [category, judgment_data] of Object.entries(mappings)) {
      try {
        validateJudgmentValues(judgment_data.T, judgment_data.I, judgment_data.F);
      } catch (error) {
        throw new ValidationError(
          `Invalid judgment for category '${category}' in CategoricalMapper: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    
    // Validate default_judgment if provided
    if (default_judgment) {
      try {
        validateJudgmentValues(default_judgment.T, default_judgment.I, default_judgment.F);
      } catch (error) {
        throw new ValidationError(
          `Invalid default_judgment in CategoricalMapper: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    
    return true;
  }

  /**
   * Apply the categorical mapping to an input string value
   * 
   * @param input_value - The string category to transform
   * @returns A NeutrosophicJudgment corresponding to the category
   * @throws InputError if the category is not found and no default_judgment is defined
   */
  apply(input_value: string): NeutrosophicJudgment {
    if (typeof input_value !== 'string') {
      throw new InputError(`Input for CategoricalMapper must be a string, got ${typeof input_value}`);
    }

    const { mappings, default_judgment } = this.parameters;
    const judgment_data = mappings[input_value];

    if (judgment_data) {
      // Category found in mappings
      const provenance_entry = this.createProvenanceEntry(input_value);
      return new NeutrosophicJudgment(
        judgment_data.T,
        judgment_data.I,
        judgment_data.F,
        [provenance_entry as any]
      );
    } else if (default_judgment) {
      // Category not found, use default
      const provenance_entry = this.createProvenanceEntry(input_value);
      return new NeutrosophicJudgment(
        default_judgment.T,
        default_judgment.I,
        default_judgment.F,
        [provenance_entry as any]
      );
    } else {
      // Category not found and no default
      throw new InputError(
        `Input category '${input_value}' not found in mapper and no default_judgment is defined`
      );
    }
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
          type: this.mapper_type
        }
      }
    };
  }

  /**
   * Get all available categories
   * 
   * @returns Array of category names
   */
  getCategories(): string[] {
    return Object.keys(this.parameters.mappings);
  }

  /**
   * Check if a category exists in the mappings
   * 
   * @param category - The category to check
   * @returns true if the category exists
   */
  hasCategory(category: string): boolean {
    return category in this.parameters.mappings;
  }

  /**
   * Get the judgment for a specific category (without applying the mapper)
   * 
   * @param category - The category to get judgment for
   * @returns The judgment data or undefined if not found
   */
  getJudgmentForCategory(category: string): { T: number; I: number; F: number } | undefined {
    return this.parameters.mappings[category];
  }

  /**
   * Add a new category mapping
   * 
   * @param category - The category name
   * @param judgment - The judgment values
   * @throws ValidationError if judgment values are invalid
   */
  addCategory(category: string, judgment: { T: number; I: number; F: number }): void {
    validateJudgmentValues(judgment.T, judgment.I, judgment.F);
    this.parameters.mappings[category] = judgment;
  }

  /**
   * Remove a category mapping
   * 
   * @param category - The category to remove
   * @returns true if removed, false if not found
   */
  removeCategory(category: string): boolean {
    if (category in this.parameters.mappings) {
      delete this.parameters.mappings[category];
      return true;
    }
    return false;
  }

  /**
   * Update the default judgment
   * 
   * @param judgment - The new default judgment
   * @throws ValidationError if judgment values are invalid
   */
  setDefaultJudgment(judgment: { T: number; I: number; F: number }): void {
    validateJudgmentValues(judgment.T, judgment.I, judgment.F);
    this.parameters.default_judgment = judgment;
  }

  /**
   * Clear the default judgment
   */
  clearDefaultJudgment(): void {
    delete this.parameters.default_judgment;
  }
}
