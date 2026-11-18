import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Layout from './platform/Layout'
import { useAccount } from './account'
import { Overview, Soon, Cabinets, Billing } from './platform/pages/misc'
import { Chat, McpHub, SkillHub, RagHub, AgentWorld, MediaAgents, CodeAgent } from './platform/pages/ai'
import { ProChat } from './platform/pages/prochat'
import { LlmApi } from './platform/pages/llmapi'
import { MlProjects, MlTraining, MlRegistry } from './platform/pages/ml'
import { GpuDeploy, GpuPods } from './platform/pages/gpu'
import { Counters, Reports, Heatmap, Funnels, RawData, AppTracker } from './platform/pages/analytics'
import { AbPlatform } from './platform/pages/ab'
import { BiSources, BiAlerts } from './platform/pages/bi'
import { BiDashboards } from './platform/pages/dashboards'
import { BiQueries } from './platform/pages/biquery'
import { Vms, Databases, K8s } from './platform/pages/cloud'
import { DataCatalog, Pipelines, DataQuality } from './platform/pages/data'

function Protected({ children }: { children: JSX.Element }) {
  const { user } = useAccount()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/app"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Overview />} />
        <Route path="cabinets" element={<Cabinets />} />
        <Route path="billing" element={<Billing />} />

        <Route path="ai" element={<Navigate to="chat" replace />} />
        <Route path="ai/chat" element={<Chat />} />
        <Route path="ai/pro-chat" element={<ProChat />} />
        <Route path="ai/api" element={<LlmApi />} />
        <Route path="ai/mcp" element={<McpHub />} />
        <Route path="ai/skills" element={<SkillHub />} />
        <Route path="ai/rag" element={<RagHub />} />
        <Route path="ai/agents" element={<AgentWorld />} />
        <Route path="ai/media" element={<MediaAgents />} />
        <Route path="ai/code-agent" element={<CodeAgent />} />

        <Route path="ml/overview" element={<MlProjects />} />
        <Route path="ml/training" element={<MlTraining />} />
        <Route path="ml/registry" element={<MlRegistry />} />

        <Route path="gpu/deploy" element={<GpuDeploy />} />
        <Route path="gpu/pods" element={<GpuPods />} />

        <Route path="analytics/counters" element={<Counters />} />
        <Route path="analytics/reports" element={<Reports />} />
        <Route path="analytics/heatmap" element={<Heatmap />} />
        <Route path="analytics/funnels" element={<Funnels />} />
        <Route path="analytics/ab" element={<AbPlatform />} />
        <Route path="analytics/raw" element={<RawData />} />
        <Route path="analytics/apps" element={<AppTracker />} />

        <Route path="bi/sources" element={<BiSources />} />
        <Route path="bi/queries" element={<BiQueries />} />
        <Route path="bi/dashboards" element={<BiDashboards />} />
        <Route path="bi/alerts" element={<BiAlerts />} />

        <Route path="cloud/vms" element={<Vms />} />
        <Route path="cloud/databases" element={<Databases />} />
        <Route path="cloud/k8s" element={<K8s />} />

        <Route path="data/catalog" element={<DataCatalog />} />
        <Route path="data/pipelines" element={<Pipelines />} />
        <Route path="data/quality" element={<DataQuality />} />

        <Route path="soon/*" element={<Soon />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
