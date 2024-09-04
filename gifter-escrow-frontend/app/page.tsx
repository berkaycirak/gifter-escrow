"use client"

import { create_escrow } from "@/contract/methods/create";
import useProgram from "@/hooks/useProgram";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

export default function Home() {
const mintA = new PublicKey('7chEvNZDztDZYahhznCEgmuDVcmBEMtRZCKWVFAds78U')
const mintB = new PublicKey('2GtJ857morRm9Rb6u3An3jhR4AhzkAAtyE3yTCyjaJ9Z')
const {publicKey:signerPublicKey,sendTransaction} = useWallet()
const program = useProgram()
const {connection} = useConnection()
const [escrows,setEscrows] = useState<any[]>([])



useEffect(()=>{
  if(program && signerPublicKey){
    const init = async ()=>{
      const all_escrows = await program?.account.gifterEscrow.all()
      console.log(all_escrows)
      setEscrows(all_escrows)
      const tx = await create_escrow(
        mintA,
        mintB,
        signerPublicKey,
        8,
        5,
        10,
        program,
        connection
      )

      
      console.log(tx)
      
    }

  init()

    
  }
},[program,signerPublicKey])

useEffect(()=>{

},[])


 
 

  return <main>


  </main>;
}
