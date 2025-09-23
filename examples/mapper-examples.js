/**
 * OTP Mapper Examples - Real-world Use Cases
 * ===========================================
 * 
 * This file demonstrates practical usage of the OTP Mapper system
 * with real-world scenarios including DeFi, KYC, IoT, and Supply Chain.
 */

const {
  NumericalMapper,
  CategoricalMapper,
  BooleanMapper,
  MapperRegistry,
  MapperValidator,
  conflict_aware_weighted_average
} = require('../dist/index.js');

/**
 * Example 1: DeFi Risk Assessment
 * ===============================
 * 
 * Demonstrates how to assess DeFi protocol risk using multiple data sources
 * including health factor, credit score, and KYC status.
 */
function defiRiskAssessment() {
  console.log('\n🏦 DeFi Risk Assessment Example');
  console.log('================================');

  // Health Factor Mapper - Measures collateralization risk
  const healthMapper = new NumericalMapper({
    id: 'defi-health-factor',
    version: '1.0.0',
    description: 'DeFi Health Factor Assessment',
    falsity_point: 1.0,    // Liquidación inminente
    indeterminacy_point: 1.5,  // Zona de riesgo
    truth_point: 3.0       // Posición segura
  });

  // Credit Score Mapper - Measures creditworthiness
  const creditMapper = new NumericalMapper({
    id: 'credit-score',
    version: '1.0.0',
    description: 'Credit Score Assessment',
    falsity_point: 300,    // Crédito pobre
    indeterminacy_point: 650,  // Crédito promedio
    truth_point: 850      // Crédito excelente
  });

  // KYC Status Mapper - Measures identity verification
  const kycMapper = new CategoricalMapper({
    id: 'kyc-status',
    version: '1.0.0',
    description: 'KYC Verification Status',
    mappings: {
      'VERIFIED': { T: 1.0, I: 0.0, F: 0.0 },
      'PENDING': { T: 0.0, I: 1.0, F: 0.0 },
      'REJECTED': { T: 0.0, I: 0.0, F: 1.0 },
      'PARTIAL': { T: 0.6, I: 0.3, F: 0.1 },
      'EXPIRED': { T: 0.2, I: 0.6, F: 0.2 }
    },
    default_judgment: { T: 0.0, I: 0.0, F: 1.0 }
  });

  // Test different scenarios
  const scenarios = [
    { name: 'High Risk', health: 1.1, credit: 400, kyc: 'REJECTED' },
    { name: 'Medium Risk', health: 1.8, credit: 720, kyc: 'PENDING' },
    { name: 'Low Risk', health: 2.5, credit: 800, kyc: 'VERIFIED' }
  ];

  for (const scenario of scenarios) {
    console.log(`\n📊 Scenario: ${scenario.name}`);
    
    const healthJudgment = healthMapper.apply(scenario.health);
    const creditJudgment = creditMapper.apply(scenario.credit);
    const kycJudgment = kycMapper.apply(scenario.kyc);

    console.log(`  Health Factor ${scenario.health}: T=${healthJudgment.T.toFixed(3)}, I=${healthJudgment.I.toFixed(3)}, F=${healthJudgment.F.toFixed(3)}`);
    console.log(`  Credit Score ${scenario.credit}: T=${creditJudgment.T.toFixed(3)}, I=${creditJudgment.I.toFixed(3)}, F=${creditJudgment.F.toFixed(3)}`);
    console.log(`  KYC Status ${scenario.kyc}: T=${kycJudgment.T.toFixed(3)}, I=${kycJudgment.I.toFixed(3)}, F=${kycJudgment.F.toFixed(3)}`);

    // Fusion with weighted importance
    const weights = [0.4, 0.4, 0.2]; // health, credit, kyc
    const fusedJudgment = conflict_aware_weighted_average(
      [healthJudgment, creditJudgment, kycJudgment],
      weights
    );

    console.log(`  🔀 Fused Result: T=${fusedJudgment.T.toFixed(3)}, I=${fusedJudgment.I.toFixed(3)}, F=${fusedJudgment.F.toFixed(3)}`);
    
    // Interpret result
    let riskLevel = '🟡 MEDIUM';
    if (fusedJudgment.T > 0.7) riskLevel = '🟢 LOW';
    else if (fusedJudgment.F > 0.5) riskLevel = '🔴 HIGH';
    
    console.log(`  📈 Risk Level: ${riskLevel}`);
  }
}

