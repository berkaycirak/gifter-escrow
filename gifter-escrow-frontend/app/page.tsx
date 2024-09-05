'use client';

import { getWalletTokens } from '@/actions/getWalletTokens';
import EscrowCard from '@/components/shared/EscrowCard';
import { create_escrow } from '@/contract/methods/create';
import useProgram from '@/hooks/useProgram';
import { Escrow } from '@/types';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import TokenSelectionForm from '@/components/shared/TokenSelectionForm';

export default function Home() {
  const { publicKey: signerPublicKey, sendTransaction } = useWallet();
  const program = useProgram();
  const { connection } = useConnection();

  const [escrows, setEscrows] = useState<any[]>([]);

  useEffect(() => {
    if (program && signerPublicKey) {
      const init = async () => {
        const all_escrows = await program?.account.gifterEscrow.all();
        console.log(all_escrows);

        setEscrows(all_escrows);
      };

      init();
    }
  }, [program, signerPublicKey]);

  useEffect(() => {}, []);

  const handleCreate = async (
    mintA: PublicKey,
    mintB: PublicKey,
    depositAmount: number,
    receiveAmount: number,
  ) => {
    if (signerPublicKey && program && connection) {
      const createPromise = create_escrow(
        mintA,
        mintB,
        signerPublicKey,
        Math.floor(Math.random() * 1000),
        depositAmount,
        receiveAmount,
        program,
        connection,
      );
      toast.promise(createPromise, {
        loading: 'Creating...',
        success: (data) => {
          if (data) {
            return 'Successfuly created!';
          }
        },
        error: 'An error occured',
      });
    }
  };

  return (
    <main>
      <Dialog>
        <DialogTrigger className="mt-4" asChild>
          <Button>Create Escrow</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-bold underline underline-offset-2">
              Creating Escrow
            </DialogTitle>
            <TokenSelectionForm handleCreate={handleCreate} />
            <DialogDescription>
              Your tokens will be deposited to the trusted vault.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <ul className="mt-4 flex flex-wrap gap-2">
        {escrows.map((escrow) => {
          return (
            <EscrowCard
              key={Number(escrow.account.escrowId)}
              maker={escrow.account.maker.toBase58()}
              escrow_id={Number(escrow.account.escrowId)}
              expected_mintB_price={Number(escrow.account.makerExpectedPrice)}
              mintA={escrow.account.mintA.toBase58()}
              mintB={escrow.account.mintB.toBase58()}
              price={Number(escrow.account.depositAmount) / 1e6}
            />
          );
        })}
      </ul>
    </main>
  );
}
