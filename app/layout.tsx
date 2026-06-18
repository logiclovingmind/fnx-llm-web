import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Logic Loving Mind | Real Estate Automation Intelligence',
  description:
    'From a storm of leads to an empire that runs itself. Logic Loving Mind builds the always-on intelligence that captures every real-estate lead, books every site visit, and never misses a follow-up.',
  openGraph: {
    title: 'Logic Loving Mind',
    description: 'The always-on intelligence for real-estate automation.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#070318',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
