export interface Agent {
  id: string;
  name: string;
  description: string;
  model_endpoint: string;
  system_prompt: string;
  tool_ids: string[];
  sub_agent_ids: string[];
  created_at: string | null;
  updated_at: string | null;
}

export interface Tool {
  id: string;
  name: string;
  type: string;
  description: string;
  mcp_url: string | null;
  enabled: boolean;
}

export interface DataTable {
  tableName: string;
  database: string;
  isTemporary: boolean;
}

export interface RunResult {
  run_id: string;
  output: string;
  tool_calls: Array<{ tool: string; input: Record<string, unknown> }>;
  latency_ms: number;
  status: 'success' | 'error';
}

export interface AgentCreate {
  name: string;
  description: string;
  model_endpoint: string;
  system_prompt: string;
  tool_ids: string[];
  sub_agent_ids: string[];
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}

export const fetchModels = () => get<string[]>('/api/v1/resources/models');
export const fetchTools = () => get<Tool[]>('/api/v1/resources/tools');
export const fetchAgents = () => get<Agent[]>('/api/v1/agents');
export const fetchTables = () => get<DataTable[]>('/api/v1/resources/tables');
export const createAgent = (data: AgentCreate) => post<Agent>('/api/v1/agents', data);
export const runAgent = (id: string, input: string) =>
  post<RunResult>(`/api/v1/agents/${id}/run`, { input });
