import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | MorphUI',
  description: 'Terms of Service for MorphUI comparative analysis platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text p-6 sm:p-10 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-3 border-b border-theme-border pb-6">
          <Link href="/" className="inline-block text-xs font-mono uppercase tracking-widest text-theme-accent hover:underline">
            Back to Workbench
          </Link>
          <h1 className="text-3xl font-bold text-theme-text tracking-tight">Terms of Service</h1>
          <p className="text-sm text-theme-secondary">Effective Date: September 2026</p>
        </header>

        <section className="space-y-6 text-sm text-theme-text leading-relaxed">
          <div className="p-5 rounded-xl bg-theme-card border border-theme-border space-y-2">
            <h2 className="text-base font-bold text-theme-text">1. Agreement to Terms</h2>
            <p className="text-theme-secondary">
              By accessing and utilizing MorphUI, you agree to comply with and be bound by these terms. If you disagree with any part of these terms, you may not access the service.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-theme-card border border-theme-border space-y-2">
            <h2 className="text-base font-bold text-theme-text">2. Comparative Intelligence and Data Sources</h2>
            <p className="text-theme-secondary">
              MorphUI synthesizes information from public search results and AI consensus estimation. Comparative metrics, weights, and spatial mappings are generated for analytical purposes. Users are advised to independently verify critical procurement or financial decisions.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-theme-card border border-theme-border space-y-2">
            <h2 className="text-base font-bold text-theme-text">3. Intellectual Property and Usage</h2>
            <p className="text-theme-secondary">
              All interface designs, mathematical ranking algorithms, and visual graph layouts are proprietary to MorphUI. Automated scraping or abusive request volume is prohibited.
            </p>
          </div>
        </section>

        <footer className="pt-6 border-t border-theme-border text-xs text-theme-secondary flex items-center justify-between">
          <span>MorphUI 2026</span>
          <Link href="/privacy" className="text-theme-focus hover:underline">
            Privacy Policy
          </Link>
        </footer>
      </div>
    </div>
  );
}
