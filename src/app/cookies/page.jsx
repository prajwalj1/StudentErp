export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-24">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-6">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Legal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mb-2">Cookie Policy</h1>
        <p className="text-sm text-slate-400 mb-10">Last updated: June 2026</p>

        <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. What Are Cookies</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They help us remember your preferences and improve your browsing experience.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. How We Use Cookies</h2>
            <p>We use essential cookies for authentication and security, preference cookies to remember your settings, and analytics cookies to understand platform usage.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Types of Cookies We Use</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential:</strong> Required for login, session management, and platform security.</li>
              <li><strong>Preference:</strong> Remember your language, theme, and display settings.</li>
              <li><strong>Analytics:</strong> Anonymous usage data to help us improve our service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Managing Cookies</h2>
            <p>You can control cookies through your browser settings. Disabling essential cookies may affect platform functionality. Most browsers allow you to block or delete cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Third-Party Cookies</h2>
            <p>We do not use third-party tracking cookies. Any third-party services integrated into our platform have their own cookie policies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Updates</h2>
            <p>We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated revision date.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
