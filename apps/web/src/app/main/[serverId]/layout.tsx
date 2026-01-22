import { ServerIdLayoutWrapper } from '@meezy/ui/client';

export default function ServerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ServerIdLayoutWrapper>{children}</ServerIdLayoutWrapper>;
}
