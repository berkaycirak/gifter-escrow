
import { IDL } from "@/contract/idl/gifter_escrow";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { toast } from "sonner";

// That hook returns program based on AnchorProvider
const useProgram = () => {
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();

  const program = useMemo(() => {
    if (anchorWallet) {
      const provider = new AnchorProvider(
        connection,
        anchorWallet,
        AnchorProvider.defaultOptions(),
      );
      return new Program(IDL,provider);
    } else {
      toast.error("Connect Wallet please!");
    }
  }, [anchorWallet, connection]);

  return program;
};

export default useProgram;