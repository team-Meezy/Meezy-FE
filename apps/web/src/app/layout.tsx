import './global.css';
import { RootLayoutWrapper } from '@meezy/ui/client';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] RootLayout rendering');
  }
  return <RootLayoutWrapper>{children}</RootLayoutWrapper>;
}
