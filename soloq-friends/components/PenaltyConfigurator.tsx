"use client";

import type { Penalty } from "@/lib/penalties";

type PenaltyConfiguratorProps = {
  selectedPenalty: Penalty | undefined;
  onAssign: (penaltyId: number, extraConfig: string) => void;
};

export function PenaltyConfigurator({ selectedPenalty, onAssign }: PenaltyConfiguratorProps) {
  if (!selectedPenalty) return null;

  return (
    <button
      type="button"
      onClick={() => onAssign(selectedPenalty.id, "")}
      className="mt-4 rounded bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-500"
    >
      Aplicar: {selectedPenalty.text}
    </button>
  );
}
