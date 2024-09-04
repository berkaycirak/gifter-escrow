import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddressSync,TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {BN} from '@coral-xyz/anchor'
import { PROGRAM_ID} from "@/contract/config";

// Marketplace PDA
const gifter_escrow_state_pda = PublicKey.findProgramAddressSync(
  [Buffer.from("gifter_escrow"),],
  PROGRAM_ID,
)[0];



const deriveGifterEscrowStatePDA = (maker:PublicKey,escrow_id: number)=>{
  const x = new BN(escrow_id)


    const gifter_escrow_state_pda = PublicKey.findProgramAddressSync(
        [Buffer.from("gifter_escrow"),maker.toBuffer(), new BN(escrow_id).toArrayLike(Buffer,'le',8)],
        PROGRAM_ID,
      )[0];
      return gifter_escrow_state_pda
}


const deriveEscrowVaultPDA = (mintA:PublicKey)=>{
    const escrow_vault_pda = getAssociatedTokenAddressSync(
		mintA,
		gifter_escrow_state_pda,
		true,
		TOKEN_PROGRAM_ID
	);

    return escrow_vault_pda
}



export {
    deriveGifterEscrowStatePDA,deriveEscrowVaultPDA
}