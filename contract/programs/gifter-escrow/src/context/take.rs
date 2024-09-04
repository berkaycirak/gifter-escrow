
use::anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_interface::{Mint, TokenAccount, TokenInterface,close_account, transfer_checked, CloseAccount, TransferChecked}};

use crate::{CompleteEvent, GifterEscrow};


#[derive(Accounts)]
pub struct Take<'info>{
    #[account(mut)]
    pub maker:SystemAccount<'info>, // Maker will get the token from taker.
    #[account(mut)]
    pub taker:Signer<'info>, // taker will be the signer of the transaction.
    #[account(mint::token_program = token_program)]
    pub mint_a: Box<InterfaceAccount<'info,Mint>>,
    #[account(mint::token_program = token_program)]
    pub mint_b: Box<InterfaceAccount<'info,Mint>>,
    #[account(
        init_if_needed, //In case of no mint_b token account on the maker, taker is responsible to pay for creating that account. (After closing vault, we will send rent to the taker for equality)
        payer=taker,
        associated_token::mint = mint_b,
        associated_token::authority = maker,
        associated_token::token_program = token_program,

    )]
    pub maker_token_account_b:Box<InterfaceAccount<'info,TokenAccount>>, // Since taker will send mint_b to the maker's mint_b token account. 
    #[account(
        init_if_needed, // In case of no mint_a token account on the taker, taker is responsible to pay for creating that account
        payer=taker,
        associated_token::mint = mint_a,
        associated_token::authority = taker,
        associated_token::token_program = token_program,

    )]
    pub taker_token_account_a:Box<InterfaceAccount<'info,TokenAccount>>, // Since vault will send mint_a to the taker's mint_a token account
    #[account(
        mut,
        associated_token::mint = mint_b,
        associated_token::authority = taker,
        associated_token::token_program = token_program,

    )]
    pub taker_token_account_b:Box<InterfaceAccount<'info,TokenAccount>>, // Since maker will deposit to the escrow vault, we need that account
    #[account(
        mut,
        close=taker,
        seeds=[b"gifter_escrow",maker.key().as_ref(),gifter_escrow_state.escrow_id.to_le_bytes().as_ref()], // One maker can have multiple escrows on the platform, so we pass escrow_id to the seeds also (little endian ).
        bump=gifter_escrow_state.bump
    )]
    pub gifter_escrow_state:Box<Account<'info,GifterEscrow>>,
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = gifter_escrow_state,
        associated_token::token_program = token_program

    )]
    pub escrow_vault:Box<InterfaceAccount<'info,TokenAccount>>, // The vault is the token account of gifter_escrow_state in which deposited tokens can be transffered to the takers.
    pub system_program:Program<'info,System>, // This is for creating, closing accounts
    pub associated_token_program:Program<'info,AssociatedToken>, // This is for token_account derivations
    pub token_program:Interface<'info,TokenInterface> // This is for spl-token actions (transfer,close)
}


impl<'info> Take<'info> {

    // First, taker will send mint_b to the maker token account
    pub fn send_to_maker(&mut self)->Result<()>{
        println!("Hello");
         // Since the spl-token transfer will be handled here, our escrow program needs to invoke spl-token program's transfer method. Here _cpi_ is occuring.

         let accounts = TransferChecked {
            authority:self.taker.to_account_info(),
            from:self.taker_token_account_b.to_account_info(),
            to:self.maker_token_account_b.to_account_info(),
            mint:self.mint_b.to_account_info()
        };

        let cpi_context = CpiContext::new(self.token_program.to_account_info(), accounts);
        
        transfer_checked(cpi_context, self.gifter_escrow_state.maker_expected_price, self.mint_b.decimals)?;

        Ok(())
    }

    // Taker will take mint_a from the vault, then the vault should be closed since there is no amount in the vault anymore. Also, vault is a PDA, we will do CPI in here!
    pub fn take_from_vault(&mut self)->Result<()>{

        let accounts = TransferChecked {
            authority:self.gifter_escrow_state.to_account_info(), //Since the vault is belongs to gifter_escrow_state, the authority is gifter_escrow_state
            from:self.escrow_vault.to_account_info(), 
            to:self.taker_token_account_a.to_account_info(), //mint_a tokens will be transferred to taker token account
            mint:self.mint_a.to_account_info() // mint_a token will be transferred
        };

        // Since vault is a PDA instead of a wallet account, we should create a context using new_with_signer.
        let escrow_id=self.gifter_escrow_state.escrow_id.to_le_bytes();
        let bump=[self.gifter_escrow_state.bump];
        let signer_seeds= [&[b"gifter_escrow",self.maker.to_account_info().key.as_ref(),&escrow_id.as_ref(),&bump][..]];

        let cpi_context = CpiContext::new_with_signer(self.token_program.to_account_info(), accounts,&signer_seeds);
        
        // All mint_a token amount on the vault will be transferred to the taker.
        transfer_checked(cpi_context, self.escrow_vault.amount, self.mint_a.decimals)?;

         
         emit!(CompleteEvent{
            maker:self.maker.key(),
            taker:self.taker.key()
        });

        // After all tokens are transferred, we should close the vault since there is no need to exist with empty data. To do that, we should also invoke the spl token program's close method. CPI is here
        let accounts = CloseAccount {
          account:self.escrow_vault.to_account_info(),
          authority:self.gifter_escrow_state.to_account_info(),
          destination:self.taker.to_account_info() // Taker will get the rent payment for equality.
        };

        let cpi_context = CpiContext::new_with_signer(self.token_program.to_account_info(), accounts,&signer_seeds);

        close_account(cpi_context)?;

       

        Ok(())

    }
}


