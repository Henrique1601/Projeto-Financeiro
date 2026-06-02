const https = require('https');

const CACHE_TTL = 60000;
let cache = {};
let cacheTime = 0;

const fetchAwesomeApi = (moedas) => {
  return new Promise((resolve, reject) => {
    const url = `https://economia.awesomeapi.com.br/json/last/${moedas}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Erro ao parsear resposta da AwesomeAPI'));
        }
      });
    }).on('error', reject);
  });
};

const getCambio = async (moedas) => {
  const now = Date.now();
  if (now - cacheTime < CACHE_TTL && Object.keys(cache).length) {
    const cached = {};
    for (const m of moedas) {
      if (cache[m]) cached[m] = cache[m];
    }
    if (Object.keys(cached).length === moedas.length) return cached;
  }

  const moedasStr = moedas.map(m => `${m}-BRL`).join(',');
  const data = await fetchAwesomeApi(moedasStr);
  const result = {};

  for (const m of moedas) {
    const key = `${m}BRL`;
    if (data[key]) {
      const bid = parseFloat(data[key].bid);
      result[m] = isNaN(bid) ? null : bid;
    } else {
      result[m] = null;
    }
  }

  cache = { ...cache, ...result };
  cacheTime = now;
  return result;
};

module.exports = { getCambio };
