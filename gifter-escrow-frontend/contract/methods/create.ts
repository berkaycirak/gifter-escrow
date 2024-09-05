import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

import { BN, Program } from '@coral-xyz/anchor';

import { GifterEscrow } from '../idl/gifter_escrow';

const create_escrow = async (
  mintA: PublicKey,
  mintB: PublicKey,
  maker: PublicKey,
  escrow_id: number,
  deposit_amount: number,
  maker_expected_price: number,
  program: Program<GifterEscrow>,
  connection: Connection,
) => {
  try {
    const gifterEscrowState = PublicKey.findProgramAddressSync(
      [
        Buffer.from('gifter_escrow'),
        maker.toBuffer(),
        new BN(escrow_id).toArrayLike(Buffer, 'le', 8),
      ],
      program.programId,
    )[0];

    const escrowVault = getAssociatedTokenAddressSync(
      mintA,
      gifterEscrowState,
      true,
      TOKEN_PROGRAM_ID,
    );
    const makerTokenAccountA = getAssociatedTokenAddressSync(
      mintA,
      maker,
      true,
      TOKEN_PROGRAM_ID,
    );

    const txHash = await program.methods
      .createEscrow(
        new BN(escrow_id),
        new BN(deposit_amount * 1e6),
        new BN(maker_expected_price * 1e6),
      )
      .accountsPartial({
        escrowVault,
        gifterEscrowState,
        maker,
        makerTokenAccountA,
        mintA,
        mintB,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const blockhash = await connection.getLatestBlockhash();
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

export { create_escrow };
