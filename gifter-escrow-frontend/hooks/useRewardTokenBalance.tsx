import { REWARD_TOKEN_MINT } from '@/contract/config';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react';

const useRewardTokenBalance = () => {
  const { publicKey: walletAddress } = useWallet();
  const fetchRewardTokenBalance = async () => {
    const response = await axios.post(
      'https://devnet.helius-rpc.com/?api-key=8c2c9f64-3f11-4ff3-9909-2defbecc4447',
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
