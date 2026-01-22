import '../globals.css';
import { RootLayoutWrapper } from '@meezy/ui/client';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootLayoutWrapper>{children}</RootLayoutWrapper>;
}
