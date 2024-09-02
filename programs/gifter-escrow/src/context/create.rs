use::anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_interface::{Mint, TokenAccount, TokenInterface,transfer_checked, TransferChecked}};


use crate::GifterEscrow;

#[derive(Accounts)]
#[instruction(escrow_id:u64)]
pub struct Create<'info>{
    #[account(mut)]
    pub maker:Signer<'info>, // maker will be the signer of the transaction during initialization of escrow.
    #[account(mint::token_program = token_program)]
    pub mint_a: InterfaceAccount<'info,Mint>,
    #[account(mint::token_program = token_program)]
    pub mint_b: InterfaceAccount<'info,Mint>,
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program,

    )]
    pub maker_token_account_a:InterfaceAccount<'info,TokenAccount>, // Since maker will deposit to the escrow vault, we need that account
    #[account(
        init, // escrow state will be initialized first
        payer=maker,
        space=GifterEscrow::INIT_SPACE,
        seeds=[b"gifter_escrow",maker.key().as_ref(),escrow_id.to_le_bytes().as_ref()], // One maker can have multiple escrows on the platform, so we pass escrow_id to the seeds also (little endian ).
        bump
    )]
    pub gifter_escrow_state:Account<'info,GifterEscrow>,
    #[account(
        init,
        payer=maker,
        associated_token::mint = mint_a,
        associated_token::authority = gifter_escrow_state,
        associated_token::token_program = token_program

    )]
    pub escrow_vault:InterfaceAccount<'info,TokenAccount>, // The vault is the token account of gifter_escrow_state in which deposited tokens can be transffered to the takers.
    pub system_program:Program<'info,System>,
    pub associated_token_program:Program<'info,AssociatedToken>,
    pub token_program:Interface<'info,TokenInterface>
   

}

// Implementation of methods to the above struct

impl<'info> Create<'info> {

    // That function is responsible to initialize gifter_escrow_state
    pub fn initialize_gifter_escrow(&mut self,escrow_id:u64,maker_expected_price:u64,bump:u8)->Result<()>{
        
        self.gifter_escrow_state.set_inner(GifterEscrow { 
            escrow_id, 
            maker_expected_price, 
            maker: self.maker.key(), 
            mint_a: self.mint_a.key(), 
            mint_b: self.mint_b.key(), 
            bump
        });
        Ok(())

    }

    // That function is responsible for transferring maker's tokens into the escrow vault (deposit)

    pub fn deposit_to_escrow_vault(&mut self,deposit_amount:u64)->Result<()>{

        // Since the spl-token transfer will be handled here, our escrow program needs to invoke spl-token program's transfer method. Here _cpi_ is occuring.

        let accounts = TransferChecked {
            authority:self.maker.to_account_info(),
            from:self.maker_token_account_a.to_account_info(),
            to:self.escrow_vault.to_account_info(),
            mint:self.mint_a.to_account_info()
        };

        let cpi_context = CpiContext::new(self.token_program.to_account_info(), accounts);
        
        transfer_checked(cpi_context, deposit_amount, self.mint_a.decimals)?;

        Ok(())

    }
}