/**
 * Example 2: IoT Monitoring System
 * ================================
 * 
 * Demonstrates how to monitor IoT sensors and assess overall system health
 * using temperature, pressure, and system status data.
 */
function iotMonitoringSystem() {
  console.log('\n🌡️ IoT Monitoring System Example');
  console.log('==================================');

  // Temperature Mapper - Server room temperature monitoring
  const tempMapper = new NumericalMapper({
    id: 'server-room-temp',
    version: '1.0.0',
    description: 'Server Room Temperature Monitoring',
    falsity_point: 35.0,   // Too hot
    indeterminacy_point: 22.0,  // Optimal
    truth_point: 18.0      // Too cold
  });

  // Pressure Mapper - Pressure sensor monitoring
  const pressureMapper = new NumericalMapper({
    id: 'pressure-sensor',
    version: '1.0.0',
    description: 'Pressure Sensor Monitoring',
    falsity_point: 100,    // High pressure
    indeterminacy_point: 50,   // Normal
    truth_point: 20       // Low pressure
  });

  // System Status Mapper - Overall system health
  const statusMapper = new CategoricalMapper({
    id: 'system-status',
    version: '1.0.0',
    description: 'System Status Assessment',
    mappings: {
      'HEALTHY': { T: 1.0, I: 0.0, F: 0.0 },
      'WARNING': { T: 0.0, I: 1.0, F: 0.0 },
      'CRITICAL': { T: 0.0, I: 0.0, F: 1.0 },
      'MAINTENANCE': { T: 0.2, I: 0.6, F: 0.2 }
    },
    default_judgment: { T: 0.0, I: 0.0, F: 1.0 }
  });

  // Power Status Mapper - Power supply monitoring
  const powerMapper = new BooleanMapper({
    id: 'power-status',
    version: '1.0.0',
    description: 'Power Supply Status',
    true_map: { T: 0.9, I: 0.1, F: 0.0 },  // Power on
    false_map: { T: 0.0, I: 0.0, F: 1.0 }  // Power off
  });

  // Test different IoT scenarios
  const scenarios = [
    { name: 'Normal Operation', temp: 22.0, pressure: 45.0, status: 'HEALTHY', power: true },
    { name: 'Temperature Warning', temp: 28.0, pressure: 45.0, status: 'WARNING', power: true },
    { name: 'Critical Failure', temp: 38.0, pressure: 95.0, status: 'CRITICAL', power: false },
    { name: 'Maintenance Mode', temp: 20.0, pressure: 35.0, status: 'MAINTENANCE', power: true }
  ];

  for (const scenario of scenarios) {
    console.log(`\n📊 Scenario: ${scenario.name}`);
    
    const tempJudgment = tempMapper.apply(scenario.temp);
    const pressureJudgment = pressureMapper.apply(scenario.pressure);
    const statusJudgment = statusMapper.apply(scenario.status);
    const powerJudgment = powerMapper.apply(scenario.power);

    console.log(`  Temperature ${scenario.temp}°C: T=${tempJudgment.T.toFixed(3)}, I=${tempJudgment.I.toFixed(3)}, F=${tempJudgment.F.toFixed(3)}`);
    console.log(`  Pressure ${scenario.pressure}psi: T=${pressureJudgment.T.toFixed(3)}, I=${pressureJudgment.I.toFixed(3)}, F=${pressureJudgment.F.toFixed(3)}`);
    console.log(`  Status ${scenario.status}: T=${statusJudgment.T.toFixed(3)}, I=${statusJudgment.I.toFixed(3)}, F=${statusJudgment.F.toFixed(3)}`);
    console.log(`  Power ${scenario.power}: T=${powerJudgment.T.toFixed(3)}, I=${powerJudgment.I.toFixed(3)}, F=${powerJudgment.F.toFixed(3)}`);

    // Fusion for overall system health
    const weights = [0.3, 0.3, 0.2, 0.2]; // temp, pressure, status, power
    const systemHealth = conflict_aware_weighted_average(
      [tempJudgment, pressureJudgment, statusJudgment, powerJudgment],
      weights
    );

    console.log(`  🔀 System Health: T=${systemHealth.T.toFixed(3)}, I=${systemHealth.I.toFixed(3)}, F=${systemHealth.F.toFixed(3)}`);
    
    // Interpret system health
    let healthStatus = '🟡 WARNING';
    if (systemHealth.T > 0.7) healthStatus = '🟢 HEALTHY';
    else if (systemHealth.F > 0.5) healthStatus = '🔴 CRITICAL';
    
    console.log(`  📈 Health Status: ${healthStatus}`);
  }
}

