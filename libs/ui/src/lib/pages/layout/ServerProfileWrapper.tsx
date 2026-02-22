import { ServerProfilePage } from '../ServerProfilePage';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useServerIdStore } from '@org/shop-data';

export function ServerProfileWrapper() {
  const params = useParams();
  const { setServerId } = useServerIdStore();

  useEffect(() => {
    if (params.serverId) {
      setServerId(params.serverId as string);
    }
  }, [params.serverId]);

  return <ServerProfilePage />;
}
