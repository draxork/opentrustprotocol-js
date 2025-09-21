# OpenTrust Protocol JavaScript SDK

[![npm version](https://img.shields.io/npm/v/opentrustprotocol.svg)](https://www.npmjs.com/package/opentrustprotocol)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)

The official JavaScript SDK for the OpenTrust Protocol (OTP), the open standard for auditable trust using neutrosophic judgments.

## 🚀 Features

- **Neutrosophic Judgments**: Represent evidence with Truth (T), Indeterminacy (I), and Falsity (F) components
- **Fusion Operators**: Combine multiple judgments using conflict-aware algorithms
- **Provenance Chains**: Maintain complete audit trails for all judgments
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Validation**: Built-in validation ensuring data integrity
- **Immutability**: Provenance chains are immutable for security

## 📦 Installation

```bash
npm install opentrustprotocol
```

## 🎯 Quick Start

```javascript
import { NeutrosophicJudgment, conflict_aware_weighted_average } from 'opentrustprotocol';

// Create a judgment
const judgment1 = new NeutrosophicJudgment(
  0.8,  // Truth degree
  0.2,  // Indeterminacy degree  
  0.0,  // Falsity degree
  [{
    source_id: 'ai-model-gpt4',
    timestamp: '2025-09-20T20:30:00Z',
    description: 'AI model confidence score'
  }]
);

// Create another judgment
const judgment2 = new NeutrosophicJudgment(
  0.6, 0.3, 0.1,
  [{
    source_id: 'human-expert',
    timestamp: '2025-09-20T20:31:00Z',
    description: 'Expert assessment'
  }]
);

// Fuse judgments using conflict-aware weighted average
const fused = conflict_aware_weighted_average(
  [judgment1, judgment2],
  [0.7, 0.3]  // Weights
);

console.log(fused.toString()); // NeutrosophicJudgment(T=0.74, I=0.23, F=0.03)
```

## 📚 API Reference

### NeutrosophicJudgment

The core data structure representing evidence with uncertainty.

```javascript
const judgment = new NeutrosophicJudgment(T, I, F, provenance_chain);
```

**Parameters:**
- `T` (number): Truth degree [0.0, 1.0]
- `I` (number): Indeterminacy degree [0.0, 1.0]  
- `F` (number): Falsity degree [0.0, 1.0]
- `provenance_chain` (ProvenanceEntry[]): Audit trail

**Constraints:**
- All values must be in range [0.0, 1.0]
- Conservation constraint: T + I + F ≤ 1.0
- Provenance chain cannot be empty

### Fusion Operators

#### conflict_aware_weighted_average

The primary fusion operator that adjusts weights based on conflicts between judgments.

```javascript
const result = conflict_aware_weighted_average(judgments, weights);
```

#### optimistic_fusion

Takes the most optimistic view by maximizing truth and minimizing falsity.

```javascript
const result = optimistic_fusion(judgments);
```

#### pessimistic_fusion

Takes the most pessimistic view by minimizing truth and maximizing falsity.

```javascript
const result = pessimistic_fusion(judgments);
```

## 🧪 Use Cases

### AI Model Confidence Scoring

```javascript
// Multiple AI models assess the same claim
const model1 = new NeutrosophicJudgment(0.85, 0.15, 0.0, [
  { source_id: 'gpt4', timestamp: '2025-09-20T20:30:00Z' }
]);

const model2 = new NeutrosophicJudgment(0.72, 0.28, 0.0, [
  { source_id: 'claude', timestamp: '2025-09-20T20:30:00Z' }
]);

// Fuse with different weights based on model reliability
const consensus = conflict_aware_weighted_average(
  [model1, model2], 
  [0.6, 0.4]  // GPT-4 gets higher weight
);
```

### Risk Assessment

```javascript
// Multiple risk assessments
const technical = new NeutrosophicJudgment(0.3, 0.2, 0.5, [
  { source_id: 'tech-team', timestamp: '2025-09-20T20:30:00Z' }
]);

const business = new NeutrosophicJudgment(0.6, 0.3, 0.1, [
  { source_id: 'business-team', timestamp: '2025-09-20T20:30:00Z' }
]);

// Use pessimistic fusion for worst-case scenario
const worstCase = pessimistic_fusion([technical, business]);
```

### Content Moderation

```javascript
// Multiple moderation systems
const automated = new NeutrosophicJudgment(0.8, 0.1, 0.1, [
  { source_id: 'automated-scanner', timestamp: '2025-09-20T20:30:00Z' }
]);

const human = new NeutrosophicJudgment(0.9, 0.1, 0.0, [
  { source_id: 'human-moderator', timestamp: '2025-09-20T20:30:00Z' }
]);

// Use optimistic fusion for content approval
const approval = optimistic_fusion([automated, human]);
```

## 🔧 Development

### Prerequisites

- Node.js 14+
- npm or yarn

### Setup

```bash
git clone https://github.com/opentrustprotocol/opentrustprotocol-js.git
cd opentrustprotocol-js
npm install
```

### Testing

```bash
npm test
npm run test:coverage
```

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Documentation**: https://docs.opentrustprotocol.com
- **Issues**: https://github.com/opentrustprotocol/opentrustprotocol-js/issues
- **Community**: https://discord.gg/opentrustprotocol

## 🔗 Links

- **Website**: https://opentrustprotocol.com
- **Specification**: https://github.com/opentrustprotocol/specification
- **Python SDK**: https://github.com/opentrustprotocol/opentrustprotocol-python
