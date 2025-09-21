/**
 * OpenTrust Protocol JavaScript SDK Demo
 * 
 * This demo shows how to use the OpenTrust Protocol SDK to create
 * neutrosophic judgments and perform fusion operations.
 */

import { NeutrosophicJudgment, conflict_aware_weighted_average, optimistic_fusion, pessimistic_fusion } from '../dist/index.esm.js';

console.log('🚀 OpenTrust Protocol JavaScript SDK Demo\n');

// Create judgments representing different AI model assessments
const gpt4Assessment = new NeutrosophicJudgment(
  0.85,  // High confidence in truth
  0.15,  // Low indeterminacy
  0.0,   // No falsity
  [{
    source_id: 'gpt-4',
    timestamp: new Date().toISOString(),
    description: 'GPT-4 model assessment of claim credibility',
    metadata: {
      model_version: '4.0',
      temperature: 0.1,
      max_tokens: 1000
    }
  }]
);

const claudeAssessment = new NeutrosophicJudgment(
  0.72,  // Good confidence
  0.28,  // Some uncertainty
  0.0,   // No falsity
  [{
    source_id: 'claude-3',
    timestamp: new Date().toISOString(),
    description: 'Claude-3 model assessment',
    metadata: {
      model_version: '3.0',
      temperature: 0.2
    }
  }]
);

const humanExpertAssessment = new NeutrosophicJudgment(
  0.90,  // Very high confidence
  0.10,  // Low uncertainty
  0.0,   // No falsity
  [{
    source_id: 'human-expert-dr-smith',
    timestamp: new Date().toISOString(),
    description: 'Human expert review',
    metadata: {
      expertise_level: 'senior',
      review_time_minutes: 45
    }
  }]
);

console.log('📊 Individual Assessments:');
console.log(`GPT-4: ${gpt4Assessment.toString()}`);
console.log(`Claude-3: ${claudeAssessment.toString()}`);
console.log(`Human Expert: ${humanExpertAssessment.toString()}\n`);

// Perform conflict-aware weighted fusion (primary method)
console.log('🔄 Conflict-Aware Weighted Fusion:');
const consensus = conflict_aware_weighted_average(
  [gpt4Assessment, claudeAssessment, humanExpertAssessment],
  [0.4, 0.3, 0.3]  // Human expert gets equal weight with GPT-4
);

console.log(`Consensus: ${consensus.toString()}`);
console.log(`Provenance entries: ${consensus.provenance_chain.length}\n`);

// Perform optimistic fusion (best-case scenario)
console.log('😊 Optimistic Fusion (Best Case):');
const optimistic = optimistic_fusion([gpt4Assessment, claudeAssessment, humanExpertAssessment]);
console.log(`Optimistic: ${optimistic.toString()}\n`);

// Perform pessimistic fusion (worst-case scenario)
console.log('😟 Pessimistic Fusion (Worst Case):');
const pessimistic = pessimistic_fusion([gpt4Assessment, claudeAssessment, humanExpertAssessment]);
console.log(`Pessimistic: ${pessimistic.toString()}\n`);

// Risk assessment scenario
console.log('⚠️  Risk Assessment Scenario:');
const technicalRisk = new NeutrosophicJudgment(
  0.3,   // Low truth (high risk)
  0.2,   // Some uncertainty
  0.5,   // High falsity (high risk) - T + I + F = 1.0 ✓
  [{
    source_id: 'tech-team-assessment',
    timestamp: new Date().toISOString(),
    description: 'Technical risk evaluation'
  }]
);

const businessRisk = new NeutrosophicJudgment(
  0.6,   // Medium truth (medium risk)
  0.3,   // Some uncertainty
  0.1,   // Low falsity (low risk) - T + I + F = 1.0 ✓
  [{
    source_id: 'business-team-assessment',
    timestamp: new Date().toISOString(),
    description: 'Business risk evaluation'
  }]
);

const worstCaseRisk = pessimistic_fusion([technicalRisk, businessRisk]);
console.log(`Technical Risk: ${technicalRisk.toString()}`);
console.log(`Business Risk: ${businessRisk.toString()}`);
console.log(`Worst Case Risk: ${worstCaseRisk.toString()}\n`);

// JSON serialization demo
console.log('💾 JSON Serialization:');
const jsonRepresentation = consensus.toJSON();
console.log('Consensus JSON:', JSON.stringify(jsonRepresentation, null, 2));

// Create from JSON
const fromJson = NeutrosophicJudgment.fromJSON(jsonRepresentation);
console.log(`From JSON: ${fromJson.toString()}`);
console.log(`Equal to original: ${consensus.equals(fromJson)}\n`);

console.log('✅ Demo completed successfully!');
console.log('\n📚 For more examples, visit: https://docs.opentrustprotocol.com');
