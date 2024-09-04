
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'

import { BN, Program } from '@coral-xyz/anchor'
import { deriveEscrowVaultPDA, deriveGifterEscrowStatePDA } from '../accounts/pda'
import { GifterEscrow } from '../idl/gifter_escrow'

const create_escrow = async (mint_a:PublicKey,mint_b:PublicKey,maker:PublicKey,escrow_id:number,deposit_amount:number,maker_expected_price:number,program:Program<GifterEscrow>,connection:Connection)=>{
    try {
const maker_token_account_a = await getAssociatedTokenAddress(mint_a,maker,true,TOKEN_PROGRAM_ID)
    const escrow_vault = deriveEscrowVaultPDA(mint_a)
    const gifter_escrow_state = deriveGifterEscrowStatePDA(maker,escrow_id)

    // const accounts = {
    //     maker,
    //     maker_token_account_a,
    //     mint_a,
    //     mint_b,
    //     escrow_vault,
    //     gifter_escrow_state,
    //     token_program:TOKEN_PROGRAM_ID,
    //     associated_token_program:ASSOCIATED_TOKEN_PROGRAM_ID,
    //     systemProgram:SystemProgram.programId,  
    // }



    const txHash = await program.methods.createEscrow(
        new BN(escrow_id),
        new BN(deposit_amount * 1e6),
        new BN(maker_expected_price * 1e6))
        .accounts({
        mintA:mint_a,
        mintB:mint_b,
        maker,
        tokenProgram:TOKEN_PROGRAM_ID
    })
    .rpc()

     const blockhash = await connection.getLatestBlockhash()
     const x = await connection.confirmTransaction(
        {
            blockhash:blockhash.blockhash,
            lastValidBlockHeight:blockhash.lastValidBlockHeight,
            signature:txHash
        }
     )
  console.log(txHash)
    } catch (error:any) {
        console.log(error)
        throw new Error(error?.message)
    }

    

}

export {create_escrow}