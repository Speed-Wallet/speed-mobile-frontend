import colors from '@/constants/colors';

// Mock cryptocurrency data
const cryptos = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    iconUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    price: 54000.00,
    priceChangePercentage: 2.4,
    balance: 0.4531,
    color: colors.bitcoin,
    network: 'Bitcoin',
    marketCap: 1050000000000,
    volume24h: 30000000000,
    circulatingSupply: 19000000,
    maxSupply: 21000000,
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    price: 3100.00,
    priceChangePercentage: 1.9,
    balance: 2.7845,
    color: colors.ethereum,
    network: 'Ethereum',
    marketCap: 380000000000,
    volume24h: 15000000000,
    circulatingSupply: 120000000,
    maxSupply: null,
  },
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    iconUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    price: 126.30,
    priceChangePercentage: 5.2,
    balance: 26.5410,
    color: colors.solana,
    network: 'Solana',
    marketCap: 54000000000,
    volume24h: 2000000000,
    circulatingSupply: 425000000,
    maxSupply: 489000000,
  },
  {
    id: 'matic',
    name: 'Polygon',
    symbol: 'MATIC',
    iconUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    price: 0.80,
    priceChangePercentage: -2.1,
    balance: 1250.00,
    color: colors.polygon,
    network: 'Polygon',
    marketCap: 8000000000,
    volume24h: 400000000,
    circulatingSupply: 10000000000,
    maxSupply: 10000000000,
  }
];

// Get a list of cryptocurrencies
export const getCryptoData = () => {
  return Promise.resolve(cryptos);
};

// Get a specific cryptocurrency by ID
export const getCryptoById = (id: string) => {
  const crypto = cryptos.find(c => c.id === id);
  return Promise.resolve(crypto || null);
};

// Get all available cryptocurrencies for market view
export const getAllCryptoData = () => {
  // Add more cryptocurrencies for market view
  const marketCryptos = [
    ...cryptos,
    {
      id: 'dot',
      name: 'Polkadot',
      symbol: 'DOT',
      iconUrl: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png',
      price: 7.23,
      priceChangePercentage: 0.8,
      balance: 0,
      color: '#E6007A',
      network: 'Polkadot',
      marketCap: 9000000000,
      volume24h: 300000000,
      circulatingSupply: 1250000000,
      maxSupply: null,
    },
    {
      id: 'avax',
      name: 'Avalanche',
      symbol: 'AVAX',
      iconUrl: 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
      price: 35.60,
      priceChangePercentage: 4.5,
      balance: 0,
      color: '#E84142',
      network: 'Avalanche',
      marketCap: 12000000000,
      volume24h: 700000000,
      circulatingSupply: 350000000,
      maxSupply: 720000000,
    },
    {
      id: 'atom',
      name: 'Cosmos',
      symbol: 'ATOM',
      iconUrl: 'https://cryptologos.cc/logos/cosmos-atom-logo.png',
      price: 10.05,
      priceChangePercentage: -1.2,
      balance: 0,
      color: '#2E3148',
      network: 'Cosmos',
      marketCap: 3800000000,
      volume24h: 150000000,
      circulatingSupply: 380000000,
      maxSupply: null,
    },
    {
      id: 'ada',
      name: 'Cardano',
      symbol: 'ADA',
      iconUrl: 'https://cryptologos.cc/logos/cardano-ada-logo.png',
      price: 0.52,
      priceChangePercentage: -0.5,
      balance: 0,
      color: '#0033AD',
      network: 'Cardano',
      marketCap: 18000000000,
      volume24h: 500000000,
      circulatingSupply: 35000000000,
      maxSupply: 45000000000,
    },
    {
      id: 'shib',
      name: 'Shiba Inu',
      symbol: 'SHIB',
      iconUrl: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png',
      price: 0.000018,
      priceChangePercentage: 12.4,
      balance: 0,
      color: '#FFA409',
      network: 'Ethereum',
      marketCap: 11000000000,
      volume24h: 1200000000,
      circulatingSupply: 589000000000000,
      maxSupply: 1000000000000000,
    }
  ];
  
  return Promise.resolve(marketCryptos);
};