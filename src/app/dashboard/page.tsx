"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge, Card, StatCard } from "@/components/ui";
import { api, IncidentSummary } from "@/lib/api";
import { cn } from "@/lib/utils";

function statusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "resolved": return "success" as const;
    case "escalated": return "danger" as const;
    case "awaitingapproval": return "warning" as const;
    case "investigating": return "warning" as const;
    default: return "default" as const;
  }
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.getDashboard,
    refetchInterval: 5000,
  });

  if (isLoading) return <p className="text-slate-400">Loading dashboard...</p>;
  if (error) return <p className="text-red-400">Failed to load dashboard. Is the API running?</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Operations Dashboard</h1>
        <p className="mt-2 text-slate-400">
          AI-powered Tier-2 incident response for your SaaS platform
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Incidents" value={data!.total} />
        <StatCard label="Open" value={data!.open} accent="text-blue-400" />
        <StatCard label="Investigating" value={data!.investigating} accent="text-amber-400" />
        <StatCard label="Awaiting Approval" value={data!.awaitingApproval} accent="text-orange-400" />
        <StatCard label="Resolved" value={data!.resolved} accent="text-emerald-400" />
        <StatCard label="Escalated" value={data!.escalated} accent="text-red-400" />
      </div>

      <Card>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Incidents</h2>
          <Link href="/incidents" className="text-sm text-blue-400 hover:underline">
            View all
          </Link>
        </div>
        {data!.recentIncidents.length === 0 ? (
          <div className="py-12 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-4 text-slate-400">No incidents yet. Create one to start the demo.</p>
            <Link href="/incidents" className="mt-4 inline-block text-blue-400 hover:underline">
              Create incident
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data!.recentIncidents.map((incident) => (
              <IncidentRow key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function IncidentRow({ incident }: { incident: IncidentSummary }) {
  return (
    <Link
      href={`/incidents/${incident.id}`}
      className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-4 transition hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <StatusIcon status={incident.status} />
        <div>
          <p className="font-medium">{incident.title}</p>
          <p className="text-sm text-slate-400">{incident.scenarioId}</p>
        </div>
      </div>
      <Badge variant={statusVariant(incident.status)}>{incident.status}</Badge>
    </Link>
  );
}

function StatusIcon({ status }: { status: string }) {
  const cls = "h-5 w-5 shrink-0";
  switch (status.toLowerCase()) {
    case "resolved": return <CheckCircle2 className={cn(cls, "text-emerald-400")} />;
    case "escalated": return <ShieldAlert className={cn(cls, "text-red-400")} />;
    case "investigating": return <Sparkles className={cn(cls, "text-amber-400")} />;
    default: return <Clock className={cn(cls, "text-slate-400")} />;
  }
}
