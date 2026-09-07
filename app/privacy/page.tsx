import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | MorphUI',
  description: 'Privacy Policy for MorphUI comparative intelligence platform.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text p-6 sm:p-10 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-3 border-b border-theme-border pb-6">
          <Link href="/" className="inline-block text-xs font-mono uppercase tracking-widest text-theme-accent hover:underline">
            Back to Workbench
          </Link>
          <h1 className="text-3xl font-bold text-theme-text tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-theme-secondary">Effective Date: September 2026</p>
        </header>

        <section className="space-y-6 text-sm text-theme-text leading-relaxed">
          <div className="p-5 rounded-xl bg-theme-card border border-theme-border space-y-2">
            <h2 className="text-base font-bold text-theme-text">1. Information Collection</h2>
            <p className="text-theme-secondary">
              MorphUI processes query prompts submitted to generate comparative analyses. Query strings are passed to LLM orchestrators and search providers to extract real-time factual dimensions.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-theme-card border border-theme-border space-y-2">
            <h2 className="text-base font-bold text-theme-text">2. Data Usage and Security</h2>
            <p className="text-theme-secondary">
              We do not sell personal data. Comparison histories and metric weight configurations are stored locally or in session storage for your active analytical session.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-theme-card border border-theme-border space-y-2">
            <h2 className="text-base font-bold text-theme-text">3. Third-Party Integrations</h2>
            <p className="text-theme-secondary">
              Our service interacts with standard AI synthesis APIs and public search indexes to provide grounded metric extraction.
            </p>
          </div>
        </section>

        <footer className="pt-6 border-t border-theme-border text-xs text-theme-secondary flex items-center justify-between">
          <span>MorphUI 2026</span>
          <Link href="/terms" className="text-theme-focus hover:underline">
            Terms of Service
          </Link>
        </footer>
      </div>
    </div>
  );
}
