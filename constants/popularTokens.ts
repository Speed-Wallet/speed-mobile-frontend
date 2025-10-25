/**
 * Popular tokens metadata
 * These tokens are displayed in the token selector for easy access
 */

import { TokenMetadata } from '@/services/tokenAssetService';

// Token address constants - single source of truth
export const USDT_ADDRESS = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
export const USDC_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const WSOL_ADDRESS = 'So11111111111111111111111111111111111111112';

export const WSOL_TOKEN = {
  address: WSOL_ADDRESS,
  name: 'Solana',
  symbol: 'SOL',
  logoURI: `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${WSOL_ADDRESS}/logo.png`,
  decimals: 9,
};
export const USDC_TOKEN = {
  address: USDC_ADDRESS,
  name: 'USD Coin',
  symbol: 'USDC',
  logoURI: `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${USDC_ADDRESS}/logo.png`,
  decimals: 6,
};
export const cbBTC_TOKEN = {
  address: 'cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij',
  name: 'Coinbase Wrapped BTC',
  symbol: 'cbBTC',
  logoURI:
    'https://ipfs.io/ipfs/QmZ7L8yd5j36oXXydUiYFiFsRHbi3EdgC4RuFwvM7dcqge',
  decimals: 8,
};
export const WBNB_TOKEN = {
  address: '9gP2kCy3wA1ctvYWQk75guqXuHfrEomqydHLtcTCqiLa',
  name: 'Wrapped BNB (Wormhole)',
  symbol: 'WBNB',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9gP2kCy3wA1ctvYWQk75guqXuHfrEomqydHLtcTCqiLa/logo.png',
  decimals: 8,
};
export const USDT_TOKEN = {
  address: USDT_ADDRESS,
  name: 'USDT',
  symbol: 'USDT',
  logoURI: `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${USDT_ADDRESS}/logo.svg`,
  decimals: 6,
};

