/**
 * OpenTrust Protocol (OTP) JavaScript SDK
 * ======================================
 * 
 * **REVOLUTIONARY UPDATE**: OTP v2.0 introduces the **Zero Pillar: Conformance Seals**
 * 
 * This package is the official JavaScript implementation of the OpenTrust Protocol with
 * **mathematical proof of conformance**. Every fusion operation now generates a
 * cryptographic SHA-256 hash that proves the operation was performed according
 * to the exact OTP specification.
 * 
 * This transforms OTP from a trust protocol into **the mathematical embodiment of trust itself**.
 * 
 * Core Components:
 * ----------------
 * - NeutrosophicJudgment: The main class for representing evidence (T, I, F).
 * - Fusion operators: Functions for combining multiple judgments with Conformance Seals.
 * - Conformance Seals: Cryptographic fingerprints for mathematical proof of conformance.
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
export const VERSION = '2.0.0';

// CI/CD Test - Sun Sep 21 10:57:57 -03 2025
