import axios from 'axios';

export const getTokens = async (mintAddresses: string[]) => {
  const response = await axios.post(
    process.env.NEXT_PUBLIC_HELIUS_DAS_URL as string,
    {
      jsonrpc: '2.0',
      id: '',
      method: 'getAssetBatch',
      params: {
        ids: [...mintAddresses],
        options: {},
      },
    },
  );
  const data = await response.data;
  console.log(data);
  return data;
};
