import * as anchor from "@coral-xyz/anchor";
import { Program,BN } from "@coral-xyz/anchor";
import { GifterEscrow } from "../target/types/gifter_escrow";

describe("reward-escrow", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.GifterEscrow as Program<GifterEscrow>;

  const first_escrow_id = new BN(1)

  const deposit_amount = 

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.createEscrow(first_escrow_id,new BN(120),new BN(120));
    console.log("Your transaction signature", tx);
  });
});
