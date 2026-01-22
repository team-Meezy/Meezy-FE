import { MainLayoutWrapper } from '@meezy/ui/client';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayoutWrapper>{children}</MainLayoutWrapper>;
}
