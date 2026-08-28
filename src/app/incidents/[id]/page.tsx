"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Circle,
  Loader2,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge, Button, Card } from "@/components/ui";
import { api, AgentAction, IncidentDetail, TimelineEvent } from "@/lib/api";
import { cn } from "@/lib/utils";

const POLL_STATUSES = ["Open", "Investigating", "AwaitingApproval", "Remediating", "Verifying"];

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: incident, isLoading, error } = useQuery({
    queryKey: ["incident", id],
    queryFn: () => api.getIncident(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && POLL_STATUSES.includes(status) ? 2000 : false;
    },
  });

  const investigateMutation = useMutation({
    mutationFn: () => api.investigate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (actionId: string) => api.approveAction(actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (actionId: string) => api.rejectAction(actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", id] });
    },
  });

  if (isLoading) return <p className="text-slate-400">Loading incident...</p>;
  if (error || !incident) return <p className="text-red-400">Incident not found.</p>;

  const pendingAction = incident.actions.find(
    (a) => a.status === "AwaitingApproval" && a.approval?.status === "Pending"
  );
  const isAgentActive = ["Investigating", "Remediating", "Verifying"].includes(incident.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/incidents" className="text-sm text-blue-400 hover:underline">
            ← Back to incidents
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{incident.title}</h1>
          <p className="mt-2 text-slate-400">{incident.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusBadge(incident.status)}>{incident.status}</Badge>
          {incident.status === "Open" && (
            <Button
              onClick={() => investigateMutation.mutate()}
              disabled={investigateMutation.isPending}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {investigateMutation.isPending ? "Starting..." : "Investigate with AI"}
            </Button>
          )}
        </div>
      </div>

      {isAgentActive && (
        <Card className="border-blue-700/50 bg-blue-950/20">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            <div>
              <p className="font-medium text-blue-300">AI is investigating...</p>
              <p className="text-sm text-slate-400">
                Agent is using tools to gather evidence and diagnose the incident.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <InvestigationTimeline timeline={incident.timeline} isActive={isAgentActive} />
          <EvidencePanel evidence={incident.evidence} />
          {incident.diagnosis && <DiagnosisPanel incident={incident} />}
          {pendingAction && (
            <ApprovalPanel
              action={pendingAction}
              onApprove={() => approveMutation.mutate(pendingAction.id)}
              onReject={() => rejectMutation.mutate(pendingAction.id)}
              isLoading={approveMutation.isPending || rejectMutation.isPending}
            />
          )}
          {incident.report && <ReportPanel content={incident.report.content} />}
          {incident.status === "Escalated" && (
            <Card className="border-red-700/50">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-1 h-5 w-5 text-red-400" />
                <div>
                  <h3 className="font-semibold text-red-300">Escalated</h3>
                  <p className="mt-1 text-sm text-slate-300">{incident.escalationReason}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Next step: {incident.escalationNextStep}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 font-semibold">Incident Info</h3>
            <dl className="space-y-3 text-sm">
              <InfoRow label="Severity" value={incident.severity} />
              <InfoRow label="Scenario" value={incident.scenarioId} />
              <InfoRow label="Created" value={new Date(incident.createdAt).toLocaleString()} />
              {incident.confidence != null && (
                <InfoRow label="Confidence" value={`${(incident.confidence * 100).toFixed(0)}%`} />
              )}
              {incident.recommendedAction && (
                <InfoRow label="Recommended Action" value={incident.recommendedAction} />
              )}
              {incident.riskLevel && (
                <InfoRow label="Risk" value={incident.riskLevel} highlight={incident.riskLevel === "High"} />
              )}
            </dl>
          </Card>

          {incident.actions.length > 0 && (
            <Card>
              <h3 className="mb-4 font-semibold">Actions</h3>
              <div className="space-y-3">
                {incident.actions.map((action) => (
                  <ActionSummary key={action.id} action={action} />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function InvestigationTimeline({
  timeline,
  isActive,
}: {
  timeline: TimelineEvent[];
  isActive: boolean;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Bot className="h-5 w-5 text-blue-400" />
        <h3 className="font-semibold">AI Investigation Timeline</h3>
      </div>
      <div className="space-y-1">
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-400">No investigation activity yet.</p>
        ) : (
          timeline.map((event, i) => (
            <TimelineItem key={`${event.timestamp}-${i}`} event={event} />
          ))
        )}
        {isActive && (
          <div className="flex items-center gap-3 py-2 pl-1 text-sm text-blue-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Agent working...</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const icon = timelineIcon(event.status);
  return (
    <div className="flex items-start gap-3 py-2">
      {icon}
      <div className="flex-1">
        <p className="text-sm font-medium">{event.event}</p>
        {event.detail && <p className="text-xs text-slate-400">{event.detail}</p>}
        <p className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

function timelineIcon(status: string) {
  const cls = "mt-0.5 h-4 w-4 shrink-0";
  switch (status.toLowerCase()) {
    case "completed":
      return <CheckCircle2 className={cn(cls, "text-emerald-400")} />;
    case "failed":
    case "escalated":
    case "rejected":
      return <XCircle className={cn(cls, "text-red-400")} />;
    case "pending":
    case "awaitingapproval":
      return <AlertTriangle className={cn(cls, "text-amber-400")} />;
    case "running":
    case "executing":
      return <Loader2 className={cn(cls, "animate-spin text-blue-400")} />;
    default:
      return <Circle className={cn(cls, "text-slate-600")} />;
  }
}

function EvidencePanel({ evidence }: { evidence: IncidentDetail["evidence"] }) {
  if (evidence.length === 0) return null;
  return (
    <Card>
      <h3 className="mb-4 font-semibold">Evidence Collected</h3>
      <div className="space-y-2">
        {evidence.map((e) => (
          <div
            key={e.id}
            className="rounded-lg border border-[hsl(var(--border))] bg-slate-900/50 px-4 py-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-300">{e.source}</span>
              <span className="text-xs text-slate-500">{e.tool}</span>
            </div>
            <p className="mt-1 text-slate-300">{e.observation}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DiagnosisPanel({ incident }: { incident: IncidentDetail }) {
  const d = incident.diagnosis!;
  return (
    <Card>
      <h3 className="mb-4 font-semibold">AI Diagnosis</h3>
      <p className="text-slate-300">{d.summary}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-slate-500">Root Cause</p>
          <p className="mt-1 font-medium text-amber-200">{d.rootCause}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-500">Confidence</p>
          <p className="mt-1 font-medium">{(d.confidence * 100).toFixed(0)}%</p>
        </div>
      </div>
      {d.evidence.length > 0 && (
        <ul className="mt-4 list-inside list-disc text-sm text-slate-400">
          {d.evidence.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ApprovalPanel({
  action,
  onApprove,
  onReject,
  isLoading,
}: {
  action: AgentAction;
  onApprove: () => void;
  onReject: () => void;
  isLoading: boolean;
}) {
  return (
    <Card className="border-amber-600/50 bg-amber-950/20">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-amber-400" />
        <h3 className="font-semibold text-amber-200">Approval Required</h3>
      </div>
      <p className="mt-3 text-lg font-medium">{formatAction(action.actionType)}</p>
      <div className="mt-4 flex gap-6 text-sm">
        <div>
          <span className="text-slate-400">Risk: </span>
          <span className="font-semibold text-red-400">{action.riskLevel.toUpperCase()}</span>
        </div>
        <div>
          <span className="text-slate-400">Confidence: </span>
          <span className="font-semibold">{(action.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-300">
        <span className="text-slate-400">Reason: </span>
        {action.reason}
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="danger" onClick={onReject} disabled={isLoading}>
          Reject
        </Button>
        <Button onClick={onApprove} disabled={isLoading}>
          {isLoading ? "Processing..." : "Approve"}
        </Button>
      </div>
    </Card>
  );
}

function ReportPanel({ content }: { content: string }) {
  return (
    <Card>
      <h3 className="mb-4 font-semibold">Incident Report</h3>
      <pre className="whitespace-pre-wrap text-sm text-slate-300">{content}</pre>
    </Card>
  );
}

function ActionSummary({ action }: { action: AgentAction }) {
  let verification: { recovered?: boolean; before?: { latencyMs: number; status: string }; after?: { latencyMs: number; status: string } } | null = null;
  if (action.verificationJson) {
    try {
      verification = JSON.parse(action.verificationJson);
    } catch { /* ignore */ }
  }

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">{formatAction(action.actionType)}</span>
        <Badge variant={action.status === "Completed" ? "success" : "default"}>{action.status}</Badge>
      </div>
      {verification && (
        <div className="mt-2 text-xs text-slate-400">
          {verification.before && (
            <p>Before: {verification.before.latencyMs}ms / {verification.before.status}</p>
          )}
          {verification.after && (
            <p>After: {verification.after.latencyMs}ms / {verification.after.status}</p>
          )}
          {verification.recovered != null && (
            <p className={verification.recovered ? "text-emerald-400" : "text-red-400"}>
              {verification.recovered ? "RECOVERED" : "NOT RECOVERED"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className={cn("font-medium", highlight && "text-red-400")}>{value}</dd>
    </div>
  );
}

function statusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "resolved": return "success" as const;
    case "escalated": return "danger" as const;
    case "awaitingapproval": return "warning" as const;
    case "investigating": return "warning" as const;
    default: return "default" as const;
  }
}

function formatAction(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
