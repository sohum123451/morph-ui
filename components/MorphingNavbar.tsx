'use client';
/**
 * Figma layer naming (for parity when reverse-designed):
 *   Frame: "navbar-floating" (auto-layout, horizontal, gap-2, padding 8px)
 *     └─ Component Set: "nav-item" (variants: default / active)
 *          └─ "active-pill" (Sapphire fill, corner radius 999 — maps to layoutId)
 *          └─ "nav-label" (text, Lace/Heading token)
 *
 * Variable mapping: bg-surface/90 = Spruce@90%, bg-sapphire = active pill,
 * text-heading = inactive/active label color depending on state.
 */
import { useState } from "react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "compare", label: "Compare" },
  { id: "history", label: "History" },
  { id: "about", label: "About" },
];

export default function MorphingNavbar() {
  const [active, setActive] = useState("home");

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 rounded-full bg-surface/90 backdrop-blur-md border border-sapphire/20 px-2 py-2 shadow-lg shadow-black/20">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors active:scale-95 ${
                isActive ? "text-canvas" : "text-heading/80 hover:text-heading"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-active-pill"
                  className="absolute inset-0 rounded-full bg-sapphire"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
