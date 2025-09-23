/**
 * NumericalMapper Implementation
 * =============================
 * 
 * Transforms continuous numerical values using a "geometry of judgment"
 * approach with three reference points: falsity_point, indeterminacy_point, and truth_point.
 */

import { NeutrosophicJudgment } from '../judgment';
import { 
  Mapper, 
  MapperType, 
  NumericalParams, 
  InputError, 
  ValidationError,
  createTimestamp,
  validateJudgmentValues
} from './types';

/**
 * NumericalMapper for transforming continuous numerical values
 * 
 * Uses geometric interpolation between three reference points:
 * - falsity_point: Maximum falsity (F=1)
 * - indeterminacy_point: Maximum indeterminacy (I=1) 
 * - truth_point: Maximum truth (T=1)
 * 
 * The interpolation creates smooth transitions between these points,
 * ensuring the conservation constraint T + I + F = 1.0 is always met.
 */
export class NumericalMapper implements Mapper {
  public readonly mapper_type = MapperType.NUMERICAL;
  public readonly parameters: NumericalParams;

  constructor(params: NumericalParams) {
    this.parameters = {
      ...params,
      clamp_to_range: params.clamp_to_range ?? true
    };
    
    this.validate();
  }

  /**
   * Validate the mapper configuration
   */
  validate(): boolean {
    const { falsity_point, indeterminacy_point, truth_point } = this.parameters;
    
    // Ensure points are distinct for meaningful interpolation
    const points = [falsity_point, indeterminacy_point, truth_point];
    const uniquePoints = new Set(points);
    
    if (uniquePoints.size < 3) {
      throw new ValidationError(
        'falsity_point, indeterminacy_point, and truth_point must be distinct for NumericalMapper'
      );
    }
    
    return true;
  }

  /**
   * Apply the numerical mapping algorithm to an input value
   * 
   * @param input_value - The numerical value to transform
   * @returns A NeutrosophicJudgment representing the transformed value
   * @throws InputError if the input is invalid or out of range
   */
  apply(input_value: number): NeutrosophicJudgment {
    if (typeof input_value !== 'number') {
      throw new InputError(`Input for NumericalMapper must be a number, got ${typeof input_value}`);
    }

    const { falsity_point, truth_point, clamp_to_range } = this.parameters;
    
    // Determine min/max points for clamping
    const min_point = Math.min(falsity_point, truth_point);
    const max_point = Math.max(falsity_point, truth_point);

    // Clamp input value if enabled
    let clamped_value = input_value;
    if (clamp_to_range) {
      clamped_value = Math.max(min_point, Math.min(max_point, input_value));
    } else if (input_value < min_point || input_value > max_point) {
      throw new InputError(
        `Input value ${input_value} is out of the defined mapper range [${min_point}, ${max_point}] and clamp_to_range is False`
      );
    }

    // Calculate T, I, F values using geometric interpolation
    const { T, I, F } = this.calculateInterpolation(clamped_value);

    // Create provenance entry
    const provenance_entry = this.createProvenanceEntry(input_value);

    return new NeutrosophicJudgment(T, I, F, [provenance_entry as any]);
  }

  /**
   * Calculate T, I, F values using geometric interpolation
   * 
   * @param input_value - The clamped input value
   * @returns Object with T, I, F values
   */
  private calculateInterpolation(input_value: number): { T: number; I: number; F: number } {
    const { falsity_point, indeterminacy_point, truth_point } = this.parameters;
    
    let T = 0.0, I = 0.0, F = 0.0;

    // Sort points to handle any order of definition
    const points_sorted = [
      { value: falsity_point, type: 'F' as const },
      { value: indeterminacy_point, type: 'I' as const },
      { value: truth_point, type: 'T' as const }
    ].sort((a, b) => a.value - b.value);
    
    // Find the segment where the input_value lies
    if (input_value <= points_sorted[0]!.value) {
      // Before the first point (clamped to first point)
      if (points_sorted[0]!.type === 'F') F = 1.0;
      else if (points_sorted[0]!.type === 'I') I = 1.0;
      else T = 1.0;
    } else if (input_value >= points_sorted[2]!.value) {
      // After the last point (clamped to last point)
      if (points_sorted[2]!.type === 'T') T = 1.0;
      else if (points_sorted[2]!.type === 'I') I = 1.0;
      else F = 1.0;
    } else {
      // Within the range of the three points
      // Determine the actual order of points for interpolation
      if ((falsity_point <= indeterminacy_point && indeterminacy_point <= truth_point) ||
          (falsity_point >= indeterminacy_point && indeterminacy_point >= truth_point)) {
        // F-I-T or T-I-F progression
        if (this.isInSegment(input_value, falsity_point, indeterminacy_point) && falsity_point !== indeterminacy_point) {
          // Zone Falsity <-> Indeterminacy
          const ratio = Math.abs(input_value - falsity_point) / Math.abs(indeterminacy_point - falsity_point);
          I = ratio;
          F = 1.0 - ratio;
        } else if (this.isInSegment(input_value, indeterminacy_point, truth_point) && indeterminacy_point !== truth_point) {
          // Zone Indeterminacy <-> Truth
          const ratio = Math.abs(input_value - indeterminacy_point) / Math.abs(truth_point - indeterminacy_point);
          T = ratio;
          I = 1.0 - ratio;
        } else if (falsity_point === indeterminacy_point && input_value === falsity_point) {
          // Edge case: F and I are same point
          I = 1.0;
        } else if (indeterminacy_point === truth_point && input_value === indeterminacy_point) {
          // Edge case: I and T are same point
          I = 1.0;
        } else if (falsity_point === truth_point && input_value === falsity_point) {
          // Edge case: F and T are same point (implies I is also there)
          I = 1.0;
        }
      } else {
        // Other permutations like F-T-I, I-F-T, etc.
        // This case implies a non-standard ordering of points.
        // For simplicity and adherence to the visual logic, we assume F-I-T or T-I-F.
        // If points are not ordered, the interpolation logic needs to be more complex.
        
        // Determine the actual segments based on input_value's position relative to p_f, p_i, p_t
        if (this.isInSegment(input_value, falsity_point, indeterminacy_point) && falsity_point !== indeterminacy_point) {
          // Input is in the F-I segment
          const ratio = Math.abs(input_value - falsity_point) / Math.abs(indeterminacy_point - falsity_point);
          I = ratio;
          F = 1.0 - ratio;
        } else if (this.isInSegment(input_value, indeterminacy_point, truth_point) && indeterminacy_point !== truth_point) {
          // Input is in the I-T segment
          const ratio = Math.abs(input_value - indeterminacy_point) / Math.abs(truth_point - indeterminacy_point);
          T = ratio;
          I = 1.0 - ratio;
        } else {
          // This case should ideally not be reached if input is within min_point and max_point
          // and points are distinct. If it is, it means input is exactly on one of the points
          // or an unexpected configuration.
          if (input_value === falsity_point) F = 1.0;
          else if (input_value === indeterminacy_point) I = 1.0;
          else if (input_value === truth_point) T = 1.0;
        }
      }
    }

    // Validate the result
    validateJudgmentValues(T, I, F);
    
    return { T, I, F };
  }

  /**
   * Check if a value is within a segment (inclusive)
   * 
   * @param value - The value to check
   * @param start - Start of the segment
   * @param end - End of the segment
   * @returns true if value is within the segment
   */
  private isInSegment(value: number, start: number, end: number): boolean {
    const min = Math.min(start, end);
    const max = Math.max(start, end);
    return value >= min && value <= max;
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
}
