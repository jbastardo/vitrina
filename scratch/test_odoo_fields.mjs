import axios from 'axios';

async function testOdoo() {
  const baseUrl = 'https://binaural-dev-onprotec-16.odoo.com';
  const db = 'binaural-dev-onprotec-16-release-8815487';
  
  const authRes = await axios.post(`${baseUrl}/web/session/authenticate`, {
    jsonrpc: "2.0",
    method: "call",
    params: {
      db: db,
      login: "juan@onprotec.com",
      password: "9803"
    }
  });

  const uid = authRes.data.result.uid;
  const cookie = authRes.headers['set-cookie'] ? authRes.headers['set-cookie'].join('; ') : '';

  const res = await axios.post(`${baseUrl}/web/dataset/call_kw`, {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: 'product.product',
      method: 'search_read',
      args: [[['sale_ok', '=', true]]],
      kwargs: {
        limit: 1
      }
    }
  }, {
    headers: {
      Cookie: cookie
    }
  });

  const res2 = await axios.post(`${baseUrl}/web/dataset/call_kw`, {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: 'product.product',
      method: 'search_read',
      args: [[['esl_tag_ids', '!=', false]]],
      kwargs: {
        limit: 1,
        fields: ['display_name', 'esl_tag_ids', 'x_studio_esl']
      }
    }
  }, { headers: { Cookie: cookie } });

  console.log("Product with ESL tag:", res2.data.result[0]);

  const res3 = await axios.post(`${baseUrl}/web/dataset/call_kw`, {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: 'product.product',
      method: 'search_read',
      args: [[['x_studio_esl', '!=', false]]],
      kwargs: {
        limit: 1,
        fields: ['display_name', 'esl_tag_ids', 'x_studio_esl']
      }
    }
  }, { headers: { Cookie: cookie } });

  console.log("Product with x_studio_esl:", res3.data.result[0]);
}

testOdoo().catch(console.error);