export const POPULAR_TOKENS: TokenMetadata[] = [
  WSOL_TOKEN,
  cbBTC_TOKEN,
  USDC_TOKEN,
  USDT_TOKEN,
  WBNB_TOKEN,
  {
    address: 'WLFinEv6ypjkczcS83FZqFpgFZYwQXutRbxGe7oC16g',
    name: 'World Liberty Financial',
    symbol: 'WLFI',
    logoURI:
      'https://raw.githubusercontent.com/worldliberty/usd1-metadata/refs/heads/main/wlfi-logo.png',
    decimals: 6,
  },
  {
    address: '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv',
    name: 'Pudgy Penguins',
    symbol: 'PENGU',
    logoURI: 'https://arweave.net/BW67hICaKGd2_wamSB0IQq-x7Xwtmr2oJj1WnWGJRHU',
    decimals: 6,
  },
  {
    address: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
    name: 'OFFICIAL TRUMP',
    symbol: 'TRUMP',
    logoURI: 'https://arweave.net/VQrPjACwnQRmxdKBTqNwPiyo65x7LAT773t8Kd7YBzw',
    decimals: 6,
  },
  {
    address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    name: 'Jupiter',
    symbol: 'JUP',
    logoURI: 'https://static.jup.ag/jup/icon.png',
    decimals: 6,
  },
  {
    address: '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4',
    name: 'Jupiter Perps LP',
    symbol: 'JLP',
    logoURI: 'https://static.jup.ag/jlp/icon.png',
    decimals: 6,
  },
  {
    address: 'pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn',
    name: 'Pump',
    symbol: 'PUMP',
    logoURI:
      'https://ipfs.io/ipfs/bafkreibyb3hcn7gglvdqpmklfev3fut3eqv3kje54l3to3xzxxbgpt5wjm',
    decimals: 6,
  },
  {
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    name: 'Bonk',
    symbol: 'Bonk',
    logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
    decimals: 5,
  },
  {
    address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    name: 'dogwifhat',
    symbol: '$WIF',
    logoURI:
      'https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link',
    decimals: 6,
  },
  {
    address: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
    name: 'Fartcoin ',
    symbol: 'Fartcoin ',
    logoURI:
      'https://ipfs.io/ipfs/QmQr3Fz4h1etNsF7oLGMRHiCzhB5y9a7GjyodnF7zLHK1g',
    decimals: 6,
  },
  {
    address: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
    name: 'ai16z',
    symbol: 'ai16z',
    logoURI:
      'https://ipfs.io/ipfs/QmcNTVAoyJ7zDbPnN9jwiMoB8uCoJBUP9RGmmiGGHv44yX',
    decimals: 9,
  },
  {
    address: '4qQeZ5LwSz6HuupUu8jCtgXyW1mYQcNbFAW1sWZp89HL',
    name: 'PancakeSwap Token',
    symbol: 'Cake',
    logoURI:
      'https://tokens.pancakeswap.finance/images/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82.png',
    decimals: 9,
  },
  {
    address: '3iQL8BFS2vE7mww4ehAqQHAsbmRNCrPxizWAT2Zfyr9y',
    name: 'Virtual Protocol',
    symbol: 'VIRTUAL',
    logoURI:
      'https://ipfs.io/ipfs/bafkreifbjxsikdmuhk5qi6krg3sqk2fcqvqlcffrc44kg7ecfkmwhz6s5i',
    decimals: 9,
  },
  {
    address: '4NGbC4RRrUjS78ooSN53Up7gSg4dGrj6F6dxpMWHbonk',
    name: 'Pandu Pandas',
    symbol: 'PANDU',
    logoURI:
      'https://ipfs.io/ipfs/bafkreicplblomr55js3zlgztgg63w4jk6vdaxbchdsp5vrn7buv5gdkd2y',
    decimals: 6,
  },
  {
    address: 'A4RfnhcD1hk2QiVUx3TTtR7Af2RkgjvyJMcnogj9bonk',
    name: 'DogeFork',
    symbol: 'DORK',
    logoURI:
      'https://ipfs.io/ipfs/bafkreib3vkxxc7nboclug65uzdgmauxt5z53ravsafnhek5fuynhw2rwj4',
    decimals: 6,
  },
  {
    address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    name: 'Raydium',
    symbol: 'RAY',
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
    decimals: 6,
  },
  {
    address: 'DriFtupJYLTosbwoN8koMbEYSx54aFAVLddWsbksjwg7',
    name: 'Drift',
    symbol: 'DRIFT',
    logoURI: 'https://metadata.drift.foundation/drift.png',
    decimals: 6,
  },
  {
    address: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
    name: 'JITO',
    symbol: 'JTO',
    logoURI: 'https://metadata.jito.network/token/jto/image',
    decimals: 9,
  },
  {
    address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    name: 'POPCAT',
    symbol: 'POPCAT',
    logoURI: 'https://arweave.net/A1etRNMKxhlNGTf-gNBtJ75QJJ4NJtbKh_UXQTlLXzI',
    decimals: 9,
  },
  {
    address: 'Grass7B4RdKfBCjTKgSqnXkqjwiGvQyFbuSCUJr3XXjs',
    name: 'Grass',
    symbol: 'GRASS',
    logoURI: '',
    decimals: 9,
  },
  {
    address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    name: 'Orca',
    symbol: 'ORCA',
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png',
    decimals: 6,
  },
  {
    address: 'SarosY6Vscao718M4A778z4CGtvcwcGef5M9MEH1LGL',
    name: 'Saros',
    symbol: 'SAROS',
    logoURI: 'https://rapid.coin98.com/Currency/saros.png',
    decimals: 6,
  },
  {
    address: 'Dz9mQ9NzkBcCsuGPFJ3r1bS4wgqKMHBPiVuniW8Mbonk',
    name: 'USELESS COIN',
    symbol: 'USELESS',
    logoURI:
      'https://ipfs.io/ipfs/bafkreihsdoqkmpr5ryebaduoutyhj3nxco6wdp4s4743l2qrae4sz4hqrm',
    decimals: 6,
  },
];

export const TOKEN_MAP = Object.fromEntries(
  POPULAR_TOKENS.map((t) => [t.symbol, t]),
);

export const TOKEN_MAP_BY_ADDRESS = Object.fromEntries(
  POPULAR_TOKENS.map((t) => [t.address, t]),
);
