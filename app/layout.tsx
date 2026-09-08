import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Chronicle Ledger',
  description: 'Chronicle Ledger — Production Directives v2.4 Active',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'Chronicle Ledger',
    description: 'Chronicle Ledger — Production Directives v2.4 Active',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chronicle Ledger',
    description: 'Chronicle Ledger — Production Directives v2.4 Active',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
