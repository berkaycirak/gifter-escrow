import axios from 'axios';

export const getWalletTokens = async (walletAddress: string) => {
  const response = await axios.post(
    process.env.NEXT_PUBLIC_HELIUS_DAS_URL as string,
    {
      jsonrpc: '2.0',
      id: '',
      method: 'getAssetsByOwner',
      params: {
        ownerAddress: walletAddress,
        page: 1,
        limit: 100,
        options: {
          showFungible: true,
        },
      },
    },
  );
  const data = await response.data;
  console.log(data);
  return data;
};
