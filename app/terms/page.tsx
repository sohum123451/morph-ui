import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | MorphUI',
  description: 'Terms of Service for MorphUI comparative analysis platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#053229] text-[#FFEDD1] p-6 sm:p-10 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-3 border-b border-[#355E58] pb-6">
          <Link href="/" className="inline-block text-xs font-mono uppercase tracking-widest text-[#FE9179] hover:underline">
            Back to Workbench
          </Link>
          <h1 className="text-3xl font-bold text-[#FFEDD1] tracking-tight">Terms of Service</h1>
          <p className="text-sm text-[#BCDDDC]">Effective Date: September 2026</p>
        </header>

        <section className="space-y-6 text-sm text-[#FFEDD1] leading-relaxed">
          <div className="p-5 rounded-xl bg-[#355E58] border border-[#355E58] space-y-2">
            <h2 className="text-base font-bold text-[#FFEDD1]">1. Agreement to Terms</h2>
            <p className="text-[#BCDDDC]">
              By accessing and utilizing MorphUI, you agree to comply with and be bound by these terms. If you disagree with any part of these terms, you may not access the service.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#355E58] border border-[#355E58] space-y-2">
            <h2 className="text-base font-bold text-[#FFEDD1]">2. Comparative Intelligence and Data Sources</h2>
            <p className="text-[#BCDDDC]">
              MorphUI synthesizes information from public search results and AI consensus estimation. Comparative metrics, weights, and spatial mappings are generated for analytical purposes. Users are advised to independently verify critical procurement or financial decisions.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#355E58] border border-[#355E58] space-y-2">
            <h2 className="text-base font-bold text-[#FFEDD1]">3. Intellectual Property and Usage</h2>
            <p className="text-[#BCDDDC]">
              All interface designs, mathematical ranking algorithms, and visual graph layouts are proprietary to MorphUI. Automated scraping or abusive request volume is prohibited.
            </p>
          </div>
        </section>

        <footer className="pt-6 border-t border-[#355E58] text-xs text-[#BCDDDC] flex items-center justify-between">
          <span>MorphUI 2026</span>
          <Link href="/privacy" className="text-[#72B0AB] hover:underline">
            Privacy Policy
          </Link>
        </footer>
      </div>
    </div>
  );
}
