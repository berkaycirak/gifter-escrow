'use client';

import { getWalletTokens } from '@/actions/getWalletTokens';
import EscrowCard from '@/components/shared/EscrowCard';
import { create_escrow } from '@/contract/methods/create';
import useProgram from '@/hooks/useProgram';
import { Escrow } from '@/types';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';

export default function Home() {
  const mintA = new PublicKey('7chEvNZDztDZYahhznCEgmuDVcmBEMtRZCKWVFAds78U');
  const mintB = new PublicKey('2GtJ857morRm9Rb6u3An3jhR4AhzkAAtyE3yTCyjaJ9Z');
  const { publicKey: signerPublicKey, sendTransaction } = useWallet();
  const program = useProgram();
  const { connection } = useConnection();

  const [escrows, setEscrows] = useState<any[]>([]);

  useEffect(() => {
    if (program && signerPublicKey) {
      const init = async () => {
        const all_escrows = await program?.account.gifterEscrow.all();
        getWalletTokens(signerPublicKey.toBase58());
        setEscrows(all_escrows);
      };

      init();
    }
  }, [program, signerPublicKey]);

  useEffect(() => {}, []);

  const handleCreate = async () => {
    if (signerPublicKey && program && connection) {
      await create_escrow(
        mintA,
        mintB,
        signerPublicKey,
        2,
        5,
        10,
        program,
        connection,
      );
    }
  };

  return (
    <main>
      {escrows.map((escrow) => {
        console.log(escrow);
        return (
          <EscrowCard
            key={Number(escrow.account.escrowId)}
            maker={escrow.account.maker.toBase58()}
            escrow_id={Number(escrow.account.escrowId)}
            expected_mintB_price={Number(escrow.account.makerExpectedPrice)}
            mintA={escrow.account.mintA.toBase58()}
            mintB={escrow.account.mintB.toBase58()}
            price={10}
          />
        );
      })}

      <button onClick={handleCreate}>Create</button>
    </main>
  );
}
