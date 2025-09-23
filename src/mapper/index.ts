/**
 * OTP Mapper Module - Main Export
 * ================================
 * 
 * This module provides tools for transforming raw data into Neutrosophic Judgments.
 * It includes various mapper types (numerical, categorical, boolean) and a registry
 * for managing them, ensuring auditable and consistent data transformation.
 */

// Export types and interfaces
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
  createTimestamp,
  validateJudgmentValues,
  createJudgment,
  normalizeBooleanInput
} from './types';

// Export mapper implementations
export { NumericalMapper } from './numerical';
export { CategoricalMapper } from './categorical';
export { BooleanMapper } from './boolean';

// Export registry and validator
export { MapperRegistry, getGlobalRegistry, resetGlobalRegistry } from './registry';
export { MapperValidator } from './validator';

// Re-export for convenience
export {
  type MapperRegistry as MapperRegistryInterface,
  type MapperValidator as MapperValidatorInterface
} from './types';


