// Mock transaction history data
const transactions = [
  {
    id: 't1',
    tokenId: 'btc',
    type: 'receive',
    amount: 0.05,
    price: 52000,
    date: new Date(2024, 3, 15),
    from: 'John Doe',
    hash: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  },
  {
    id: 't2',
    tokenId: 'eth',
    type: 'send',
    amount: 0.75,
    price: 3050,
    date: new Date(2024, 3, 14),
    to: 'Sarah Smith',
    hash: '0x8dC3535bDA734F6EAc5D05F3985FE8cD4b7DA16c',
  },
  {
    id: 't3',
    tokenId: 'btc',
    type: 'trade',
    amount: 0.02,
    price: 53000,
    date: new Date(2024, 3, 12),
    tradePair: 'BTC/ETH',
    hash: '0x7b69c4F2ACF77300025E49DbDb748A38810c8Pbe',
  },
  {
    id: 't4',
    tokenId: 'sol',
    type: 'receive',
    amount: 5.25,
    price: 120,
    date: new Date(2024, 3, 10),
    from: 'Exchange',
    hash: '0xbd28D0C559E85A47c8Fc9f4Ce930548eCf18Vbc7',
  },
  {
    id: 't5',
    tokenId: 'eth',
    type: 'withdraw',
    amount: 1.5,
    price: 3100,
    date: new Date(2024, 3, 8),
    method: 'Bank Account',
    hash: '0x6fC8b9728E722E44013B299187b254eA7d1a46f1',
  },
  {
    id: 't6',
    tokenId: 'matic',
    type: 'receive',
    amount: 500,
    price: 0.82,
    date: new Date(2024, 3, 5),
    from: 'Mining Pool',
    hash: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  },
  {
    id: 't7',
    tokenId: 'sol',
    type: 'send',
    amount: 10,
    price: 123,
    date: new Date(2024, 3, 3),
    to: 'Michael Brown',
    hash: '0x8dC3535bDA734F6EAc5D05F3985FE8cD4b7DA16c',
  },
  {
    id: 't8',
    tokenId: 'btc',
    type: 'trade',
    amount: 0.1,
    price: 51000,
    date: new Date(2024, 3, 1),
    tradePair: 'BTC/USDT',
    hash: '0x7b69c4F2ACF77300025E49DbDb748A38810c8Pbe',
  },
];

// Get all transaction history
export const getTransactionHistory = () => {
  return Promise.resolve(transactions);
};

// Get transaction history for a specific token
export const getTransactionHistoryForToken = (tokenId: string) => {
  const filtered = transactions.filter((tx) => tx.tokenId === tokenId);
  return Promise.resolve(filtered);
};
