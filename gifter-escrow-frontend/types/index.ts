import { PublicKey } from '@solana/web3.js';

export type Escrow = {
  escrowId: number;
  makerExpectedPrice: number;
  maker: PublicKey;
  mintA: PublicKey;
  mintB: PublicKey;
  bump: number;
};
