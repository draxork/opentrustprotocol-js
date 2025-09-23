/**
 * **REVOLUTIONARY DEMO**: Judgment ID System + Performance Oracle
 * 
 * This example demonstrates the complete Circle of Trust functionality:
 * - Automatic Judgment ID generation in fusion operations
 * - Outcome Judgment creation for real-world results
 * - Linking decisions with outcomes for performance tracking
 */

const {
  NeutrosophicJudgment,
  conflict_aware_weighted_average,
  optimistic_fusion,
  pessimistic_fusion,
  generateJudgmentId,
  ensureJudgmentId,
  createOutcomeJudgment,
  OutcomeType
} = require('../dist/index.js');

function main() {
  console.log('🚀 **OPENTRUST PROTOCOL v3.0 - CIRCLE OF TRUST DEMO** 🚀\n');

  // **STEP 1**: Create initial judgments from different sources
  console.log('📊 **STEP 1: Creating Initial Judgments**');
  const sensorJudgment = new NeutrosophicJudgment(
    0.8, 0.15, 0.05,  // High confidence in positive outcome
    [{ source_id: 'sensor-network', timestamp: '2023-01-01T10:00:00Z' }]
  );
  
  const expertJudgment = new NeutrosophicJudgment(
    0.6, 0.25, 0.15,  // Moderate confidence with some uncertainty
    [{ source_id: 'expert-analysis', timestamp: '2023-01-01T10:01:00Z' }]
  );
  
  const marketJudgment = new NeutrosophicJudgment(
    0.7, 0.2, 0.1,  // Good market conditions
    [{ source_id: 'market-data', timestamp: '2023-01-01T10:02:00Z' }]
  );

  console.log(`✅ Sensor Judgment: T=${sensorJudgment.T.toFixed(1)}, I=${sensorJudgment.I.toFixed(1)}, F=${sensorJudgment.F.toFixed(1)}`);
  console.log(`✅ Expert Judgment: T=${expertJudgment.T.toFixed(1)}, I=${expertJudgment.I.toFixed(1)}, F=${expertJudgment.F.toFixed(1)}`);
  console.log(`✅ Market Judgment: T=${marketJudgment.T.toFixed(1)}, I=${marketJudgment.I.toFixed(1)}, F=${marketJudgment.F.toFixed(1)}`);

  // **STEP 2**: Fuse judgments with automatic Judgment ID generation
  console.log('\n🔄 **STEP 2: Fusion Operations with Automatic Judgment IDs**');
  
  const judgments = [sensorJudgment, expertJudgment, marketJudgment];
  const weights = [0.4, 0.3, 0.3];  // Sensor gets highest weight

  // Conflict-Aware Weighted Average (Primary operator)
  const fusedCawa = conflict_aware_weighted_average(judgments, weights);
  console.log(`🎯 CAWA Result: T=${fusedCawa.T.toFixed(3)}, I=${fusedCawa.I.toFixed(3)}, F=${fusedCawa.F.toFixed(3)}`);
  
  // Extract judgment_id from provenance chain
  let cawaJudgmentId = null;
  for (const entry of fusedCawa.provenance_chain) {
    if (entry.judgment_id) {
      cawaJudgmentId = entry.judgment_id;
      break;
    }
  }
  console.log(`🔐 Judgment ID: ${cawaJudgmentId}`);

  // Optimistic Fusion (Best-case scenario)
  const fusedOptimistic = optimistic_fusion(judgments);
  console.log(`☀️ Optimistic Result: T=${fusedOptimistic.T.toFixed(3)}, I=${fusedOptimistic.I.toFixed(3)}, F=${fusedOptimistic.F.toFixed(3)}`);
  
  let optimisticJudgmentId = null;
  for (const entry of fusedOptimistic.provenance_chain) {
    if (entry.judgment_id) {
      optimisticJudgmentId = entry.judgment_id;
      break;
    }
  }
  console.log(`🔐 Judgment ID: ${optimisticJudgmentId}`);

  // Pessimistic Fusion (Worst-case scenario)
  const fusedPessimistic = pessimistic_fusion(judgments);
  console.log(`🌧️ Pessimistic Result: T=${fusedPessimistic.T.toFixed(3)}, I=${fusedPessimistic.I.toFixed(3)}, F=${fusedPessimistic.F.toFixed(3)}`);
  
  let pessimisticJudgmentId = null;
  for (const entry of fusedPessimistic.provenance_chain) {
    if (entry.judgment_id) {
      pessimisticJudgmentId = entry.judgment_id;
      break;
    }
  }
  console.log(`🔐 Judgment ID: ${pessimisticJudgmentId}`);

  // **STEP 3**: Simulate real-world outcomes
  console.log('\n🌍 **STEP 3: Real-World Outcome Tracking**');
  
  // Simulate successful outcome
  const successOutcome = createOutcomeJudgment(
    cawaJudgmentId,  // Link to original decision
    1.0, 0.0, 0.0,  // Complete success
    OutcomeType.SUCCESS,
    'trading-oracle'
  );
  
  console.log('✅ Success Outcome Recorded!');
  console.log(`🔗 Links to Decision ID: ${successOutcome.links_to_judgment_id}`);
  console.log(`📊 Outcome: T=${successOutcome.T.toFixed(1)}, I=${successOutcome.I.toFixed(1)}, F=${successOutcome.F.toFixed(1)}`);
  console.log(`🔐 Outcome Judgment ID: ${successOutcome.judgment_id}`);

  // **STEP 4**: Demonstrate manual Judgment ID generation
  console.log('\n🛠️ **STEP 4: Manual Judgment ID Operations**');
  
  // Create a judgment without ID
  const manualJudgment = new NeutrosophicJudgment(
    0.9, 0.1, 0.0,
    [{ source_id: 'manual-input', timestamp: '2023-01-01T12:00:00Z' }]
  );
  
  console.log(`📝 Manual Judgment (no ID): T=${manualJudgment.T.toFixed(1)}, I=${manualJudgment.I.toFixed(1)}, F=${manualJudgment.F.toFixed(1)}`);
  
  // Check if it has judgment_id
  const hasJudgmentId = manualJudgment.provenance_chain.some(entry => entry.judgment_id);
  console.log(`❓ Has Judgment ID: ${hasJudgmentId}`);

  // Generate ID manually
  const manualId = generateJudgmentId(manualJudgment);
  console.log(`🔐 Generated Manual ID: ${manualId}`);

  // Ensure ID is set
  const judgmentWithId = ensureJudgmentId(manualJudgment);
  console.log(`✅ Judgment with ID: T=${judgmentWithId.T.toFixed(1)}, I=${judgmentWithId.I.toFixed(1)}, F=${judgmentWithId.F.toFixed(1)}`);
  
  // Extract final judgment ID
  let finalJudgmentId = null;
  for (const entry of judgmentWithId.provenance_chain) {
    if (entry.judgment_id) {
      finalJudgmentId = entry.judgment_id;
      break;
    }
  }
  console.log(`🔐 Final Judgment ID: ${finalJudgmentId}`);

  // **STEP 5**: Performance Oracle Analysis
  console.log('\n📈 **STEP 5: Performance Oracle Analysis**');
  
  // Simulate multiple outcomes for analysis
  const outcomes = [
    ['Decision 1', fusedCawa, successOutcome],
    ['Decision 2', fusedOptimistic, successOutcome],
    ['Decision 3', fusedPessimistic, successOutcome],
  ];

  console.log('📊 Performance Analysis:');
  for (const [name, decision, outcome] of outcomes) {
    let calibration;
    if (decision.T > 0.7 && outcome.T === 1.0) {
      calibration = '✅ Well Calibrated';
    } else if (decision.T <= 0.5 && outcome.T === 1.0) {
      calibration = '⚠️ Underconfident';
    } else if (decision.T > 0.8 && outcome.T === 0.0) {
      calibration = '❌ Overconfident';
    } else {
      calibration = '📊 Neutral';
    }
    
    console.log(`  ${name}: ${calibration} (Decision T=${decision.T.toFixed(2)}, Outcome T=${outcome.T.toFixed(1)})`);
  }

  console.log('\n🎉 **CIRCLE OF TRUST COMPLETE!** 🎉');
  console.log('✅ All judgments have unique IDs for tracking');
  console.log('✅ Real-world outcomes are linked to decisions');
  console.log('✅ Performance can be measured and analyzed');
  console.log('✅ The mathematical embodiment of trust is achieved!');
}

// Run the demo
if (require.main === module) {
  main();
}
