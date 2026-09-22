import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Chronicle Ledger',
  description: 'Chronicle Ledger v2 — Requirement verification and developer journal',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'Chronicle Ledger',
    description: 'Chronicle Ledger v2 — Requirement verification and developer journal',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chronicle Ledger',
    description: 'Chronicle Ledger v2 — Requirement verification and developer journal',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
