/**
 * OpenTrust Protocol (OTP) JavaScript SDK
 * ======================================
 * 
 * This package is the official JavaScript implementation of the OpenTrust Protocol.
 * 
 * It provides the necessary tools to create, validate, and fuse
 * Neutrosophic Judgments.
 * 
 * Core Components:
 * ----------------
 * - NeutrosophicJudgment: The main class for representing evidence (T, I, F).
 * - Fusion operators: Functions for combining multiple judgments.
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

// Package version
export const VERSION = '1.0.2';
