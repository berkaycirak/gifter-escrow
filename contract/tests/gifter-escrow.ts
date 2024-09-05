import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { GifterEscrow } from '../target/types/gifter_escrow';
import {
	Connection,
	Keypair,
	LAMPORTS_PER_SOL,
	PublicKey,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import takerWallet from '../wallet/taker.json';
import makerWallet from '../wallet/maker.json';

describe('gifter-escrow', () => {
	const taker = Keypair.fromSecretKey(new Uint8Array(takerWallet));
	const maker = Keypair.fromSecretKey(new Uint8Array(makerWallet));

	const connection = new Connection(
		'https://devnet.helius-rpc.com/?api-key=8c2c9f64-3f11-4ff3-9909-2defbecc4447',
		{
			wsEndpoint:
				'wss://devnet.helius-rpc.com/?api-key=8c2c9f64-3f11-4ff3-9909-2defbecc4447',
		}
	);

	const provider = new anchor.AnchorProvider(
		connection,
		new anchor.Wallet(maker),
		{
			commitment: 'confirmed',
		}
	);

	// Configure the client to use the local cluster.
	anchor.setProvider(provider);

	const program = anchor.workspace
		.GifterEscrow as Program<GifterEscrow>;

	const first_escrow_id = new BN(1);
	const mint_a = new PublicKey(
		'7chEvNZDztDZYahhznCEgmuDVcmBEMtRZCKWVFAds78U'
	);
	const mint_b = new PublicKey(
		'2GtJ857morRm9Rb6u3An3jhR4AhzkAAtyE3yTCyjaJ9Z'
	);
	// const maker = new PublicKey(
	// 	'8JSYNX179Meg1htpjkTZJybhXe62rX2HS4UWiRLszk6B'
	// );

	const gifter_escrow_state_pda = PublicKey.findProgramAddressSync(
		[
			Buffer.from('gifter_escrow'),
			maker.publicKey.toBuffer(),
			first_escrow_id.toArrayLike(Buffer, 'le', 8),
		],
		program.programId
	)[0];

	const escrow_vault_pda = getAssociatedTokenAddressSync(
		mint_a,
		gifter_escrow_state_pda,
		true,
		TOKEN_PROGRAM_ID
	);
	const maker_token_account_a = getAssociatedTokenAddressSync(
		mint_a,
		maker.publicKey,
		true,
		TOKEN_PROGRAM_ID
	);
	const maker_token_account_b = getAssociatedTokenAddressSync(
		mint_b,
		maker.publicKey,
		true,
		TOKEN_PROGRAM_ID
	);
	const taker_token_account_a = getAssociatedTokenAddressSync(
		mint_a,
		taker.publicKey,
		true,
		TOKEN_PROGRAM_ID
	);
	const taker_token_account_b = getAssociatedTokenAddressSync(
		mint_b,
		taker.publicKey,
		true,
		TOKEN_PROGRAM_ID
	);

	const accounts = {
		maker: maker.publicKey,
		taker: taker.publicKey,
		mintA: mint_a,
		mintB: mint_b,
		makerTokenAccountA: maker_token_account_a,
		makerTokenAccountB: maker_token_account_b,
		takerTokenAccountA: taker_token_account_a,
		takerTokenAccountB: taker_token_account_b,
		escrowVault: escrow_vault_pda,
		gifterEscrowState: gifter_escrow_state_pda,
		tokenProgram: TOKEN_PROGRAM_ID,
	};

	it('Is initialized!', async () => {
		// Add your test here.
		const tx = await program.methods
			.createEscrow(
				first_escrow_id,
				new BN(0.5 * 1e6),
				new BN(0.5 * 1e6)
			)
			.accounts({
				...accounts,
			})
			.rpc();
		console.log('Your transaction signature', tx);
	});

	xit('refund the token ', async () => {
		await program.methods
			.refund()
			.accounts({
				...accounts,
			})
			.rpc();
	});
	it('Take from the vault', async () => {
		program.addEventListener('completeEvent', (e) => {
			console.log(e.maker.toBase58());
		});
		const tx = await program.methods
			.takeAndClose()
			.accounts({
				...accounts,
			})
			.signers([taker])
			.rpc();

		console.log('Your transaction signature', tx);
	});
	it('read the escrows ', async () => {
		const data = await program.account.gifterEscrow.all();
	});
});
