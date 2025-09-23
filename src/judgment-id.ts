/**
 * Judgment ID System for Circle of Trust
 * 
 * This module implements the Judgment ID system that enables the Performance Oracle
 * and Circle of Trust functionality. The Judgment ID is a SHA-256 hash of the
 * canonical representation of a Neutrosophic Judgment, used to link decisions
 * with their real-world outcomes.
 */

import { NeutrosophicJudgment, ProvenanceEntry } from './judgment';
import { createHash } from 'crypto';

/**
 * Type of outcome for Performance Oracle
 */
export enum OutcomeType {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial'
}

/**
 * Outcome Judgment for Performance Oracle
 * 
 * An Outcome Judgment represents the real-world result of a decision
 * that was informed by a Neutrosophic Judgment. It links back to the
 * original decision through the `links_to_judgment_id` field.
 */
export interface OutcomeJudgment {
  /** Unique identifier for this outcome judgment */
  judgment_id: string;
  /** Links to the original decision judgment */
  links_to_judgment_id: string;
  /** Truth degree (usually binary: 1.0 for success, 0.0 for failure) */
  T: number;
  /** Indeterminacy degree (usually 0.0 for outcomes) */
  I: number;
  /** Falsity degree (usually binary: 0.0 for success, 1.0 for failure) */
  F: number;
  /** Type of outcome */
  outcome_type: OutcomeType;
  /** Source of the oracle that recorded this outcome */
  oracle_source: string;
  /** Provenance chain for this outcome */
  provenance_chain: readonly ProvenanceEntry[];
}

/**
 * Canonical representation of a Neutrosophic Judgment for ID generation
 */
interface CanonicalJudgment {
  T: number;
  I: number;
  F: number;
  provenance_chain: CanonicalProvenanceEntry[];
}

/**
 * Canonical representation of a Provenance Entry for ID generation
 */
