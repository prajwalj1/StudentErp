/**
 * Owner Dashboard Layout
 *
 * Since Next.js nested layouts are additive (cannot remove parent content),
 * we use a fixed full-screen overlay with z-50 to completely cover the
 * global <Header> and <Footer> that are rendered by the root layout.
 * This gives the owner dashboard a clean, full-screen SaaS shell.
 */
export default function OwnerLayout({ children }) {
  return (
    <div className="bg-slate-50 min-h-full">
      {children}
    </div>
  );
}
