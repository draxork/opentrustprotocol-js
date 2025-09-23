/**
 * OpenTrust Protocol (OTP) JavaScript SDK
 * ======================================
 * 
 * **REVOLUTIONARY UPDATE**: OTP v3.0 introduces:
 * - **Zero Pillar**: Proof-of-Conformance Seals (cryptographic proof of specification compliance)
 * - **First Pillar**: Performance Oracle (Circle of Trust for real-world outcome tracking)
 * 
 * This package is the official JavaScript implementation of the OpenTrust Protocol with
 * **mathematical proof of conformance** and **Performance Oracle capabilities**.
 * Every fusion operation now generates a cryptographic SHA-256 hash that proves
 * the operation was performed according to the exact OTP specification.
 * Additionally, the Performance Oracle system enables tracking real-world outcomes
 * to measure the effectiveness of OTP-based decisions.
 * 
 * This transforms OTP from a trust protocol into **the mathematical embodiment of trust itself**.
 * 
 * Core Components:
 * ----------------
 * - NeutrosophicJudgment: The main class for representing evidence (T, I, F).
 * - Fusion operators: Functions for combining multiple judgments with Conformance Seals.
 * - Conformance Seals: Cryptographic fingerprints for mathematical proof of conformance.
 * - Judgment ID System: Unique identifiers for Circle of Trust tracking.
 * - Performance Oracle: Real-world outcome tracking and measurement.
 * - OTP Mappers: Tools for transforming raw data into Neutrosophic Judgments.
 * 
 * For more information, please visit the official documentation at https://opentrustprotocol.com
 */

// Export the main components
export { NeutrosophicJudgment, type ProvenanceEntry } from './judgment';
export { 
  conflict_aware_weighted_average, 
  optimistic_fusion, 
  pessimistic_fusion 
} from './fusion';

// **REVOLUTIONARY**: Export Conformance Seal module
export {
  generateConformanceSeal,
  verifyConformanceSeal,
  verifyConformanceSealWithInputs,
  createFusionProvenanceEntry,
  ConformanceError
} from './conformance';

// **REVOLUTIONARY**: Export Judgment ID module for Performance Oracle
export {
  generateJudgmentId,
  ensureJudgmentId,
  createOutcomeJudgment,
  outcomeJudgmentToNeutrosophic,
  OutcomeType,
  type OutcomeJudgment
} from './judgment-id';

// Export OTP Mapper components
export {
  MapperType,
  type BaseMapperParams,
  type NumericalParams,
  type CategoricalParams,
  type BooleanParams,
  type MapperParams,
  type Mapper,
  type MapperRegistry as IMapperRegistry,
  type MapperValidator as IMapperValidator,
  MapperError,
  InputError,
  ValidationError,
  NumericalMapper,
  CategoricalMapper,
  BooleanMapper,
  MapperRegistry,
  MapperValidator,
  getGlobalRegistry,
  resetGlobalRegistry,
  createTimestamp,
  validateJudgmentValues,
  createJudgment,
  normalizeBooleanInput
} from './mapper';

// Package version - **REVOLUTIONARY UPDATE**
export const VERSION = '3.0.0';

// CI/CD Test - Sun Sep 21 10:57:57 -03 2025
