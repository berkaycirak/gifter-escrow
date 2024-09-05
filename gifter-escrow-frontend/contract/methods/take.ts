import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';

import { BN, Program } from '@coral-xyz/anchor';
import {
  deriveEscrowVaultPDA,
  deriveGifterEscrowStatePDA,
} from '../accounts/pda';
import { GifterEscrow } from '../idl/gifter_escrow';

const take = async (
  mintA: PublicKey,
  mintB: PublicKey,
  maker: PublicKey,
  taker: PublicKey,
  escrow_id: number,
  program: Program<GifterEscrow>,
  connection: Connection,
) => {
  try {
    const makerTokenAccountA = await getAssociatedTokenAddress(
      mintA,
      maker,
      true,
      TOKEN_PROGRAM_ID,
    );
    const makerTokenAccountB = await getAssociatedTokenAddress(
      mintB,
      maker,
      true,
      TOKEN_PROGRAM_ID,
    );
    const takerTokenAccountA = await getAssociatedTokenAddress(
      mintB,
      taker,
      true,
      TOKEN_PROGRAM_ID,
    );
    const takerTokenAccountB = await getAssociatedTokenAddress(
      mintB,
      taker,
      true,
      TOKEN_PROGRAM_ID,
    );

    const escrowVault = deriveEscrowVaultPDA(mintA);
    const gifterEscrowState = deriveGifterEscrowStatePDA(maker, escrow_id);

    const accounts = {
      maker,
      makerTokenAccountA,
      makerTokenAccountB,
      takerTokenAccountA,
      takerTokenAccountB,
      mintA,
      mintB,
      escrowVault,
      gifterEscrowState,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };

    const txHash = await program.methods
      .takeAndClose()
      .accounts({
        ...accounts,
      })
      .rpc();

    const blockhash = await connection.getLatestBlockhash();
    // Confirm the transaction
    await connection.confirmTransaction({
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
      signature: txHash,
    });
    console.log(txHash);
  } catch (error: any) {
    console.log(error);
    throw new Error(error?.message);
  }
};

export { take };
