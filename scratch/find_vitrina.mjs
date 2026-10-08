import axios from 'axios';

async function findVitrina() {
  const baseUrl = 'https://binaural-dev-onprotec-16.odoo.com';
  const db = 'binaural-dev-onprotec-16-release-8815487';
  
  const authRes = await axios.post(`${baseUrl}/web/session/authenticate`, {
    jsonrpc: "2.0",
    method: "call",
    params: { db, login: "juan@onprotec.com", password: "9803" }
  });

  const cookie = authRes.headers['set-cookie'] ? authRes.headers['set-cookie'].join('; ') : '';

  // 1. Find the location ID for "Vitrina"
  const locRes = await axios.post(`${baseUrl}/web/dataset/call_kw`, {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: 'stock.location',
      method: 'search_read',
      args: [[['name', 'ilike', 'vitrina']]],
      kwargs: { fields: ['id', 'display_name'] }
    }
  }, { headers: { Cookie: cookie } });

  console.log("Locations found:", locRes.data.result);
}

findVitrina().catch(console.error);
