/**
 * Fusion operators for OpenTrust Protocol
 * 
 * **REVOLUTIONARY UPDATE**: All fusion operations now generate:
 * - **Conformance Seals**: Mathematical proof that the operation was performed according to
 *   the exact OTP specification
 * - **Judgment IDs**: Unique identifiers for Circle of Trust tracking and Performance Oracle
 * 
 * This transforms OTP into the mathematical embodiment of trust itself, enabling
 * real-world outcome tracking and performance measurement.
 * 
 * This module contains the standard functions for combining multiple
 * Neutrosophic Judgments into a single, aggregated judgment with cryptographic proof.
 */

import { NeutrosophicJudgment, ProvenanceEntry } from './judgment';
import { generateConformanceSeal, createFusionProvenanceEntry } from './conformance';
import { ensureJudgmentId } from './judgment-id';

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
 * Fuses a list of judgments using the conflict-aware weighted average.
 * This is the primary and recommended operator in OTP.
 * 
 * **REVOLUTIONARY**: The fused judgment automatically includes:
 * - **Conformance Seal**: Mathematical proof of specification compliance
 * - **Judgment ID**: Unique identifier for Circle of Trust tracking
 * 
 * @param judgments - A list of NeutrosophicJudgment objects to fuse
 * @param weights - A list of numeric weights corresponding to each judgment
 * @returns A new NeutrosophicJudgment object representing the fused judgment with
 *          automatic Conformance Seal and Judgment ID generation
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

  // **REVOLUTIONARY**: Generate Conformance Seal
  let conformanceSeal: string | undefined;
  try {
    conformanceSeal = generateConformanceSeal(judgments, weights, 'otp-cawa-v1.1');
  } catch (error) {
    // If seal generation fails, we should still proceed but log the error
    // This ensures backward compatibility
    console.warn(`Failed to generate conformance seal: ${error}`);
    conformanceSeal = undefined;
  }

  // Build the new provenance chain
  const newProvenance: ProvenanceEntry[] = [];
  for (const judgment of judgments) {
    newProvenance.push(...judgment.provenance_chain);
  }
  
  // Create fusion provenance entry with Conformance Seal
  const fusionEntry = createFusionProvenanceEntry(
    'otp-cawa-v1.1',
    new Date().toISOString(),
    conformanceSeal || 'seal-generation-failed',
    'Conflict-aware weighted average fusion operation with Conformance Seal',
    {
      operator: 'conflict_aware_weighted_average',
      input_count: judgments.length,
      weights: weights,
      version: '3.0.0'
    }
  );
  
  newProvenance.push(fusionEntry);

  // Create the fused judgment
  const fusedJudgment = new NeutrosophicJudgment(finalT, finalI, finalF, newProvenance);
  
  // **REVOLUTIONARY**: Ensure the judgment has a unique ID for Circle of Trust
  return ensureJudgmentId(fusedJudgment);
}

/**
 * Fuses judgments by prioritizing the maximum T value and the minimum F value.
 * Useful for opportunity analysis or "best-case" scenarios.
 * 
 * **REVOLUTIONARY**: The fused judgment automatically includes:
 * - **Conformance Seal**: Mathematical proof of specification compliance
 * - **Judgment ID**: Unique identifier for Circle of Trust tracking
 * 
 * @param judgments - A list of NeutrosophicJudgment objects
 * @returns A new NeutrosophicJudgment with the max T, min F, and average I,
 *          plus automatic Conformance Seal and Judgment ID generation
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

  // **REVOLUTIONARY**: Generate Conformance Seal
  // For operations without weights, we use equal weights
  const equalWeights = Array(judgments.length).fill(1.0);
  let conformanceSeal: string | undefined;
  try {
    conformanceSeal = generateConformanceSeal(judgments, equalWeights, 'otp-optimistic-v1.1');
  } catch (error) {
    console.warn(`Failed to generate conformance seal: ${error}`);
    conformanceSeal = undefined;
  }

  // Build the new provenance chain
  const newProvenance: ProvenanceEntry[] = [];
  for (const judgment of judgments) {
    newProvenance.push(...judgment.provenance_chain);
  }
  
  // Create fusion provenance entry with Conformance Seal
  const fusionEntry = createFusionProvenanceEntry(
    'otp-optimistic-v1.1',
    new Date().toISOString(),
    conformanceSeal || 'seal-generation-failed',
    'Optimistic fusion operation with Conformance Seal',
    {
      operator: 'optimistic_fusion',
      input_count: judgments.length,
      weights: equalWeights,
      version: '3.0.0'
    }
  );
  
  newProvenance.push(fusionEntry);

  // Create the fused judgment
  const fusedJudgment = new NeutrosophicJudgment(finalT, finalI, finalF, newProvenance);
  
  // **REVOLUTIONARY**: Ensure the judgment has a unique ID for Circle of Trust
  return ensureJudgmentId(fusedJudgment);
}

/**
 * Fuses judgments by prioritizing the maximum F value and the minimum T value.
 * Indispensable for risk analysis or "worst-case" scenarios.
 * 
 * **REVOLUTIONARY**: The fused judgment automatically includes:
 * - **Conformance Seal**: Mathematical proof of specification compliance
 * - **Judgment ID**: Unique identifier for Circle of Trust tracking
 * 
 * @param judgments - A list of NeutrosophicJudgment objects
 * @returns A new NeutrosophicJudgment with the max F, min T, and average I,
 *          plus automatic Conformance Seal and Judgment ID generation
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

  // **REVOLUTIONARY**: Generate Conformance Seal
  // For operations without weights, we use equal weights
  const equalWeights = Array(judgments.length).fill(1.0);
  let conformanceSeal: string | undefined;
  try {
    conformanceSeal = generateConformanceSeal(judgments, equalWeights, 'otp-pessimistic-v1.1');
  } catch (error) {
    console.warn(`Failed to generate conformance seal: ${error}`);
    conformanceSeal = undefined;
  }

  // Build the new provenance chain
  const newProvenance: ProvenanceEntry[] = [];
  for (const judgment of judgments) {
    newProvenance.push(...judgment.provenance_chain);
  }
  
  // Create fusion provenance entry with Conformance Seal
  const fusionEntry = createFusionProvenanceEntry(
    'otp-pessimistic-v1.1',
    new Date().toISOString(),
    conformanceSeal || 'seal-generation-failed',
    'Pessimistic fusion operation with Conformance Seal',
    {
      operator: 'pessimistic_fusion',
      input_count: judgments.length,
      weights: equalWeights,
      version: '3.0.0'
    }
  );
  
  newProvenance.push(fusionEntry);

  // Create the fused judgment
  const fusedJudgment = new NeutrosophicJudgment(finalT, finalI, finalF, newProvenance);
  
  // **REVOLUTIONARY**: Ensure the judgment has a unique ID for Circle of Trust
  return ensureJudgmentId(fusedJudgment);
}