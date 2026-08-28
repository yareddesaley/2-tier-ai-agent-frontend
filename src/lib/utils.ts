import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAction(action: string) {
  return action.replace(/_/g, " ");
}

export function statusColor(status: string) {
  switch (status.toLowerCase()) {
    case "resolved":
    case "completed":
    case "approved":
      return "text-emerald-400";
    case "investigating":
    case "running":
    case "remediating":
    case "verifying":
      return "text-blue-400";
    case "awaitingapproval":
    case "pending":
      return "text-amber-400";
    case "escalated":
    case "failed":
    case "rejected":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}
