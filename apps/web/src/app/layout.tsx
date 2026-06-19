import './global.css';
import type { Metadata } from 'next';
import { RootLayoutWrapper } from '@meezy/ui/client';

export const metadata: Metadata = {
  title: 'Meezy',
  description: 'AI meeting assistant for team collaboration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <RootLayoutWrapper>{children}</RootLayoutWrapper>
      </body>
    </html>
  );
}
