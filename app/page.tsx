import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import DesktopHome from '@/components/DesktopHome';
import MobileHome from '@/components/MobileHome';
import FloatingCta from '@/components/FloatingCta';
import { waHref } from '@/components/homeShared';
import { BRAND } from '@/lib/scenes';

export default function Page() {
  return (
    <>
      <header className="site-head">
        <div className="wrap">
          <a className="brand" href="#top" aria-label={BRAND.name}>
            <Logo size={34} priority />
            <span className="name">Logic Loving Mind</span>
          </a>
          <div className="head-actions">
            <ThemeToggle />
            <a className="btn btn-primary btn-sm" href={waHref} target="_blank" rel="noopener noreferrer">
              <span className="btn-label">Book a demo</span>
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        {/* two independent experiences, toggled by CSS — no flash, art-direct each freely */}
        <div className="view view-desktop">
          <DesktopHome />
        </div>
        <div className="view view-mobile">
          <MobileHome />
        </div>
      </main>

      {/* mobile-only floating CTA — lives outside the header so position:fixed
          anchors to the viewport (the header's backdrop-filter would trap it) */}
      <FloatingCta />

      <footer className="site-foot">
        <div className="wrap">
          <div className="brand">
            <Logo size={26} />
            <span className="name" style={{ fontSize: 15 }}>Logic Loving Mind</span>
          </div>
          <a className="foot-mail" href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
          <span>© {new Date().getFullYear()} Logic Loving Mind</span>
        </div>
      </footer>
    </>
  );
}
