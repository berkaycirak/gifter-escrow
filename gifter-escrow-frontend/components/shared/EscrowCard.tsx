import { refund } from '@/contract/methods/refund';
import useProgram from '@/hooks/useProgram';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import React from 'react';

interface EscrowCardProps {
  price: number;
  mintA: string;
  mintB: string;
  maker: string;
  expected_mintB_price: number;
  escrow_id: number;
}

const EscrowCard = ({
  escrow_id,
  expected_mintB_price,
  mintA,
  mintB,
  maker,
  price,
}: EscrowCardProps) => {
  const wallet = useWallet();
  const program = useProgram();
  const { connection } = useConnection();

  const handleCancel = async () => {
    if (wallet.publicKey && program && connection) {
      await refund(
        new PublicKey(mintA),
        wallet.publicKey,
        escrow_id,
        program,
        connection,
      );
    }
  };
  return (
    <div className="rounded border-2 border-black">
      <p>{escrow_id}</p>
      <p> {expected_mintB_price / 1e6}</p>
      <p>{mintA}</p>
      <p>{mintB}</p>
      <p> {price}</p>
      <p>{maker}</p>
      {maker === wallet.publicKey?.toBase58() && (
        <button
          className="rounded bg-red-400 px-2 py-1 text-white"
          onClick={handleCancel}
        >
          Cancel
        </button>
      )}
    </div>
  );
};

export default EscrowCard;
