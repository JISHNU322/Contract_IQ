import { useEffect, useState } from "react";
import { Loader2, ScanSearch } from "lucide-react";
import { getContractEntities } from "../../api/contracts";
import { EntityChip } from "../../components/EntityChip";
import type { ContractEntity, EntityType } from "../../types";

const GROUP_LABELS: Record<EntityType, string> = {
  ORG: "Organizations",
  PERSON: "People",
  DATE: "Dates & durations",
  MONEY: "Monetary amounts",
  GPE: "Locations",
};

const GROUP_ORDER: EntityType[] = ["ORG", "PERSON", "MONEY", "DATE", "GPE"];

export function EntitiesTab({ contractId }: { contractId: number }) {
  const [entities, setEntities] = useState<ContractEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getContractEntities(contractId)
      .then(setEntities)
      .catch(() => setError("Couldn't load entities for this contract."))
      .finally(() => setIsLoading(false));
  }, [contractId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-primary-700" size={22} />
      </div>
    );
  }

  if (error) {
    return <p className="py-10 text-center text-sm text-ink-muted">{error}</p>;
  }

  if (entities.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-card border border-dashed border-border-strong py-14 text-center">
        <ScanSearch size={22} className="mb-3 text-ink-faint" />
        <p className="text-sm font-medium">No entities detected</p>
        <p className="mt-1 text-xs text-ink-faint">
          Named entities (organizations, dates, amounts) appear here once analysis completes.
        </p>
      </div>
    );
  }

  const grouped = GROUP_ORDER.map((type) => ({
    type,
    items: entities.filter((e) => e.entity_type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.type}>
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {GROUP_LABELS[group.type]}
            <span className="ml-1.5 text-ink-faint/70">({group.items.length})</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {group.items.map((e) => (
              <EntityChip key={e.id} text={e.entity_text} type={e.entity_type} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
