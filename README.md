# 🟨 OpenTrust Protocol (OTP) - JavaScript SDK

[![npm version](https://img.shields.io/npm/v/opentrustprotocol.svg)](https://www.npmjs.com/package/opentrustprotocol)
[![Documentation](https://img.shields.io/badge/docs-available-brightgreen.svg)](https://github.com/draxork/opentrustprotocol-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)

> **The official JavaScript/TypeScript implementation of the OpenTrust Protocol - The open standard for auditable trust in AI and blockchain systems**

## 🚀 **What is OpenTrust Protocol?**

The OpenTrust Protocol (OTP) is a revolutionary framework for representing and managing **uncertainty, trust, and auditability** in AI systems, blockchain applications, and distributed networks. Built on **neutrosophic logic**, OTP provides a mathematical foundation for handling incomplete, inconsistent, and uncertain information.

### **🎯 Why OTP Matters**

- **🔒 Trust & Security**: Quantify trust levels in AI decisions and blockchain transactions
- **📊 Uncertainty Management**: Handle incomplete and contradictory information gracefully  
- **🔍 Full Auditability**: Complete provenance chain for every decision
- **🌐 Cross-Platform**: Interoperable across Python, JavaScript, Rust, and more
- **⚡ Performance**: Optimized for both browser and Node.js environments

## 🟨 **JavaScript SDK Features**

### **Core Components**
- **Neutrosophic Judgments**: Represent evidence as (T, I, F) values where T + I + F ≤ 1.0
- **Fusion Operators**: Combine multiple judgments with conflict-aware algorithms
- **OTP Mappers**: Transform raw data into neutrosophic judgments
- **Provenance Chain**: Complete audit trail for every transformation

### **🆕 OTP Mapper System (v1.0.3)**

Transform any data type into neutrosophic judgments:

```typescript
import { NumericalMapper, CategoricalMapper, BooleanMapper } from 'opentrustprotocol';
import { NumericalParams, CategoricalParams, BooleanParams } from 'opentrustprotocol';

// DeFi Health Factor Mapping
const healthMapper = new NumericalMapper(new NumericalParams({
  id: "defi-health-factor",
  version: "1.0.0",
  falsityPoint: 1.0,      // Liquidation threshold
  indeterminacyPoint: 1.5, // Warning zone  
  truthPoint: 2.0,        // Safe zone
  clampToRange: true
}));

// Transform health factor to neutrosophic judgment
const judgment = healthMapper.apply(1.8);
console.log(`Health Factor 1.8: T=${judgment.T.toFixed(3)}, I=${judgment.I.toFixed(3)}, F=${judgment.F.toFixed(3)}`);
```

### **Available Mappers**

| Mapper Type | Use Case | Example |
|-------------|----------|---------|
| **NumericalMapper** | Continuous data interpolation | DeFi health factors, IoT sensors |
| **CategoricalMapper** | Discrete category mapping | KYC status, product categories |
| **BooleanMapper** | Boolean value transformation | SSL certificates, feature flags |

## 📦 **Installation**

```bash
npm install opentrustprotocol
```

## 🚀 **Quick Start**

### **Basic Neutrosophic Judgment**

```typescript
import { NeutrosophicJudgment, conflict_aware_weighted_average } from 'opentrustprotocol';

// Create judgments with provenance
const judgment1 = new NeutrosophicJudgment(
  0.8, 0.2, 0.0,
  [{
    source_id: 'sensor1',
    timestamp: '2023-01-01T00:00:00Z'
  }]
);

const judgment2 = new NeutrosophicJudgment(
  0.6, 0.3, 0.1,
  [{
    source_id: 'sensor2',
    timestamp: '2023-01-01T00:00:00Z'
  }]
);

// Fuse judgments with conflict-aware weighted average
const fused = conflict_aware_weighted_average(
  [judgment1, judgment2],
  [0.6, 0.4]
);

console.log(`Fused: ${fused}`);
```

### **Real-World Example: DeFi Risk Assessment**

```typescript
import { 
  NumericalMapper, CategoricalMapper, BooleanMapper,
  NumericalParams, CategoricalParams, BooleanParams,
  JudgmentData, conflict_aware_weighted_average
} from 'opentrustprotocol';

// 1. Health Factor Mapper
const healthMapper = new NumericalMapper(new NumericalParams({
  id: "health-factor",
  version: "1.0.0",
  falsityPoint: 1.0,
  indeterminacyPoint: 1.5,
  truthPoint: 2.0,
  clampToRange: true
}));

// 2. KYC Status Mapper
const kycMappings = new Map([
  ["VERIFIED", new JudgmentData(0.9, 0.1, 0.0)],
  ["PENDING", new JudgmentData(0.3, 0.7, 0.0)],
  ["REJECTED", new JudgmentData(0.0, 0.0, 1.0)]
]);

const kycMapper = new CategoricalMapper(new CategoricalParams({
  id: "kyc-status",
  version: "1.0.0",
  mappings: kycMappings,
  defaultJudgment: null
}));

// 3. SSL Certificate Mapper
const sslMapper = new BooleanMapper(new BooleanParams({
  id: "ssl-cert",
  version: "1.0.0",
  trueMap: new JudgmentData(0.9, 0.1, 0.0),
  falseMap: new JudgmentData(0.0, 0.0, 1.0)
}));

// 4. Transform data to judgments
const healthJudgment = healthMapper.apply(1.8);
const kycJudgment = kycMapper.apply("VERIFIED");
const sslJudgment = sslMapper.apply(true);

// 5. Fuse for final risk assessment
const riskAssessment = conflict_aware_weighted_average(
  [healthJudgment, kycJudgment, sslJudgment],
  [0.5, 0.3, 0.2]  // Health factor most important
);

console.log(`DeFi Risk Assessment: T=${riskAssessment.T.toFixed(3)}, I=${riskAssessment.I.toFixed(3)}, F=${riskAssessment.F.toFixed(3)}`);
```

## 🏗️ **Architecture**

### **Performance & Reliability**

- **🔒 Memory Efficient**: Optimized for both browser and Node.js
- **⚡ Fast Execution**: V8-optimized operations with minimal overhead
- **🔄 Thread Safe**: Safe concurrent access with proper async handling
- **📦 Minimal Dependencies**: Only essential packages for reliability

### **Mapper Registry System**

```typescript
import { getGlobalRegistry } from 'opentrustprotocol';

const registry = getGlobalRegistry();

// Register mappers
registry.register(healthMapper);
registry.register(kycMapper);

// Retrieve and use
const mapper = registry.get("health-factor");
const judgment = mapper.apply(1.5);

// Export configurations
const configs = registry.export();
```

## 🧪 **Testing**

Run the comprehensive test suite:

```bash
npm test
npm run test:coverage
```

Run examples:

```bash
npm run example:mapper
```

## 📊 **Use Cases**

### **🔗 Blockchain & DeFi**
- **Risk Assessment**: Health factors, liquidation risks
- **KYC/AML**: Identity verification, compliance scoring
- **Oracle Reliability**: Data source trust evaluation

### **🤖 AI & Machine Learning**
- **Uncertainty Quantification**: Model confidence scoring
- **Data Quality**: Input validation and reliability
- **Decision Fusion**: Multi-model ensemble decisions

### **🌐 IoT & Sensors**
- **Sensor Reliability**: Temperature, pressure, motion sensors
- **Data Fusion**: Multi-sensor decision making
- **Anomaly Detection**: Trust-based outlier identification

### **🏭 Supply Chain**
- **Product Tracking**: Status monitoring and verification
- **Quality Control**: Defect detection and classification
- **Compliance**: Regulatory requirement tracking

## 🔧 **Advanced Features**

### **Custom Mapper Creation**

```typescript
import { Mapper, MapperType, MapperParams, NeutrosophicJudgment } from 'opentrustprotocol';

class CustomMapper implements Mapper {
  constructor(private params: MapperParams) {}
  
  apply(inputValue: any): NeutrosophicJudgment {
    // Your transformation logic
    return new NeutrosophicJudgment(0.8, 0.2, 0.0, []);
  }
  
  getParams(): MapperParams {
    return this.params;
  }
  
  getType(): MapperType {
    return MapperType.Custom;
  }
  
  validate(): boolean {
    // Validate your parameters
    return true;
  }
}
```

### **JSON Schema Validation**

```typescript
import { MapperValidator } from 'opentrustprotocol';

const validator = new MapperValidator();
const result = validator.validate(mapperParams);

if (result.valid) {
  console.log("✅ Valid mapper configuration");
} else {
  result.errors.forEach(error => {
    console.log(`❌ Validation error: ${error}`);
  });
}
```

## 🌟 **Why Choose OTP JavaScript SDK?**

### **🚀 Performance**
- **Optimized operations** - Minimal runtime overhead
- **Memory efficient** - Smart garbage collection
- **Fast development** - Rich TypeScript integration

### **🔒 Safety**
- **Type safety** - Full TypeScript support with strict typing
- **Error handling** - Comprehensive exception handling
- **Data integrity** - Immutable provenance chains

### **🔧 Developer Experience**
- **Rich ecosystem** - Seamless integration with Node.js and browser tools
- **Comprehensive docs** - Extensive documentation and examples
- **Active community** - Growing ecosystem and support

## 📈 **Performance Benchmarks**

| Operation | Time | Memory |
|-----------|------|--------|
| Judgment Creation | < 5μs | 48 bytes |
| Mapper Application | < 10μs | 96 bytes |
| Fusion (10 judgments) | < 30μs | 384 bytes |

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Setup**

```bash
git clone https://github.com/draxork/opentrustprotocol-js.git
cd opentrustprotocol-js
npm install
npm test
npm run example:mapper
```

## 📚 **Documentation**

- **[API Documentation](https://github.com/draxork/opentrustprotocol-js)** - Complete API reference
- **[Examples](examples/)** - Real-world usage examples
- **[Specification](https://github.com/draxork/opentrustprotocol-specification)** - OTP v2.0 specification

## 🌐 **Ecosystem**

OTP is available across multiple platforms:

| Platform | Package | Status |
|----------|---------|--------|
| **JavaScript** | `opentrustprotocol` | ✅ v1.0.3 |
| **Python** | `opentrustprotocol` | ✅ v1.0.6 |
| **Rust** | `opentrustprotocol` | ✅ v0.2.0 |

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Neutrosophic Logic**: Founded by Florentin Smarandache
- **JavaScript/TypeScript Community**: For the amazing language and ecosystem
- **Open Source Contributors**: Making trust auditable for everyone

---

<div align="center">

**🌟 Star this repository if you find it useful!**

[![GitHub stars](https://img.shields.io/github/stars/draxork/opentrustprotocol-js?style=social)](https://github.com/draxork/opentrustprotocol-js)

**Made with ❤️ by the OpenTrust Protocol Team**

</div>