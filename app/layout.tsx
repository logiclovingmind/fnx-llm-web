import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://logiclovingmind.com'),
  title: 'Logic Loving Mind | AI that answers every property buyer',
  description:
    'An always-on AI that replies to every WhatsApp, Instagram and form message in seconds, in your buyer’s own language. So no one is left waiting, day or night.',
  openGraph: {
    title: 'Logic Loving Mind',
    description: 'The always-on AI that answers every property buyer, instantly.',
    type: 'website',
    images: [{ url: '/logo-3d.png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#fbfaf8',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <head>
        <script
          // set theme before paint to avoid a flash of the wrong palette
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
