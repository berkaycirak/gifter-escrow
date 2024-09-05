'use client';

import { getWalletTokens } from '@/actions/getWalletTokens';
import EscrowCard from '@/components/shared/EscrowCard';
import { create_escrow } from '@/contract/methods/create';
import useProgram from '@/hooks/useProgram';
import { Escrow } from '@/types';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
        Math.floor(Math.random() * 1000),
        5,
        10,
        program,
        connection,
      );
    }
  };

  return (
    <main>
      <button onClick={handleCreate}></button>

      <Dialog>
        <DialogTrigger className="mt-4" asChild>
          <Button>Create Escrow</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <ul className="mt-4">
        {escrows.map((escrow) => {
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
      </ul>
    </main>
  );
}
