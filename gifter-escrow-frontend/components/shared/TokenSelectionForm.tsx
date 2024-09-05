import useWalletTokens from '@/hooks/useWalletTokens';
import { ArrowRight } from 'lucide-react';
import React, { ChangeEvent, useState } from 'react';
import { Button } from '../ui/button';
import { PublicKey } from '@solana/web3.js';

interface TokenSelection {
  selectedTokenForExchange: string;
  amount: string;
}

interface FormState {
  token1: TokenSelection;
  token2: TokenSelection;
}

const TokenSelectionForm = ({
  handleCreate,
}: {
  handleCreate: (
    mintA: PublicKey,
    mintB: PublicKey,
    tokenGiveAmount: number,
    tokenWantAmount: number,
  ) => Promise<void>;
}) => {
  const walletTokens = useWalletTokens();
  const [formState, setFormState] = useState<FormState>({
    token1: { selectedTokenForExchange: '', amount: '' },
    token2: { selectedTokenForExchange: '', amount: '' },
  });

  const handleTokenChange = (
    tokenKey: keyof FormState,
    e: ChangeEvent<HTMLSelectElement>,
  ) => {
    setFormState({
      ...formState,
      [tokenKey]: {
        ...formState[tokenKey],
        selectedTokenForExchange: e.target.value,
      },
    });
  };

  const handleAmountChange = (
    tokenKey: keyof FormState,
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    setFormState({
      ...formState,
      [tokenKey]: {
        ...formState[tokenKey],
        amount: e.target.value,
      },
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await handleCreate(
      new PublicKey(formState.token1.selectedTokenForExchange),
      new PublicKey(formState.token2.selectedTokenForExchange),
      +formState.token1.amount,
      +formState.token2.amount,
    );
    console.log('Form submitted:', formState);
    // Here you can add logic to process the form data
  };

  const renderTokenRow = (tokenKey: keyof FormState, label: string) => (
    <div className="mb-4 flex space-x-4">
      <div className="w-1/2">
        <label
          htmlFor={`${tokenKey}-token`}
          className="mb-2 block text-sm font-bold text-gray-700"
        >
          {label}
        </label>
        <select
          id={`${tokenKey}-token`}
          value={formState[tokenKey].selectedTokenForExchange}
          onChange={(e) => handleTokenChange(tokenKey, e)}
          className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
        >
          <option value="">Select a token</option>
          {walletTokens &&
            Object.entries(walletTokens).map((token) => (
              <option key={token[0]} value={token[0]}>
                {token[1] as string}
              </option>
            ))}
        </select>
      </div>

      <div className="w-1/2">
        <label
          htmlFor={`${tokenKey}-amount`}
          className="mb-2 block text-sm font-bold text-gray-700"
        >
          Amount
        </label>
        <input
          type="text"
          id={`${tokenKey}-amount`}
          value={formState[tokenKey].amount}
          onChange={(e) => handleAmountChange(tokenKey, e)}
          className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
          placeholder="Enter amount"
        />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-2xl">
      {renderTokenRow('token1', 'I Give')}
      {renderTokenRow('token2', 'I Want')}
      <Button className="w-full" type="submit" onClick={handleSubmit}>
        Create
      </Button>
    </form>
  );
};

export default TokenSelectionForm;
