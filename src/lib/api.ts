const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }

  return res.json();
}

export interface IncidentSummary {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  scenarioId: string;
  createdAt: string;
  confidence?: number;
  recommendedAction?: string;
}

export interface DashboardStats {
  total: number;
  open: number;
  investigating: number;
  awaitingApproval: number;
  resolved: number;
  escalated: number;
  recentIncidents: IncidentSummary[];
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
}

export interface Evidence {
  id: string;
  source: string;
  tool: string;
  observation: string;
  observedAt: string;
}

export interface TimelineEvent {
  event: string;
  status: string;
  timestamp: string;
  detail?: string;
}

export interface ApprovalRequest {
  id: string;
  status: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AgentAction {
  id: string;
  actionType: string;
  reason: string;
  riskLevel: string;
  confidence: number;
  status: string;
  approval?: ApprovalRequest;
  verificationJson?: string;
}

export interface Diagnosis {
  summary: string;
  rootCause: string;
  evidence: string[];
  alternativeCauses: string[];
  confidence: number;
  recommendedAction: string;
  riskLevel: string;
}

export interface IncidentDetail extends IncidentSummary {
  rootCause?: string;
  riskLevel?: string;
  diagnosis?: Diagnosis;
  evidence: Evidence[];
  timeline: TimelineEvent[];
  actions: AgentAction[];
  report?: { id: string; content: string; generatedAt: string };
  escalationReason?: string;
  escalationNextStep?: string;
}

export const api = {
  getDashboard: () => fetchApi<DashboardStats>("/api/dashboard"),
  getIncidents: () => fetchApi<IncidentSummary[]>("/api/incidents"),
  getIncident: (id: string) => fetchApi<IncidentDetail>(`/api/incidents/${id}`),
  createIncident: (data: {
    title: string;
    description: string;
    severity: string;
    scenarioId: string;
  }) =>
    fetchApi<IncidentSummary>("/api/incidents", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  investigate: (id: string) =>
    fetchApi<{ status: string; requiresApproval: boolean; pendingActionId?: string }>(
      `/api/incidents/${id}/investigate`,
      { method: "POST" }
    ),
  getScenarios: () => fetchApi<Scenario[]>("/api/reference-environment/scenarios"),
  approveAction: (id: string) =>
    fetchApi(`/api/actions/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ reviewer: "operator" }),
    }),
  rejectAction: (id: string) =>
    fetchApi(`/api/actions/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reviewer: "operator" }),
    }),
};
