/**
 * Fusion operators for OpenTrust Protocol
 * 
 * This module contains the standard functions for combining multiple
 * Neutrosophic Judgments into a single, aggregated judgment.
 */

import { NeutrosophicJudgment, ProvenanceEntry } from './judgment';

/**
 * Validates inputs for fusion functions
 * @private
 */
function validateInputs(
  judgments: NeutrosophicJudgment[], 
  weights?: number[]
): void {
  if (!judgments || judgments.length === 0) {
    throw new Error('Judgments list cannot be empty');
  }
  
  if (!judgments.every(j => j instanceof NeutrosophicJudgment)) {
    throw new Error('All items in the judgments list must be of type NeutrosophicJudgment');
  }
  
  if (weights) {
    if (judgments.length !== weights.length) {
      throw new Error('Judgments list and weights list must have the same length');
    }
    
    if (!weights.every(w => typeof w === 'number' && !isNaN(w))) {
      throw new Error('All weights must be numeric');
    }
  }
}

/**
 * Creates a new provenance entry for fusion operations
 * @private
 */
function createFusionProvenance(
  operator: string,
  judgments: NeutrosophicJudgment[],
  weights?: number[]
): ProvenanceEntry {
  return {
    source_id: operator,
    timestamp: new Date().toISOString(),
    description: `Fusion operation using ${operator}`,
    metadata: {
      operator,
      input_count: judgments.length,
      weights: weights || null,
      version: '1.0.0'
    }
  };
}

/**
 * Fuses a list of judgments using the conflict-aware weighted average.
 * This is the primary and recommended operator in OTP.
 * 
 * @param judgments - A list of NeutrosophicJudgment objects to fuse
 * @param weights - A list of numeric weights corresponding to each judgment
 * @returns A new NeutrosophicJudgment object representing the fused judgment
 * @throws {Error} If validation fails
 */
export function conflict_aware_weighted_average(
  judgments: NeutrosophicJudgment[], 
  weights: number[]
): NeutrosophicJudgment {
  validateInputs(judgments, weights);

  // Calculate adjusted weights based on conflicts
  const adjustedWeights: number[] = [];
  for (let i = 0; i < judgments.length; i++) {
    const judgment = judgments[i]!;
    const conflictScore = judgment.T * judgment.F;
    const adjustedWeight = weights[i]! * (1 - conflictScore);
    adjustedWeights.push(adjustedWeight);
  }
  
  const totalAdjustedWeight = adjustedWeights.reduce((sum, w) => sum + w, 0);
  
  let finalT: number, finalI: number, finalF: number;
  
  if (totalAdjustedWeight === 0) {
    // Edge case: all adjusted weights are zero, fallback to unweighted average
    const numJudgments = judgments.length;
    finalT = judgments.reduce((sum, j) => sum + j.T, 0) / numJudgments;
    finalI = judgments.reduce((sum, j) => sum + j.I, 0) / numJudgments;
    finalF = judgments.reduce((sum, j) => sum + j.F, 0) / numJudgments;
  } else {
    // Normal case: use adjusted weights
    finalT = judgments.reduce((sum, j, i) => sum + j.T * adjustedWeights[i]!, 0) / totalAdjustedWeight;
    finalI = judgments.reduce((sum, j, i) => sum + j.I * adjustedWeights[i]!, 0) / totalAdjustedWeight;
    finalF = judgments.reduce((sum, j, i) => sum + j.F * adjustedWeights[i]!, 0) / totalAdjustedWeight;
  }

  // Build the new provenance chain
  const newProvenance: ProvenanceEntry[] = [];
  for (const judgment of judgments) {
    newProvenance.push(...judgment.provenance_chain);
  }
  newProvenance.push(createFusionProvenance('otp-cawa-v1.0', judgments, weights));

  return new NeutrosophicJudgment(finalT, finalI, finalF, newProvenance);
}

/**
 * Fuses judgments by prioritizing the maximum T value and the minimum F value.
 * Useful for opportunity analysis or "best-case" scenarios.
 * 
 * @param judgments - A list of NeutrosophicJudgment objects
 * @returns A new NeutrosophicJudgment with the max T, min F, and average I
 * @throws {Error} If validation fails
 */
export function optimistic_fusion(judgments: NeutrosophicJudgment[]): NeutrosophicJudgment {
  validateInputs(judgments);
  
  let finalT = Math.max(...judgments.map(j => j.T));
  let finalF = Math.min(...judgments.map(j => j.F));
  let finalI = judgments.reduce((sum, j) => sum + j.I, 0) / judgments.length;

  // Ensure conservation constraint is satisfied
  const total = finalT + finalI + finalF;
  if (total > 1.0) {
    // Scale down proportionally to maintain relative relationships
    finalT = finalT / total;
    finalI = finalI / total;
    finalF = finalF / total;
  }

  // Build the new provenance chain
  const newProvenance: ProvenanceEntry[] = [];
  for (const judgment of judgments) {
    newProvenance.push(...judgment.provenance_chain);
  }
  newProvenance.push(createFusionProvenance('otp-optimistic-v1.0', judgments));

  return new NeutrosophicJudgment(finalT, finalI, finalF, newProvenance);
}

/**
 * Fuses judgments by prioritizing the maximum F value and the minimum T value.
 * Indispensable for risk analysis or "worst-case" scenarios.
 * 
 * @param judgments - A list of NeutrosophicJudgment objects
 * @returns A new NeutrosophicJudgment with the max F, min T, and average I
 * @throws {Error} If validation fails
 */
export function pessimistic_fusion(judgments: NeutrosophicJudgment[]): NeutrosophicJudgment {
  validateInputs(judgments);

  let finalT = Math.min(...judgments.map(j => j.T));
  let finalF = Math.max(...judgments.map(j => j.F));
  let finalI = judgments.reduce((sum, j) => sum + j.I, 0) / judgments.length;

  // Ensure conservation constraint is satisfied
  const total = finalT + finalI + finalF;
  if (total > 1.0) {
    // Scale down proportionally to maintain relative relationships
    finalT = finalT / total;
    finalI = finalI / total;
    finalF = finalF / total;
  }

  // Build the new provenance chain
  const newProvenance: ProvenanceEntry[] = [];
  for (const judgment of judgments) {
    newProvenance.push(...judgment.provenance_chain);
  }
  newProvenance.push(createFusionProvenance('otp-pessimistic-v1.0', judgments));

  return new NeutrosophicJudgment(finalT, finalI, finalF, newProvenance);
}
