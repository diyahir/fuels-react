import { useQuery } from '@tanstack/react-query';
import type { Block } from 'fuels';
import { useSnapshot } from 'valtio';
import { BlockNotFound, ProviderNotDefined } from '../errors';
import { providerStore } from '../stores';
import type { BaseUseQueryConfig, BaseUseQueryResult } from '../types';

export type UseBlockConfig<T = Block> = BaseUseQueryConfig<T> & {
  idOrHeight: string | number | null;
};

export type UseBlockResult<T = Block> = BaseUseQueryResult<T>;

function useBlock(config: UseBlockConfig): UseBlockResult {
  const { defaultProvider } = useSnapshot(providerStore);

  const { data, error, status, isError, isFetching, isLoading, isSuccess } = useQuery({
    queryKey: ['block', config.idOrHeight],
    queryFn: async () => {
      if (!defaultProvider) throw ProviderNotDefined;
      if (!config.idOrHeight) throw BlockNotFound;

      let blockId = config.idOrHeight;

      // somehow we need to check if we are passing a number stringified
      // otherwise it gets treated as a transactionId which impacts the result
      // this is a very small workaround, need to better handle it
      if (typeof blockId === 'string') {
        if (!isNaN(Number(blockId))) {
          blockId = Number(blockId);
        }
      }

      const block = await defaultProvider.getBlock(blockId);
      if (!block) throw BlockNotFound;
      return block;
    },
    onSuccess: config.onSuccess,
    onError: config.onError,
    enabled: !!config.idOrHeight,
  });

  return {
    data,
    error,
    status,
    isError,
    isFetching,
    isLoading,
    isSuccess,
  };
}

export default useBlock;
