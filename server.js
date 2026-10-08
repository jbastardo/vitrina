import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80; // Nixpacks usually exposes 80 or 3000, we'll try to stick to standards

// Configurar el Proxy hacia Odoo para evadir CORS
// Todo lo que el frontend mande a /odoo_api, el servidor lo reenviará a Odoo sin restricciones de CORS.
app.use('/odoo_api', createProxyMiddleware({
  target: 'https://binaural-dev-onprotec-16.odoo.com',
  changeOrigin: true,
  pathRewrite: {
    '^/odoo_api': '', // Remueve el prefijo /odoo_api antes de enviarlo a Odoo
  },
  cookieDomainRewrite: {
    '*': '' // Asegura que las cookies de sesión (session_id) de Odoo se guarden en el navegador
  },
  onProxyReq: (proxyReq, req, res) => {
    // Algunos servidores Odoo requieren el Origin de ellos mismos o rechazan
    // proxyReq.setHeader('Origin', 'https://binaural-dev-onprotec-16.odoo.com');
  }
}));

// Servir los archivos estáticos generados por Vite
app.use(express.static(path.join(__dirname, 'dist')));

// Cualquier otra ruta la maneja React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
});
