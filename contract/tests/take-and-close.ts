/**
 * Regression test: take_and_close must complete a token-for-token swap and close the vault.
 * The original handler started with println!("Hello"), which aborts on BPF with an access
 * violation, so a taker could never finish. Run on a local validator:
 *   anchor test
 * or, from contract/: yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/take-and-close.ts
 *
 * This file does not use the repo's older tests/gifter-escrow.ts, which talks to a shared
 * devnet setup with hard-coded mints and an RPC URL.
 */
import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { GifterEscrow } from '../target/types/gifter_escrow';
import { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
	TOKEN_PROGRAM_ID,
	ASSOCIATED_TOKEN_PROGRAM_ID,
	createMint,
	getOrCreateAssociatedTokenAccount,
	mintTo,
	getAccount,
	getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { expect } from 'chai';

describe('take-and-close completes the swap', () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);
	const program = anchor.workspace.GifterEscrow as Program<GifterEscrow>;
	const connection = provider.connection;
	const payer = (provider.wallet as anchor.Wallet).payer;

	const maker = Keypair.generate();
	const taker = Keypair.generate();
	const escrowId = new BN(1);
	const deposit = new BN(10_000_000); // 10 tokens, 6 decimals
	const want = new BN(5_000_000); // 5 tokens of mint B
	const DEC = 6;

	let mintA: PublicKey;
	let mintB: PublicKey;
	let state: PublicKey;
	let vault: PublicKey;

	it('creates an escrow and take_and_close swaps and closes the vault', async () => {
		const fund = async (to: Keypair) => {
			const sig = await connection.requestAirdrop(to.publicKey, 2 * LAMPORTS_PER_SOL);
			await connection.confirmTransaction(sig, 'confirmed');
		};
		await fund(maker);
		await fund(taker);

		mintA = await createMint(connection, payer, payer.publicKey, null, DEC);
		mintB = await createMint(connection, payer, payer.publicKey, null, DEC);

		const ataMA = await getOrCreateAssociatedTokenAccount(connection, payer, mintA, maker.publicKey);
		const ataTB = await getOrCreateAssociatedTokenAccount(connection, payer, mintB, taker.publicKey);
		await mintTo(connection, payer, mintA, ataMA.address, payer, 1_000_000_000);
		await mintTo(connection, payer, mintB, ataTB.address, payer, 1_000_000_000);

		state = PublicKey.findProgramAddressSync(
			[Buffer.from('gifter_escrow'), maker.publicKey.toBuffer(), escrowId.toArrayLike(Buffer, 'le', 8)],
			program.programId,
		)[0];
		vault = getAssociatedTokenAddressSync(mintA, state, true, TOKEN_PROGRAM_ID);

		await program.methods
			.createEscrow(escrowId, deposit, want)
			.accounts({
				maker: maker.publicKey,
				mintA,
				mintB,
				makerTokenAccountA: ataMA.address,
				gifterEscrowState: state,
				escrowVault: vault,
				systemProgram: SystemProgram.programId,
				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				tokenProgram: TOKEN_PROGRAM_ID,
			})
			.signers([maker])
			.rpc();

		expect(Number((await getAccount(connection, vault)).amount)).to.equal(deposit.toNumber());

		const ataMB = getAssociatedTokenAddressSync(mintB, maker.publicKey, false, TOKEN_PROGRAM_ID);
		const ataTA = getAssociatedTokenAddressSync(mintA, taker.publicKey, false, TOKEN_PROGRAM_ID);

		await program.methods
			.takeAndClose()
			.accounts({
				maker: maker.publicKey,
				taker: taker.publicKey,
				mintA,
				mintB,
				makerTokenAccountB: ataMB,
				takerTokenAccountA: ataTA,
				takerTokenAccountB: ataTB.address,
				gifterEscrowState: state,
				escrowVault: vault,
				systemProgram: SystemProgram.programId,
				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				tokenProgram: TOKEN_PROGRAM_ID,
			})
			.signers([taker])
			.rpc();

		expect(Number((await getAccount(connection, ataTA)).amount)).to.equal(deposit.toNumber());
		expect(Number((await getAccount(connection, ataMB)).amount)).to.equal(want.toNumber());
		expect(await connection.getAccountInfo(vault)).to.equal(null);
		expect(await connection.getAccountInfo(state)).to.equal(null);
	});
});
