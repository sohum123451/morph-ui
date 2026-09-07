import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | MorphUI',
  description: 'Privacy Policy for MorphUI comparative analysis platform.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#053229] text-[#FFEDD1] p-6 sm:p-10 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-3 border-b border-[#355E58] pb-6">
          <Link href="/" className="inline-block text-xs font-mono uppercase tracking-widest text-[#FE9179] hover:underline">
            Back to Workbench
          </Link>
          <h1 className="text-3xl font-bold text-[#FFEDD1] tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-[#BCDDDC]">Effective Date: September 2026</p>
        </header>

        <section className="space-y-6 text-sm text-[#FFEDD1] leading-relaxed">
          <div className="p-5 rounded-xl bg-[#355E58] border border-[#355E58] space-y-2">
            <h2 className="text-base font-bold text-[#FFEDD1]">1. Information We Collect</h2>
            <p className="text-[#BCDDDC]">
              We collect search query terms, session identifiers, and optional uploaded comparison images to generate structured comparative matrices. User session data is encrypted at rest using AES-256-GCM.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#355E58] border border-[#355E58] space-y-2">
            <h2 className="text-base font-bold text-[#FFEDD1]">2. Processing and AI Synthesis</h2>
            <p className="text-[#BCDDDC]">
              Comparison queries are processed through our multi-tier retrieval pipeline to synthesize structured metrics. We do not sell your personal data or search histories to third parties.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#355E58] border border-[#355E58] space-y-2">
            <h2 className="text-base font-bold text-[#FFEDD1]">3. Data Security</h2>
            <p className="text-[#BCDDDC]">
              We implement industry-standard encryption protocols and cryptographic session tokens to safeguard comparison histories and user preferences.
            </p>
          </div>
        </section>

        <footer className="pt-6 border-t border-[#355E58] text-xs text-[#BCDDDC] flex items-center justify-between">
          <span>MorphUI 2026</span>
          <Link href="/terms" className="text-[#72B0AB] hover:underline">
            Terms of Service
          </Link>
        </footer>
      </div>
    </div>
  );
}
