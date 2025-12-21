# EntropyOps

<div align="center">

## AI-Driven Operations Stack

### From Decision Optimization to Business Operations and AIOps

**运筹 · 运营 · 运维 — 智能一体化**

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev/)
[![D3.js](https://img.shields.io/badge/D3.js-7.9-F9A03C?logo=d3.js)](https://d3js.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google)](https://ai.google.dev/)

</div>

---

## Overview

EntropyOps is a next-generation **AI-Driven Operations Stack** that unifies three critical operational domains into a single intelligent platform:

| Layer | Domain | Focus |
|-------|--------|-------|
| **Decision Optimization** | 运筹 (Operations Research) | Resource allocation, scheduling, capacity planning |
| **Business Operations** | 运营 (Business Ops) | KPIs, user journey, conversion, business impact |
| **AIOps** | 运维 (IT Operations) | Infrastructure monitoring, diagnostics, automation |

By leveraging a **hierarchical multi-agent collaboration system**, EntropyOps bridges the gap between business strategy, operational execution, and technical infrastructure.

### Why EntropyOps?

Unlike traditional infrastructure monitoring tools, EntropyOps provides:

- **Business-centric perspective** - Understanding how technical systems impact business outcomes
- **Decision optimization** - AI-driven resource allocation, scheduling, and capacity planning
- **End-to-end visibility** - From user behavior to infrastructure components across 5 architectural layers
- **Intelligent automation** - Self-healing capabilities with human-in-the-loop oversight

---

## The Three Pillars

### 1. AI Operations Research (运筹)

<div align="center">
<img src="doc/images/AI-Operation-Research.png" alt="AI Operations Research" width="100%" />
</div>

*Intelligent decision optimization for resource allocation, scheduling, and capacity planning.*

---

### 2. AI Business Operations (运营)

<div align="center">
<img src="doc/images/AI-Business-Operation.png" alt="AI Business Operations" width="100%" />
</div>

*Business metrics monitoring, user journey analysis, and impact assessment.*

---

### 3. AIOps (运维)

<div align="center">
<img src="doc/images/AIOps.png" alt="AIOps" width="100%" />
</div>

*Infrastructure monitoring, intelligent diagnostics, and automated remediation.*

---

## Key Capabilities

- **Hierarchical Agent Collaboration** - Multi-level agent system with Global Supervisors, Team Supervisors, and specialized Workers for complex problem-solving
- **5-Layer Topology Visualization** - Business Scenario → Business Flow → Application → Middleware → Infrastructure
- **Business-Tech Correlation** - Link technical metrics to business KPIs and quantify impact
- **AI-Powered Discovery** - Automated infrastructure discovery from Kubernetes, Cloud, Prometheus, and distributed tracing
- **Intelligent Diagnostics** - Real-time collaborative analysis with streaming AI thought processes
- **Decision Optimization** - Resource allocation, capacity planning, and cost optimization recommendations
- **Report Generation** - Automated diagnostic and business impact reports with customizable templates

---

## Architecture

### Agent Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                   Global Supervisor                      │
│            (Orchestrates overall analysis)               │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│Team Supervisor│ │Team Supervisor│ │Team Supervisor│
│  (Database)   │ │  (Service)    │ │  (Gateway)    │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │
   ┌────┴────┐       ┌────┴────┐       ┌────┴────┐
   ▼         ▼       ▼         ▼       ▼         ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Worker│ │Worker│ │Worker│ │Worker│ │Worker│ │Worker│
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
```

### 5-Layer Topology Model

| Layer | Description | Examples |
|-------|-------------|----------|
| **Business Scenario** | End-user facing scenarios | Web Storefront, Mobile App |
| **Business Flow** | Traffic routing & orchestration | API Gateway, CDN, Load Balancer |
| **Business Application** | Core business services | Auth Service, Payment API, Order Service |
| **Middleware** | Supporting infrastructure | Redis Cache, Kafka, RabbitMQ |
| **Infrastructure** | Foundational resources | PostgreSQL, MongoDB, K8s Cluster |

---

## Features

### 1. Dashboard
- System health overview with real-time metrics
- Agent activity monitoring
- Quick access to recent diagnostics

### 2. Topology Management
- Interactive graph visualization with D3.js
- Drag-and-drop node positioning with layout caching
- 5-layer visual separation with color coding
- Link creation between nodes
- Barycenter-based automatic layout algorithm

### 3. Resource Management
- Detailed resource views with metadata editing
- Associated topology tracking
- Agent team assignment
- Analysis history with session replay

### 4. Agent Management
- Agent configuration (model, temperature, system instructions)
- Worker deployment from specialized templates
- Real-time status monitoring
- Findings aggregation (warnings/critical issues)

### 5. Discovery System
- **Connectors**: K8s, Cloud, Prometheus, Trace sources
- **Inbox**: Approval workflow for discovered nodes/links
- **Scanner**: AI-powered infrastructure exploration

### 6. Diagnostic Engine
- Hierarchical task delegation
- Real-time log streaming with agent attribution
- Click-to-focus: Navigate to agent messages in log stream
- Abort/resume capabilities

### 7. Report Generation
- AI-powered report creation
- Multiple report types: Diagnosis, Audit, Performance, Security
- Markdown content with Mermaid diagram support
- PDF export capability

### 8. Global Chat
- Context-aware AI assistant
- Resource & topology attachments
- Standalone mode (accessible via `?view=chat` URL parameter)

---

## Technology Stack

| Category | Technologies |
|----------|--------------|
| **Frontend Framework** | React 18.2, TypeScript 5.8 |
| **Build Tool** | Vite 6.2 |
| **Styling** | Tailwind CSS |
| **Visualization** | D3.js 7.9, Recharts 2.12, Mermaid 10.9 |
| **AI Integration** | Google Gemini AI (@google/genai) |
| **Icons** | Lucide React |
| **Markdown** | react-markdown, remark-gfm |
| **PDF Export** | html2pdf.js |
| **Testing** | Playwright |

---

## Project Structure

```
├── App.tsx                    # Main application component (990 lines)
├── types.ts                   # TypeScript type definitions (213 lines)
├── index.html                 # Entry HTML
├── index.css                  # Global styles
├── components/
│   ├── TopologyGraph.tsx      # D3-based topology visualization (1538 lines)
│   ├── ResourceDetailView.tsx # Resource detail page (1121 lines)
│   ├── SubGraphManagement.tsx # Topology list management (621 lines)
│   ├── GlobalChat.tsx         # AI chat interface (541 lines)
│   ├── TopologiesManagement.tsx # Topology CRUD (552 lines)
│   ├── ReportDetailView.tsx   # Report viewing/editing (502 lines)
│   ├── AgentManagement.tsx    # Agent configuration (454 lines)
│   ├── DiscoveryInbox.tsx     # Discovery approval queue (409 lines)
│   ├── ResourceManagement.tsx # Resource list (346 lines)
│   ├── DiscoveryManagement.tsx # Discovery connectors (311 lines)
│   ├── ReportManagement.tsx   # Report list (296 lines)
│   ├── ScannerView.tsx        # AI scanner interface (279 lines)
│   ├── Dashboard.tsx          # Main dashboard (278 lines)
│   ├── PromptManagement.tsx   # Prompt templates (276 lines)
│   ├── ReportTemplateManagement.tsx # Report templates (272 lines)
│   ├── SubGraphCanvas.tsx     # Topology canvas (257 lines)
│   ├── ModelManagement.tsx    # AI model config (257 lines)
│   ├── ToolManagement.tsx     # Agent tools (226 lines)
│   ├── AuthPage.tsx           # Authentication (210 lines)
│   ├── AgentConfigModal.tsx   # Agent config modal (167 lines)
│   ├── AgentHierarchy.tsx     # Agent tree view (146 lines)
│   ├── SettingsModal.tsx      # App settings (115 lines)
│   └── LogStream.tsx          # Real-time log display (105 lines)
├── services/
│   ├── mockData.ts            # Mock data & initial state (2048 lines)
│   └── geminiService.ts       # Gemini AI integration (445 lines)
└── public/                    # Static assets
```

**Total Source Code: ~13,000 lines of TypeScript/React**

---

## Data Models

### Core Types

```typescript
// Agent System
interface Agent {
  id: string;
  name: string;
  role: 'Global Supervisor' | 'Team Supervisor' | 'Worker' | 'Scouter';
  status: 'IDLE' | 'THINKING' | 'WORKING' | 'COMPLETED' | 'WAITING' | 'ERROR';
  specialty?: string;
  findings: { warnings: number; critical: number };
  config?: AgentConfig;
}

interface Team {
  id: string;
  resourceId: string;
  name: string;
  supervisor: Agent;
  members: Agent[];
}

// Topology System
interface TopologyNode {
  id: string;
  label: string;
  type: 'Database' | 'Service' | 'Gateway' | 'Cache' | 'Infrastructure';
  layer?: 'scenario' | 'flow' | 'application' | 'middleware' | 'infrastructure';
  properties?: Record<string, string>;
}

interface TopologyLink {
  source: string;
  target: string;
  type?: 'call' | 'deployment' | 'dependency' | 'inferred';
  confidence?: number;
}

// Discovery System
interface DiscoverySource {
  id: string;
  name: string;
  type: 'K8s' | 'Cloud' | 'Prometheus' | 'Trace';
  endpoint: string;
  status: 'Connected' | 'Error' | 'Scanning';
}
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Gemini API Key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/entropyops.git
cd entropyops

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local and set GEMINI_API_KEY
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | Yes |

---

## Usage Guide

### Running a Diagnosis

1. Navigate to **Topologies** and select or create a topology
2. Click **Diagnose Topology** to enter the diagnosis view
3. Enter your diagnostic query (e.g., "Analyze system health and identify bottlenecks")
4. Click **EXECUTE** to start the hierarchical agent analysis
5. Watch real-time collaboration in the log stream
6. Click on any agent in the left hierarchy to jump to their messages
7. Generate a report when analysis completes

### Managing Resources

1. Go to **Resources** to view all infrastructure nodes
2. Click a resource to see details, associated topologies, and agent teams
3. Edit metadata or add workers to the assigned team
4. View analysis history and replay previous sessions

### Discovery Workflow

1. Configure **Connectors** (K8s, Cloud, Prometheus, Trace)
2. Run scans to discover new infrastructure
3. Review discoveries in the **Inbox**
4. Approve or reject discovered nodes and links

---

## Roadmap: AI-Powered Unified Operations Platform

EntropyOps is evolving into a comprehensive **AI Operations Research · Business Operations · IT Operations** integrated platform.

### Vision

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AI 运筹·运营·运维 一体化平台                           │
├─────────────────────┬─────────────────────┬─────────────────────────────┤
│      运筹 (OR)      │      运营 (Biz)     │         运维 (Ops)          │
│  Decision & Optim.  │  Business Metrics   │     IT Operations          │
├─────────────────────┴─────────────────────┴─────────────────────────────┤
│                         AI Decision Engine                              │
├─────────────────────────────────────────────────────────────────────────┤
│                       Unified Data Platform                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Current Capabilities ✅

- [x] Infrastructure topology visualization (5-layer model)
- [x] Multi-agent collaborative diagnostics
- [x] Resource discovery & management
- [x] AI-powered report generation
- [x] Global chat assistant

---

### Phase 1: AIOps Enhancement (IT Operations)

| Feature | Description | Status |
|---------|-------------|--------|
| **Alert Management** | Alert aggregation, noise reduction, correlation, storm suppression | 🔲 Planned |
| **Anomaly Detection** | AI-based anomaly detection for metrics, logs, and traces | 🔲 Planned |
| **Root Cause Analysis** | Fault propagation analysis, automatic root cause identification | 🔲 Planned |
| **Change Risk Assessment** | Pre-change impact analysis, risk scoring, rollback suggestions | 🔲 Planned |
| **Capacity Forecasting** | Resource usage trend prediction, scaling recommendations | 🔲 Planned |
| **SLO/SLA Management** | Service level objectives, error budget tracking | 🔲 Planned |
| **Incident Management** | Incident lifecycle, on-call scheduling, escalation policies | 🔲 Planned |
| **Knowledge Base** | Fault case library, solution recommendations, similar issue matching | 🔲 Planned |

---

### Phase 2: Business Operations Integration

| Feature | Description | Status |
|---------|-------------|--------|
| **Business Metrics Dashboard** | Real-time KPI monitoring (GMV, conversion rate, user activity) | 🔲 Planned |
| **User Journey Analysis** | End-to-end behavior paths, conversion funnels, churn analysis | 🔲 Planned |
| **Business-Tech Correlation** | Causal relationship between business and technical metrics | 🔲 Planned |
| **Business Impact Assessment** | Quantify technical failures' business impact (revenue loss, affected users) | 🔲 Planned |
| **A/B Experiment Platform** | Experiment design, traffic allocation, effect analysis | 🔲 Planned |
| **Business Health Score** | Multi-dimensional business health scoring and early warning | 🔲 Planned |
| **Cost Allocation** | Cloud resource cost allocation by business line/product | 🔲 Planned |
| **Operations Calendar** | Promotions, events scheduling linked with system protection | 🔲 Planned |

---

### Phase 3: Operations Research & Decision Optimization

| Feature | Description | Status |
|---------|-------------|--------|
| **Intelligent Scheduling** | Optimal scheduling strategies for tasks, resources, and traffic | 🔲 Planned |
| **Resource Optimization** | Cloud resource configuration optimization, cost-performance balance | 🔲 Planned |
| **Predictive Auto-scaling** | Elastic scaling decisions based on business forecasting | 🔲 Planned |
| **Multi-objective Optimization** | Balance cost, performance, and availability trade-offs | 🔲 Planned |
| **Simulation & What-if Analysis** | Architecture change simulation, scenario analysis | 🔲 Planned |
| **Resource Planning** | Mid-to-long term resource procurement and configuration planning | 🔲 Planned |
| **On-call Optimization** | Optimal on-call and duty scheduling | 🔲 Planned |

---

### Phase 4: Intelligent Closed-loop Automation

| Feature | Description | Status |
|---------|-------------|--------|
| **Self-healing System** | Automated fault detection, decision, and remediation | 🔲 Planned |
| **Continuous Optimization** | Ongoing system tuning based on feedback loops | 🔲 Planned |
| **Knowledge Accumulation** | Learning from incidents and building organizational knowledge | 🔲 Planned |

---

### Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Unified Data Platform                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Metrics  │  │  Logs    │  │  Traces  │  │ Business │               │
│  │          │  │          │  │          │  │  Events  │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       └─────────────┴─────────────┴─────────────┘                      │
│                           │                                             │
│                ┌──────────▼──────────┐                                 │
│                │  Unified Data Model │                                 │
│                │ (Entity-Relation    │                                 │
│                │     Knowledge Graph)│                                 │
│                └──────────┬──────────┘                                 │
└───────────────────────────┼─────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────────┐
│                       AI Decision Engine                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Anomaly    │  │  Root Cause  │  │  Predictive  │                  │
│  │  Detection   │  │   Analysis   │  │   Warning    │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ Optimization │  │  Simulation  │  │  Automated   │                  │
│  │ Suggestions  │  │  & What-if   │  │  Decisions   │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────────┐
│                      Automation Execution Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ Self-healing │  │   Ticket     │  │   Change     │                  │
│  │   Actions    │  │  Workflow    │  │  Execution   │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Planned Module Structure

```
├── Data Layer
│   ├── Collectors
│   │   ├── MetricCollector      # Prometheus/InfluxDB integration
│   │   ├── LogCollector         # ELK/Loki integration
│   │   ├── TraceCollector       # Jaeger/Zipkin integration
│   │   └── BusinessEventCollector
│   ├── Storage
│   │   ├── TimeSeriesDB
│   │   ├── GraphDB              # Knowledge graph
│   │   └── VectorDB             # Semantic search
│   └── Governance
│
├── Intelligence Layer
│   ├── Detection Engine
│   │   ├── AnomalyDetector
│   │   ├── PatternMatcher
│   │   └── ThresholdManager
│   ├── Analysis Engine
│   │   ├── RootCauseAnalyzer
│   │   ├── ImpactAnalyzer
│   │   └── CorrelationEngine
│   ├── Prediction Engine
│   │   ├── CapacityForecaster
│   │   ├── TrendPredictor
│   │   └── RiskScorer
│   └── Optimization Engine
│       ├── ResourceOptimizer
│       ├── CostOptimizer
│       └── ScheduleOptimizer
│
├── Decision Layer
│   ├── Policy Engine
│   ├── Approval Workflow
│   └── Human-in-the-loop
│
└── Execution Layer
    ├── Orchestration
    ├── Runbook Execution
    └── Change Management
```

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**AI-Driven Operations Stack**

**From Decision Optimization to Business Operations and AIOps**

</div>
