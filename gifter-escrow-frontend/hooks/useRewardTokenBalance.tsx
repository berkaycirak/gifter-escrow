import { REWARD_TOKEN_MINT } from '@/contract/config';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react';

const useRewardTokenBalance = () => {
  const { publicKey: walletAddress } = useWallet();
  const fetchRewardTokenBalance = async () => {
    const response = await axios.post(
      process.env.NEXT_PUBLIC_HELIUS_DAS_URL as string,
      {
        jsonrpc: '2.0',
        id: '',
        method: 'getTokenAccounts',
        params: {
          mint: REWARD_TOKEN_MINT,
          owner: walletAddress,
          page: 1,
          limit: 100,
          options: {},
        },
      },
    );

    return response.data.result.token_accounts[0].amount / 1e6;
  };

  const { data, status } = useQuery({
    queryKey: ['reward_balance', walletAddress],
    queryFn: fetchRewardTokenBalance,
  });
  return {
    balance: data,
    status,
  };
};

export default useRewardTokenBalance;
