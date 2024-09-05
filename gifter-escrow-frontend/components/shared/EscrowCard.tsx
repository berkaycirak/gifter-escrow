import { refund } from '@/contract/methods/refund';
import useProgram from '@/hooks/useProgram';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { truncateString } from '@/utils/truncateString';
import { Button } from '../ui/button';
import { getTokens } from '@/actions/getTokens';
import { take } from '@/contract/methods/take';
import { toast } from 'sonner';

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
  const [tokenSymbols, setTokenSymbols] = useState({
    tokenA: '',
    tokenB: '',
  });

  const handleCancel = async () => {
    if (wallet.publicKey && program && connection) {
      const refundPromise = refund(
        new PublicKey(mintA),
        wallet.publicKey,
        escrow_id,
        program,
        connection,
      );
      toast.promise(refundPromise, {
        loading: 'Refunding...',
        success: (data) => {
          if (data) {
            return 'Successfuly refunded!';
          }
        },
        error: 'An error occured',
      });
    }
  };

  const handleAccept = async () => {
    if (wallet.publicKey && program && connection) {
      const takePromise = take(
        new PublicKey(mintA),
        new PublicKey(mintB),
        new PublicKey(maker),
        wallet.publicKey,
        escrow_id,
        program,
        connection,
      );
      toast.promise(takePromise, {
        loading: 'Taking...',
        success: (data) => {
          if (data) {
            return 'Successfuly taken!';
          }
        },
        error: 'An error occured',
      });
    }
  };

  useEffect(() => {
    const fetchTokenDetails = async () => {
      const tokens = await getTokens([mintA, mintB]);
      const idToSymbolMap = tokens.result.reduce((acc: any, item: any) => {
        if (item.id === mintA || item.id === mintB) {
          acc[item.id] = item.content.metadata.symbol;
        }
        return acc;
      }, {});

      setTokenSymbols({
        tokenA: idToSymbolMap[mintA],
        tokenB: idToSymbolMap[mintB],
      });
    };
    fetchTokenDetails();
  }, []);

  return (
    <div className="min-w-[350px] rounded border-primary/30 lg:max-w-md xl:max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle># {escrow_id}</CardTitle>
          <CardDescription>
            <span className="font-bold"> Maker: </span>
            {truncateString(maker, 5, 4)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            You will pay:
            <span className="ml-2 text-lg font-bold">
              {expected_mintB_price / 1e6} {tokenSymbols.tokenB}
            </span>
          </p>
          <p>
            You will get:
            <span className="ml-2 text-lg font-bold">
              {price} {tokenSymbols.tokenA}
            </span>
          </p>
          <p className="mt-4 text-sm font-bold text-primary">
            Accept to get{' '}
            <span className="rounded bg-primary/30 px-2 py-1 font-bold text-black">
              GFT
            </span>{' '}
            token reward!
          </p>
        </CardContent>
        <CardFooter>
          {maker === wallet.publicKey?.toBase58() ? (
            <Button className="w-full bg-red-400" onClick={handleCancel}>
              Cancel
            </Button>
          ) : (
            <Button className="w-full" onClick={handleAccept}>
              Accept
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default EscrowCard;
