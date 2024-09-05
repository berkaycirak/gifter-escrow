import { getWalletTokens } from '@/actions/getWalletTokens';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react';

const useWalletTokens = () => {
  const { publicKey: walletAddress } = useWallet();

  const fetchWalletTokens = async () => {
    const response = await axios.post(
      'https://devnet.helius-rpc.com/?api-key=8c2c9f64-3f11-4ff3-9909-2defbecc4447',
      {
        jsonrpc: '2.0',
        id: '',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 100,
          options: {
            showFungible: true,
          },
        },
      },
    );
    const tokens = await response.data;
    const idToSymbolMap = tokens.result.items.reduce((acc: any, item: any) => {
      acc[item.id] = item.content.metadata.symbol;
      return acc;
    }, {});

    return idToSymbolMap;
  };

  const { data } = useQuery({
    queryKey: ['walletTokens', walletAddress?.toBase58],
    queryFn: fetchWalletTokens,
  });

  console.log(data);
  return data;
};

export default useWalletTokens;
