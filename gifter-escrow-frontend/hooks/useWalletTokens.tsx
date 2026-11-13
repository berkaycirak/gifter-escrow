import { getWalletTokens } from '@/actions/getWalletTokens';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react';

const useWalletTokens = () => {
  const { publicKey: walletAddress } = useWallet();
  const ownerAddress = walletAddress?.toBase58();

  const fetchWalletTokens = async () => {
    const dasUrl = process.env.NEXT_PUBLIC_HELIUS_DAS_URL;
    if (!dasUrl) {
      throw new Error('NEXT_PUBLIC_HELIUS_DAS_URL is not set');
    }
    if (!ownerAddress) {
      return {};
    }
    const response = await axios.post(
      dasUrl,
      {
        jsonrpc: '2.0',
        id: '',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress,
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
    queryKey: ['walletTokens', ownerAddress],
    queryFn: fetchWalletTokens,
    enabled: !!ownerAddress,
  });

  console.log(data);
  return data;
};

export default useWalletTokens;
