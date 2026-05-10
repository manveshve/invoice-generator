import { Badge } from "@/components/ui/badge";

type StatusType = "draft" | "sent" | "paid" | "overdue" | "cancelled" | string;

export function StatusBadge({ status, className }: { status: StatusType; className?: string }) {
  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case "draft":
        return "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200";
      case "sent":
        return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
      case "paid":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200";
      case "overdue":
        return "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-200";
      default:
        return "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200";
    }
  };

  const getStatusLabel = (s: string) => {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  };

  return (
    <Badge variant="outline" className={`font-medium shadow-none ${getStatusColor(status)} ${className || ""}`}>
      {getStatusLabel(status)}
    </Badge>
  );
}