import type { EntityType } from "../types";
import { Building2, User, Calendar, DollarSign, MapPin } from "lucide-react";

const CONFIG: Record<EntityType, { className: string; icon: typeof Building2 }> = {
  ORG: { className: "bg-primary-50 text-primary-700 border-primary-100", icon: Building2 },
  PERSON: { className: "bg-violet-50 text-violet-700 border-violet-100", icon: User },
  DATE: { className: "bg-blue-50 text-blue-700 border-blue-100", icon: Calendar },
  MONEY: { className: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: DollarSign },
  GPE: { className: "bg-rose-50 text-rose-700 border-rose-100", icon: MapPin },
};

export function EntityChip({ text, type }: { text: string; type: EntityType }) {
  const cfg = CONFIG[type] ?? CONFIG.ORG;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm ${cfg.className}`}
    >
      <Icon size={13} />
      {text}
    </span>
  );
}
