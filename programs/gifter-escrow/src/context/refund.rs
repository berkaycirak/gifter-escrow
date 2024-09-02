use::anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_interface::{Mint, TokenAccount, TokenInterface,close_account, transfer_checked, CloseAccount, TransferChecked}};


use crate::GifterEscrow;

#[derive(Accounts)]

pub struct Refund<'info>{
    #[account(mut)]
    pub maker:Signer<'info>, // maker will be the signer of the transaction during initialization of escrow.
    #[account(mint::token_program = token_program)]
    pub mint_a: InterfaceAccount<'info,Mint>,
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program,
    )]
    pub maker_token_account_a:InterfaceAccount<'info,TokenAccount>, // Since maker will deposit to the escrow vault, we need that account
    #[account(
        mut,
        close=maker, // escrow state account will be closed and rent will be payed to the maker
        seeds=[b"gifter_escrow",maker.key().as_ref(),gifter_escrow_state.escrow_id.to_le_bytes().as_ref()], // To find related PDA with escrow state account
        bump = gifter_escrow_state.bump
    )]
    pub gifter_escrow_state:Account<'info,GifterEscrow>,
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = gifter_escrow_state,
        associated_token::token_program = token_program

    )]
    pub escrow_vault:InterfaceAccount<'info,TokenAccount>,
    pub system_program:Program<'info,System>,
    pub associated_token_program:Program<'info,AssociatedToken>,
    pub token_program:Interface<'info,TokenInterface>
}

impl<'info> Refund<'info> {

    // Tokens will be transferred from vault to maker's token account. Therefore, there will be spl tokan program CPI.
    pub fn withdraw_from_vault(&mut self)->Result<()>{
        
        let accounts = TransferChecked {
            authority:self.gifter_escrow_state.to_account_info(), //Since the vault is belongs to gifter_escrow_state, the authority is gifter_escrow_state
            from:self.escrow_vault.to_account_info(), 
            to:self.maker_token_account_a.to_account_info(), //mint_a tokens will be transferred to maker token account
            mint:self.mint_a.to_account_info() // mint_a token will be transferred
        };

        // Since vault is a PDA instead of a wallet account, we should create a context using new_with_signer.

        let seed = self.gifter_escrow_state.escrow_id.to_le_bytes();
        let bump = [self.gifter_escrow_state.bump];
        let signer_seeds = [&[b"gifter_escrow", self.maker.to_account_info().key.as_ref(), seed.as_ref(), &bump][..]];

        let cpi_context = CpiContext::new_with_signer(self.token_program.to_account_info(), accounts,&signer_seeds);
        
        // All mint_a token amount on the vault will be refunded.
        transfer_checked(cpi_context, self.escrow_vault.amount, self.mint_a.decimals)?;

        // After all tokens are transferred, we should close the vault since there is no need to exist with empty data. To do that, we should also invoke the spl token program's close method. CPI is here
        let accounts = CloseAccount {
          account:self.escrow_vault.to_account_info(),
          authority:self.gifter_escrow_state.to_account_info(),
          destination:self.maker.to_account_info() // Since maker pay the rent amount as SOL, we should payback the rent after closing the account.
        };

        let cpi_context = CpiContext::new_with_signer(self.token_program.to_account_info(), accounts,&signer_seeds);

        close_account(cpi_context)?;

        Ok(())
    }
}
