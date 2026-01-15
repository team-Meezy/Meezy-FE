import { LayoutPage, ServerCreateProvider } from '@meezy/ui';

export default function Page() {
  return (
    <ServerCreateProvider>
      <LayoutPage />
    </ServerCreateProvider>
  );
}
