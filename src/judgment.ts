/**
 * NeutrosophicJudgment - Core data structure for OpenTrust Protocol
 * 
 * Represents evidence with Truth (T), Indeterminacy (I), and Falsity (F) components,
 * along with an immutable provenance chain for auditability.
 */

export interface ProvenanceEntry {
  /** Unique identifier for the source */
  source_id: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Human-readable description */
  description?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export class NeutrosophicJudgment {
  /** Degree of Truth [0.0, 1.0] */
  public readonly T: number;
  
  /** Degree of Indeterminacy [0.0, 1.0] */
  public readonly I: number;
  
  /** Degree of Falsity [0.0, 1.0] */
  public readonly F: number;
  
  /** Immutable provenance chain for auditability */
  public readonly provenance_chain: readonly ProvenanceEntry[];

  /**
   * Creates a new NeutrosophicJudgment
   * @param T - Truth degree [0.0, 1.0]
   * @param I - Indeterminacy degree [0.0, 1.0]
   * @param F - Falsity degree [0.0, 1.0]
   * @param provenance_chain - Immutable audit trail
   * @throws {Error} If validation fails
   */
  constructor(
    T: number,
    I: number,
    F: number,
    provenance_chain: ProvenanceEntry[]
  ) {
    this.validate(T, I, F, provenance_chain);
    
    this.T = T;
    this.I = I;
    this.F = F;
    this.provenance_chain = Object.freeze([...provenance_chain]);
  }

  /**
   * Validates the judgment parameters
   * @private
   */
  private validate(T: number, I: number, F: number, provenance_chain: ProvenanceEntry[]): void {
    // Range validation
    if (T < 0 || T > 1) {
      throw new Error('T value must be between 0 and 1');
    }
    if (I < 0 || I > 1) {
      throw new Error('I value must be between 0 and 1');
    }
    if (F < 0 || F > 1) {
      throw new Error('F value must be between 0 and 1');
    }

    // Conservation constraint
    if (T + I + F > 1.0) {
      throw new Error('Conservation constraint violated: T + I + F > 1.0');
    }

    // Provenance chain validation
    if (!Array.isArray(provenance_chain) || provenance_chain.length === 0) {
      throw new Error('Provenance chain cannot be empty');
    }

    for (const entry of provenance_chain) {
      if (!entry.source_id || typeof entry.source_id !== 'string') {
        throw new Error('Provenance entry must have source_id');
      }
      if (!entry.timestamp || typeof entry.timestamp !== 'string') {
        throw new Error('Provenance entry must have timestamp');
      }
    }
  }

  /**
   * Returns a JSON representation of the judgment
   */
  toJSON(): object {
    return {
      T: this.T,
      I: this.I,
      F: this.F,
      provenance_chain: this.provenance_chain
    };
  }

  /**
   * Creates a judgment from JSON
   * @param json - JSON object with T, I, F, and provenance_chain
   */
  static fromJSON(json: any): NeutrosophicJudgment {
    return new NeutrosophicJudgment(
      json.T,
      json.I,
      json.F,
      json.provenance_chain
    );
  }

  /**
   * Returns a string representation of the judgment
   */
  toString(): string {
    return `NeutrosophicJudgment(T=${this.T}, I=${this.I}, F=${this.F})`;
  }

  /**
   * Checks if this judgment is equal to another
   * @param other - Another NeutrosophicJudgment
   */
  equals(other: NeutrosophicJudgment): boolean {
    return (
      this.T === other.T &&
      this.I === other.I &&
      this.F === other.F &&
      JSON.stringify(this.provenance_chain) === JSON.stringify(other.provenance_chain)
    );
  }
}