/**
 * Example 3: Supply Chain Tracking
 * ================================
 * 
 * Demonstrates how to track products through the supply chain
 * and assess delivery confidence based on multiple factors.
 */
function supplyChainTracking() {
  console.log('\n📦 Supply Chain Tracking Example');
  console.log('==================================');

  // Product Status Mapper - Current status in supply chain
  const productMapper = new CategoricalMapper({
    id: 'product-status',
    version: '1.0.0',
    description: 'Product Status in Supply Chain',
    mappings: {
      'PRODUCED': { T: 1.0, I: 0.0, F: 0.0 },
      'IN_TRANSIT': { T: 0.7, I: 0.3, F: 0.0 },
      'DELIVERED': { T: 0.9, I: 0.1, F: 0.0 },
      'DELAYED': { T: 0.0, I: 0.8, F: 0.2 },
      'LOST': { T: 0.0, I: 0.0, F: 1.0 },
      'DAMAGED': { T: 0.0, I: 0.2, F: 0.8 }
    },
    default_judgment: { T: 0.0, I: 1.0, F: 0.0 }
  });

  // Quality Score Mapper - Product quality assessment
  const qualityMapper = new NumericalMapper({
    id: 'quality-score',
    version: '1.0.0',
    description: 'Product Quality Assessment',
    falsity_point: 0,      // Poor quality
    indeterminacy_point: 50,   // Average quality
    truth_point: 100      // Excellent quality
  });

  // Temperature Control Mapper - Temperature control system status
  const tempControlMapper = new BooleanMapper({
    id: 'temperature-control',
    version: '1.0.0',
    description: 'Temperature Control System Status',
    true_map: { T: 0.8, I: 0.2, F: 0.0 },  // Temperature controlled
    false_map: { T: 0.0, I: 0.3, F: 0.7 }  // Temperature not controlled
  });

  // Test different supply chain scenarios
  const scenarios = [
    { name: 'Normal Delivery', status: 'IN_TRANSIT', quality: 85, tempControl: true },
    { name: 'Delayed Delivery', status: 'DELAYED', quality: 75, tempControl: true },
    { name: 'Quality Issues', status: 'IN_TRANSIT', quality: 25, tempControl: false },
    { name: 'Lost Package', status: 'LOST', quality: 0, tempControl: false }
  ];

  for (const scenario of scenarios) {
    console.log(`\n📊 Scenario: ${scenario.name}`);
    
    const productJudgment = productMapper.apply(scenario.status);
    const qualityJudgment = qualityMapper.apply(scenario.quality);
    const tempJudgment = tempControlMapper.apply(scenario.tempControl);

    console.log(`  Product Status ${scenario.status}: T=${productJudgment.T.toFixed(3)}, I=${productJudgment.I.toFixed(3)}, F=${productJudgment.F.toFixed(3)}`);
    console.log(`  Quality Score ${scenario.quality}: T=${qualityJudgment.T.toFixed(3)}, I=${qualityJudgment.I.toFixed(3)}, F=${qualityJudgment.F.toFixed(3)}`);
    console.log(`  Temperature Control ${scenario.tempControl}: T=${tempJudgment.T.toFixed(3)}, I=${tempJudgment.I.toFixed(3)}, F=${tempJudgment.F.toFixed(3)}`);

    // Fusion for overall supply chain confidence
    const weights = [0.4, 0.4, 0.2]; // product, quality, temperature
    const supplyChainConfidence = conflict_aware_weighted_average(
      [productJudgment, qualityJudgment, tempJudgment],
      weights
    );

    console.log(`  🔀 Supply Chain Confidence: T=${supplyChainConfidence.T.toFixed(3)}, I=${supplyChainConfidence.I.toFixed(3)}, F=${supplyChainConfidence.F.toFixed(3)}`);
    
    // Interpret confidence
    let confidenceLevel = '🟡 MODERATE';
    if (supplyChainConfidence.T > 0.7) confidenceLevel = '🟢 HIGH';
    else if (supplyChainConfidence.F > 0.5) confidenceLevel = '🔴 LOW';
    
    console.log(`  📈 Confidence Level: ${confidenceLevel}`);
  }
}

