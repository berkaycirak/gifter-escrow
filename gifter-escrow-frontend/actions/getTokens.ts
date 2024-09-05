import axios from 'axios';

export const getTokens = async (mintAddresses: string[]) => {
  const response = await axios.post(
    'https://devnet.helius-rpc.com/?api-key=8c2c9f64-3f11-4ff3-9909-2defbecc4447',
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
