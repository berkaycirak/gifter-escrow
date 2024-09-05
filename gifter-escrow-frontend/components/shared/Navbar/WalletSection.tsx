'use client';
import useBalance from '@/hooks/useBalance';
import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import React from 'react';
import WalletButton from '../WalletButton';
import SolanaIcon from '@/assets/icon/SolanaIcon';
import useWalletTokens from '@/hooks/useWalletTokens';
import useRewardTokenBalance from '@/hooks/useRewardTokenBalance';

const WalletSection = () => {
  const { balance, errorMessage, status } = useBalance();
  const { balance: rewardBalance } = useRewardTokenBalance();

  const { connected } = useWallet();
  return (
    <div className="flex items-center space-x-4">
      <p className="rounded border bg-secondary px-4 py-3">
        Reward Balance:{' '}
        <span className="font-bold">{rewardBalance || 0} GFT</span>
      </p>
      {connected && (
        <div
          className={cn(
            'flex min-w-[100px] cursor-pointer items-center gap-2 rounded border bg-primary px-4 py-3 text-white',
          )}
        >
          {balance} <SolanaIcon />
        </div>
      )}

      <WalletButton />
    </div>
  );
};

export default WalletSection;
