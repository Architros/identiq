"use client";

import { motion } from "framer-motion";
import { GenerationTile } from "@/components/brand-create/generation/asset-generation-panel";
import type {
  AssetCompleteData,
  AssetProgressData,
} from "@/lib/brand/create-stream-types";
import { groupGenerationItems } from "@/lib/brand/group-generation-items";
import { subgroupGridClass } from "@/lib/generation/aspect-ratio-styles";

type StarterPackGenerationViewProps = {
  items: AssetProgressData[];
  results: Map<string, AssetCompleteData>;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function StarterPackGenerationView({
  items,
  results,
}: StarterPackGenerationViewProps) {
  const groups = groupGenerationItems(items);

  if (groups.length === 0) return null;

  return (
    <motion.div
      className="space-y-10"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {groups.map((group) => {
        const groupSaved = group.subgroups.reduce(
          (n, sg) =>
            n + sg.items.filter((i) => i.status === "saved").length,
          0,
        );
        const groupTotal = group.subgroups.reduce(
          (n, sg) => n + sg.items.length,
          0,
        );

        return (
          <motion.section
            key={group.category}
            variants={sectionVariants}
            className="space-y-4"
          >
            <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
              <h3 className="text-sm font-semibold text-foreground">
                {group.label}
              </h3>
              <span className="text-xs text-muted tabular-nums">
                {groupSaved}/{groupTotal}
              </span>
            </div>

            <div className="space-y-6">
              {group.subgroups.map((subgroup) => (
                <div key={subgroup.catalogId} className="space-y-3">
                  {subgroup.items.length > 1 ? (
                    <p className="text-xs font-medium text-muted">
                      {subgroup.title}
                      <span className="ml-1.5 font-normal">
                        · {subgroup.items.length} variants
                      </span>
                    </p>
                  ) : null}
                  <div className={subgroupGridClass(subgroup.items)}>
                    {subgroup.items.map((progress) => (
                      <GenerationTile
                        key={progress.itemId}
                        progress={progress}
                        result={results.get(progress.itemId)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        );
      })}
    </motion.div>
  );
}
