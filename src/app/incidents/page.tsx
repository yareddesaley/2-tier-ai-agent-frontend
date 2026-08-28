"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { api } from "@/lib/api";

export default function IncidentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("API latency increased");
  const [description, setDescription] = useState("Users reporting slow API responses and timeouts.");
  const [severity, setSeverity] = useState("High");
  const [scenarioId, setScenarioId] = useState("api-latency");

  const { data: incidents, isLoading } = useQuery({
    queryKey: ["incidents"],
    queryFn: api.getIncidents,
    refetchInterval: 5000,
  });

  const { data: scenarios } = useQuery({
    queryKey: ["scenarios"],
    queryFn: api.getScenarios,
  });

  const createMutation = useMutation({
    mutationFn: api.createIncident,
    onSuccess: (incident) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowForm(false);
      router.push(`/incidents/${incident.id}`);
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Incidents</h1>
          <p className="mt-2 text-sm font-medium text-slate-600">Create and manage AI-investigated incidents</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="font-semibold">
          <Plus className="mr-2 h-4 w-4 stroke-[2.5]" /> New Incident
        </Button>
      </div>

      {showForm && (
        <Card>
          <h2 className="mb-4 text-lg font-bold text-slate-900">Create Incident</h2>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate({ title, description, severity, scenarioId });
            }}
          >
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Title</span>
              <input
                className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2 font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Severity</span>
              <select
                className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2 font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Description</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2 font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Reference Scenario</span>
              <select
                className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2 font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={scenarioId}
                onChange={(e) => setScenarioId(e.target.value)}
              >
                {scenarios?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.description}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" disabled={createMutation.isPending} className="font-semibold">
                {createMutation.isPending ? "Creating..." : "Create Incident"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="font-semibold">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <p className="font-semibold text-slate-500">Loading incidents...</p>
        ) : incidents!.length === 0 ? (
          <p className="py-8 text-center font-semibold text-slate-500">No incidents yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] font-bold text-slate-700">
                  <th className="pb-3 pr-4 font-bold">Title</th>
                  <th className="pb-3 pr-4 font-bold">Scenario</th>
                  <th className="pb-3 pr-4 font-bold">Severity</th>
                  <th className="pb-3 pr-4 font-bold">Status</th>
                  <th className="pb-3 font-bold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {incidents!.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/50">
                    <td className="py-3 pr-4">
                      <Link href={`/incidents/${inc.id}`} className="font-semibold  hover:underline">
                        {inc.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-600">{inc.scenarioId}</td>
                    <td className="py-3 pr-4 font-semibold text-slate-800">{inc.severity}</td>
                    <td className="py-3 pr-4">
                      <Badge>{inc.status}</Badge>
                    </td>
                    <td className="py-3 font-medium text-slate-600">
                      {new Date(inc.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}