/**
 * Example 4: Mapper Registry Usage
 * ================================
 * 
 * Demonstrates how to use the MapperRegistry to manage multiple mappers
 * and perform bulk operations.
 */
function mapperRegistryUsage() {
  console.log('\n📋 Mapper Registry Usage Example');
  console.log('=================================');

  const registry = new MapperRegistry();
  const validator = new MapperValidator();

  // Create various mappers
  const healthMapper = new NumericalMapper({
    id: 'defi-health-factor',
    version: '1.0.0',
    falsity_point: 1.0,
    indeterminacy_point: 1.5,
    truth_point: 3.0
  });

  const kycMapper = new CategoricalMapper({
    id: 'kyc-status',
    version: '1.0.0',
    mappings: {
      'VERIFIED': { T: 1.0, I: 0.0, F: 0.0 },
      'PENDING': { T: 0.0, I: 1.0, F: 0.0 }
    }
  });

  const sslMapper = new BooleanMapper({
    id: 'ssl-certificate',
    version: '1.0.0',
    true_map: { T: 0.9, I: 0.1, F: 0.0 },
    false_map: { T: 0.0, I: 0.0, F: 1.0 }
  });

  // Register mappers
  registry.register(healthMapper);
  registry.register(kycMapper);
  registry.register(sslMapper);

  console.log(`📊 Registered ${registry.count()} mappers`);
  console.log(`📝 Mapper IDs: ${registry.list().join(', ')}`);

  // Get statistics
  const stats = registry.getStats();
  console.log(`📈 Statistics:`, stats);

  // Use registered mappers
  const healthJudgment = registry.get('defi-health-factor').apply(1.8);
  const kycJudgment = registry.get('kyc-status').apply('VERIFIED');
  const sslJudgment = registry.get('ssl-certificate').apply(true);

  console.log(`\n🎯 Using Registered Mappers:`);
  console.log(`  Health Factor 1.8: T=${healthJudgment.T.toFixed(3)}`);
  console.log(`  KYC VERIFIED: T=${kycJudgment.T.toFixed(3)}`);
  console.log(`  SSL Valid: T=${sslJudgment.T.toFixed(3)}`);

  // Export configurations
  const exported = registry.export();
  console.log(`\n📤 Exported ${exported.length} mapper configurations`);

  // Validate exported configurations
  for (const config of exported) {
    try {
      validator.validate(config);
      console.log(`✅ ${config.id} - Valid configuration`);
    } catch (error) {
      console.log(`❌ ${config.id} - Invalid configuration: ${error.message}`);
    }
  }
}

/**
 * Example 5: Advanced Boolean Mapper Usage
 * ========================================
 * 
 * Demonstrates advanced features of BooleanMapper including
 * different input formats and factory methods.
 */
