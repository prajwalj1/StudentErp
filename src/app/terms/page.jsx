export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-24">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-6">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Legal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-400 mb-10">Last updated: June 2026</p>

        <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Everest View ERP, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Account Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Notify us immediately of any unauthorized use.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Acceptable Use</h2>
            <p>You agree not to misuse the platform for unlawful activities, distributing malware, interfering with service operations, or violating others&apos; intellectual property rights.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Service Availability</h2>
            <p>We strive for 99.9% uptime but do not guarantee uninterrupted service. We reserve the right to perform maintenance, updates, or suspend services with reasonable notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Limitation of Liability</h2>
            <p>Everest View ERP shall not be liable for indirect, incidental, or consequential damages arising from your use of the platform, to the fullest extent permitted by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Termination</h2>
            <p>We may suspend or terminate your access for violation of these terms. Upon termination, your data will be exported and made available for 30 days before deletion.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
