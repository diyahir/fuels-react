import { useQuery } from '@tanstack/react-query';
import type { Provider } from 'fuels';
import { useClient } from '../../context';
import { BlockNotFound } from '../../errors';
import type { UseBlockConfig, UseBlockResult } from './useBlock';
import useChains from './useChains';

type BlockWithTransactions = Omit<
  NonNullable<Awaited<ReturnType<Provider['getBlockWithTransactions']>>>,
  'height'
> & {
  height: string;
};

function useBlockWithTransactions(
  config: UseBlockConfig<BlockWithTransactions>,
): UseBlockResult<BlockWithTransactions> {
  const client = useClient();
  const { currentChain } = useChains();

  const { data, error, status, isError, isFetching, isLoading, isSuccess } = useQuery({
    queryKey: ['blockWithTransactions', config.idOrHeight, currentChain?.name],
    queryFn: async () => {
      const provider = client.getDefaultProvider();
      if (!config.idOrHeight) throw new BlockNotFound();

      let blockId = config.idOrHeight;

      // somehow we need to check if we are passing a number stringified
      // otherwise it gets treated as a transactionId which impacts the result
      // this is a very small workaround, need to better handle it
      if (typeof blockId === 'string') {
        if (!isNaN(Number(blockId))) {
          blockId = Number(blockId);
        }
      }

      const block = await provider.getBlockWithTransactions(blockId);
      if (!block) throw new BlockNotFound();
      return {
        id: block.id,
        height: block.height.toString(),
        time: block.time,
        transactionIds: block.transactionIds,
        transactions: block.transactions,
      };
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

export default useBlockWithTransactions;