function advancedBooleanMapperUsage() {
  console.log('\n🔒 Advanced Boolean Mapper Example');
  console.log('===================================');

  // Create different types of boolean mappers
  const trustMapper = BooleanMapper.createStandardTrustMapper('trust-mapper');
  const securityMapper = BooleanMapper.createSecurityMapper('security-mapper');
  const conservativeMapper = BooleanMapper.createConservativeMapper('conservative-mapper');

  // Test different input formats
  const testInputs = [
    { value: true, type: 'boolean' },
    { value: false, type: 'boolean' },
    { value: 1, type: 'number' },
    { value: 0, type: 'number' },
    { value: 'true', type: 'string' },
    { value: 'false', type: 'string' },
    { value: 'yes', type: 'string' },
    { value: 'no', type: 'string' },
    { value: 'on', type: 'string' },
    { value: 'off', type: 'string' },
    { value: 'enabled', type: 'string' },
    { value: 'disabled', type: 'string' }
  ];

  console.log('\n📊 Testing Different Input Formats:');
  
  for (const input of testInputs) {
    console.log(`\n🔍 Input: ${input.value} (${input.type})`);
    
    // Test with trust mapper
    try {
      const trustJudgment = trustMapper.apply(input.value);
      console.log(`  Trust Mapper: T=${trustJudgment.T.toFixed(3)}, I=${trustJudgment.I.toFixed(3)}, F=${trustJudgment.F.toFixed(3)}`);
    } catch (error) {
      console.log(`  Trust Mapper: ❌ ${error.message}`);
    }

    // Test with security mapper
    try {
      const securityJudgment = securityMapper.apply(input.value);
      console.log(`  Security Mapper: T=${securityJudgment.T.toFixed(3)}, I=${securityJudgment.I.toFixed(3)}, F=${securityJudgment.F.toFixed(3)}`);
    } catch (error) {
      console.log(`  Security Mapper: ❌ ${error.message}`);
    }

    // Test with conservative mapper
    try {
      const conservativeJudgment = conservativeMapper.apply(input.value);
      console.log(`  Conservative Mapper: T=${conservativeJudgment.T.toFixed(3)}, I=${conservativeJudgment.I.toFixed(3)}, F=${conservativeJudgment.F.toFixed(3)}`);
    } catch (error) {
      console.log(`  Conservative Mapper: ❌ ${error.message}`);
    }
  }

  // Test normalization capabilities
  console.log('\n🔧 Normalization Testing:');
  
  for (const input of testInputs.slice(0, 6)) { // Test first 6 inputs
    console.log(`\n📝 Input: ${input.value}`);
    
    // Test normalization with trust mapper
    if (trustMapper.canNormalize(input.value)) {
      const normalized = trustMapper.normalize(input.value);
      console.log(`  ✅ Can normalize to: ${normalized}`);
    } else {
      console.log(`  ❌ Cannot normalize`);
    }
  }

  // Show supported strings
  console.log('\n📚 Supported String Values:');
  const supported = trustMapper.getSupportedStrings();
  console.log(`  True values: ${supported.true.join(', ')}`);
  console.log(`  False values: ${supported.false.join(', ')}`);
}

/**
 * Main execution function
 * =======================
 */
function main() {
  console.log('🚀 OTP Mapper Examples - Real-world Use Cases');
  console.log('==============================================');
  console.log('This demo showcases practical applications of the OTP Mapper system.');
  console.log('Each example demonstrates different aspects of data transformation');
  console.log('and fusion using Neutrosophic Judgments.');

  try {
    // Run all examples
    defiRiskAssessment();
    iotMonitoringSystem();
    supplyChainTracking();
    mapperRegistryUsage();
    advancedBooleanMapperUsage();

    console.log('\n🎉 All examples completed successfully!');
    console.log('=========================================');
    console.log('The OTP Mapper system provides powerful tools for transforming');
    console.log('raw data into structured, auditable trust assessments.');
    console.log('These examples demonstrate just a few of the many possible');
    console.log('applications across different industries and use cases.');

  } catch (error) {
    console.error('\n❌ Error running examples:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the examples if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  defiRiskAssessment,
  iotMonitoringSystem,
  supplyChainTracking,
  mapperRegistryUsage,
  advancedBooleanMapperUsage,
  main
};