interface CanonicalProvenanceEntry {
  source_id: string;
  timestamp: string;
  description?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

/**
 * Generates a Judgment ID for a Neutrosophic Judgment
 * 
 * The Judgment ID is a SHA-256 hash of the canonical representation
 * of the judgment, excluding the judgment_id field itself to avoid
 * recursive hashing.
 * 
 * @param judgment - The Neutrosophic Judgment to generate an ID for
 * @returns A SHA-256 hash as a hexadecimal string
 * 
 * @example
 * ```typescript
 * import { NeutrosophicJudgment, generateJudgmentId } from 'opentrustprotocol';
 * 
 * const judgment = new NeutrosophicJudgment(
 *   0.8, 0.2, 0.0,
 *   [{ source_id: 'sensor1', timestamp: '2023-01-01T00:00:00Z' }]
 * );
 * 
 * const judgmentId = generateJudgmentId(judgment);
 * console.log(`Judgment ID: ${judgmentId}`);
 * ```
 */
export function generateJudgmentId(judgment: NeutrosophicJudgment): string {
  // Create canonical representation without judgment_id
  const canonical: CanonicalJudgment = {
    T: judgment.T,
    I: judgment.I,
    F: judgment.F,
    provenance_chain: judgment.provenance_chain.map(entry => ({
      source_id: entry.source_id,
      timestamp: entry.timestamp,
      description: entry.description,
      metadata: entry.metadata,
      // Exclude conformance_seal for consistency with existing system
    }))
  };
  
  // Serialize to canonical JSON
  const canonicalJson = JSON.stringify(canonical, null, 0);
  
  // Generate SHA-256 hash
  const hash = createHash('sha256');
  hash.update(canonicalJson, 'utf8');
  return hash.digest('hex');
}

/**
 * Ensures a Neutrosophic Judgment has a Judgment ID
 * 
 * If the judgment already has a judgment_id in its provenance_chain,
 * returns it unchanged. If not, generates a new judgment_id and returns
 * a new judgment with it added to the provenance chain.
 * 
 * @param judgment - The Neutrosophic Judgment to ensure has an ID
 * @returns A Neutrosophic Judgment with a judgment_id in its provenance chain
 */
export function ensureJudgmentId(judgment: NeutrosophicJudgment): NeutrosophicJudgment {
  // Check if judgment already has a judgment_id in provenance
  for (const entry of judgment.provenance_chain) {
    if ((entry as any).judgment_id) {
      return judgment;
    }
  }
  
  // Generate new judgment_id
  const judgmentId = generateJudgmentId(judgment);
  
  // Create new provenance entry with judgment_id
  const newProvenanceEntry: ProvenanceEntry & { judgment_id: string } = {
    source_id: 'otp-judgment-id-generator',
    timestamp: new Date().toISOString(),
    description: 'Automatic Judgment ID generation for Circle of Trust',
    judgment_id: judgmentId,
    metadata: {
      generator: 'otp-javascript-v3.0',
      purpose: 'circle-of-trust-tracking'
    }
  };
  
  // Create new judgment with updated provenance chain
  const newProvenanceChain = [...judgment.provenance_chain, newProvenanceEntry];
  
  return new NeutrosophicJudgment(
    judgment.T,
    judgment.I,
    judgment.F,
    newProvenanceChain
  );
}

/**
 * Creates a new Outcome Judgment for Performance Oracle tracking
 * 
 * @param linksToJudgmentId - The ID of the original decision judgment
 * @param T - Truth degree (usually binary: 1.0 for success, 0.0 for failure)
 * @param I - Indeterminacy degree (usually 0.0 for outcomes)
 * @param F - Falsity degree (usually binary: 0.0 for success, 1.0 for failure)
 * @param outcomeType - Type of outcome (SUCCESS, FAILURE, PARTIAL)
 * @param oracleSource - Source of the oracle that recorded this outcome
 * @param provenanceChain - Optional provenance chain for this outcome
 * @returns A new OutcomeJudgment with automatic judgment_id generation
 * 
 * @example
 * ```typescript
 * import { createOutcomeJudgment, OutcomeType } from 'opentrustprotocol';
 * 
 * const outcome = createOutcomeJudgment(
 *   'original_decision_id',
 *   1.0, 0.0, 0.0,
 *   OutcomeType.SUCCESS,
 *   'trading-oracle'
 * );
 * console.log(`Outcome ID: ${outcome.judgment_id}`);
 * ```
 */
export function createOutcomeJudgment(
  linksToJudgmentId: string,
  T: number,
  I: number,
  F: number,
  outcomeType: OutcomeType,
  oracleSource: string,
  provenanceChain: ProvenanceEntry[] = []
): OutcomeJudgment {
  // Validate the outcome judgment parameters
  if (!(0.0 <= T && T <= 1.0)) {
    throw new Error(`T value must be between 0 and 1, but got ${T}`);
  }
  if (!(0.0 <= I && I <= 1.0)) {
    throw new Error(`I value must be between 0 and 1, but got ${I}`);
  }
  if (!(0.0 <= F && F <= 1.0)) {
    throw new Error(`F value must be between 0 and 1, but got ${F}`);
  }

  // Conservation constraint validation
  const total = T + I + F;
  if (total > 1.0) {
    throw new Error(`Conservation constraint violated: T + I + F = ${total} > 1.0`);
  }

  // Add oracle provenance entry
  const oracleEntry: ProvenanceEntry = {
    source_id: oracleSource,
    timestamp: new Date().toISOString(),
    description: `Outcome recorded by ${oracleSource}`,
    metadata: {
      outcome_type: outcomeType,
      links_to_judgment_id: linksToJudgmentId,
      oracle_version: 'otp-javascript-v3.0'
    }
  };
  
  const updatedProvenance = [...provenanceChain, oracleEntry];
  
  // Create temporary NeutrosophicJudgment to generate ID
  const tempJudgment = new NeutrosophicJudgment(
    T, I, F,
    updatedProvenance
  );
  
  const judgmentId = generateJudgmentId(tempJudgment);
  
  return {
    judgment_id: judgmentId,
    links_to_judgment_id: linksToJudgmentId,
    T, I, F,
    outcome_type: outcomeType,
    oracle_source: oracleSource,
    provenance_chain: updatedProvenance
  };
}

/**
 * Converts an Outcome Judgment to a regular Neutrosophic Judgment
 * (without the oracle-specific fields)
 * 
 * @param outcome - The Outcome Judgment to convert
 * @returns A Neutrosophic Judgment
 */
export function outcomeJudgmentToNeutrosophic(outcome: OutcomeJudgment): NeutrosophicJudgment {
  return new NeutrosophicJudgment(
    outcome.T,
    outcome.I,
    outcome.F,
    [...outcome.provenance_chain]
  );
}
