const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd';
const options = {
  method: 'GET',
  headers: {accept: 'application/json', 'x-cg-demo-api-key': 'CG-EzGunLz9CQhXyuzz6bRUx4b4'}
};

fetch(url, options)
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => console.error(err));