import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
	getOrCreateAssociatedTokenAccount,
	transfer,
} from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import * as bs58 from 'bs58';
import * as dotenv from 'dotenv';
import { IDL } from './idl/gifter_escrow.js';
import platformWallet from '../wallet/platform.json';

dotenv.config();

const platformKeypair = Keypair.fromSecretKey(
	new Uint8Array(platformWallet)
);

// Set up Solana connection with WebSocket
const connection = new Connection(
	'https://devnet.helius-rpc.com/?api-key=8c2c9f64-3f11-4ff3-9909-2defbecc4447',
	{
		wsEndpoint:
			'wss://devnet.helius-rpc.com/?api-key=8c2c9f64-3f11-4ff3-9909-2defbecc4447',
	}
);

// Load your Anchor program
const provider = new anchor.AnchorProvider(
	connection,
	new anchor.Wallet(anchor.web3.Keypair.generate()),
	{
		commitment: 'confirmed',
	}
);
anchor.setProvider(provider);

// const programId = new PublicKey(
// 	'BemBQbhhmECmafVvamPovEC51wT5h5qK4DvaNTd5p4u5'
// );

const program = new anchor.Program(IDL, provider);

console.log('Indexer is started');

const MINT_ADDRESS = 'AR6rsr7DHDocaiaeXaNow6iuSq127pRSSG9iFLBSJKWo';
const NUMBER_DECIMALS = 1e6;
const REWARD_AMOUNT = 1 * NUMBER_DECIMALS;

const sendRewardToken = async (
	destinationWalletAddress: PublicKey
) => {
	let sourceTokenAccount = await getOrCreateAssociatedTokenAccount(
		connection,
		platformKeypair,
		new PublicKey(MINT_ADDRESS),
		platformKeypair.publicKey
	);

	let destinationTokenAccount =
		await getOrCreateAssociatedTokenAccount(
			connection,
			platformKeypair,
			new PublicKey(MINT_ADDRESS),
			destinationWalletAddress
		);

	const signature = await transfer(
		connection,
		platformKeypair,
		sourceTokenAccount.address,
		destinationTokenAccount.address,
		platformKeypair,
		REWARD_AMOUNT
	);

	return signature;
};
// Set up an event listener for 'completeEvent'
const listener = program.addEventListener(
	'completeEvent',
	async (event: any) => {
		console.log('Event received:', event);

		// Extracting and logging the 'maker' field
		const makerPublicKey = event.maker.toBase58();
		console.log('Maker PublicKey:', makerPublicKey);

		// Additional processing can be done here

		const DESTINATION_WALLETS = [
			event.maker.toBase58(),
			event.taker.toBase58(),
		];
		let promises: any[] = [];
		DESTINATION_WALLETS.forEach(async (address) =>
			promises.push(sendRewardToken(new PublicKey(address)))
		);

		await Promise.all(promises);

		console.log('Reward is sended for both accounts');
	}
);

// Handle WebSocket disconnection and errors (Optional)
// connection.on('close', () => { ... });
// connection.on('error', (err) => { ... });
