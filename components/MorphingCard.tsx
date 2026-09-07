'use client';
/**
 * Figma layer naming (for parity when reverse-designed):
 *   Frame: "feature-card"  -  Collapsed state (Trigger)
 *     └─ "card-icon", "card-title", "card-desc"  -  identical names/nesting
 *        must exist in the Expanded state so Smart Animate (and here,
 *        framer-motion's layoutId) can interpolate without glitches.
 *   Frame: "feature-modal"  -  Expanded state (Detail view)
 *     └─ same child names as above, larger sizing + "Close" button.
 *
 * Key rule: both states use SOLID fills (bg-surface), never a fill with
 * changing alpha mid-transition  -  avoids the alpha-flash Framer Motion
 * warns about when layoutId elements cross-fade backgrounds.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FEATURES = [
  {
    id: "spec",
    icon: "",
    title: "Spec Sheet View",
    description: "Side-by-side structured comparison of every metric, generated live.",
  },
  {
    id: "graph",
    icon: "️",
    title: "Relationship View",
    description: "See how compared entities relate to each other at a glance.",
  },
  {
    id: "voice",
    icon: "️",
    title: "Voice Search",
    description: "Speak your comparison query instead of typing it out.",
  },
];

export default function MorphingCardGrid() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = FEATURES.find((f) => f.id === selectedId);

  return (
    <div className="relative">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6">
        {FEATURES.map((feature) => (
          <motion.div
            key={feature.id}
            layoutId={`card-${feature.id}`}
            onClick={() => setSelectedId(feature.id)}
            className="cursor-pointer rounded-2xl bg-surface p-6 border border-sapphire/20 active:scale-95 transition-transform"
          >
            <motion.div layoutId={`icon-${feature.id}`} className="text-3xl mb-4">
              {feature.icon}
            </motion.div>
            <motion.h3 layoutId={`title-${feature.id}`} className="text-heading font-semibold text-lg mb-2">
              {feature.title}
            </motion.h3>
            <motion.p layoutId={`desc-${feature.id}`} className="text-muted text-sm">
              {feature.description}
            </motion.p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="fixed inset-0 bg-canvas/70 backdrop-blur-sm z-40"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div
                layoutId={`card-${selected.id}`}
                className="w-full max-w-lg rounded-2xl bg-surface p-8 border border-sapphire/20"
              >
                <motion.div layoutId={`icon-${selected.id}`} className="text-5xl mb-6">
                  {selected.icon}
                </motion.div>
                <motion.h3 layoutId={`title-${selected.id}`} className="text-heading font-bold text-2xl mb-3">
                  {selected.title}
                </motion.h3>
                <motion.p layoutId={`desc-${selected.id}`} className="text-muted text-base mb-6">
                  {selected.description}
                </motion.p>
                <button
                  onClick={() => setSelectedId(null)}
                  className="rounded-full bg-accent text-canvas font-semibold px-5 py-2 active:scale-95 transition-transform"
                >
                  Close
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
