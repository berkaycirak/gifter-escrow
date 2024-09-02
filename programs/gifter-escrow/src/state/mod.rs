use::anchor_lang::prelude::*;


#[account]
pub struct GifterEscrow {
    pub escrow_id:u64, // In case of more than one escrow, we should keep track of their ids.
    pub maker_expected_price:u64,// The price that maker expects to exchange.
    pub maker: Pubkey, // the user that will initialize the escrow
    pub mint_a:Pubkey, // The mint address of a token that will be deposited to the escrow.
    pub mint_b:Pubkey, // The mint address of a token that will be transferred to the maker.
    pub bump:u8, // Bump is crucial to find pda since it helps us to make optimization while deriving pda of that escrow state.
}

impl Space for GifterEscrow {
    const INIT_SPACE: usize =  8 //discrimanator
    + 8 // escrow_id
    + 8 // maker_expected_price
    + 32 // maker
    + 32 // mint_a
    + 32 // mint_b
    + 1 ; // bump 
}


#[event]
pub struct CompleteEvent{
    pub maker:Pubkey,
    pub taker:Pubkey
}





