import axios from 'axios';

export interface Product {
  id: number;
  name: string;
  sku: string;
  brand: string;
  category: string;
  exhibited: boolean;
  stock_vitrina: number;
  stock_total: number;
  assigned_vendor?: string | null;
  esl: string | null;
}

export const VENDORS = [
  "Yadhira",
  "Alejandro",
  "Luis",
  "Jose",
  "Igor"
];

export class OdooAPI {
  baseUrl: string;
  db: string;
  uid: number | null = null;
  
  constructor(baseUrl: string, db: string) {
    this.baseUrl = baseUrl;
    this.db = db;
  }

  async authenticate() {
    const response = await axios.post(`${this.baseUrl}/web/session/authenticate`, {
      jsonrpc: "2.0",
      method: "call",
      params: {
        db: this.db,
        login: "juan@onprotec.com",
        password: "9803"
      }
    });

    if (response.data.error) {
      console.error("Odoo Auth Error:", response.data.error);
      throw new Error(response.data.error.data?.message || "Error de Autenticación");
    }
    
    this.uid = response.data.result.uid;
  }

  async call(model: string, method: string, args: any[], kwargs: any = {}) {
    if (!this.uid) {
      await this.authenticate();
    }

    const response = await axios.post(`${this.baseUrl}/web/dataset/call_kw`, {
      jsonrpc: "2.0",
      method: "call",
      params: {
        model: model,
        method: method,
        args: args,
        kwargs: kwargs
      }
    }, {
      withCredentials: true // Importante para enviar la cookie session_id
    });

    if (response.data.error) {
      throw new Error(response.data.error.data?.message || "Error en llamada RPC");
    }

    return response.data.result;
  }

  async getVitrinaProducts(): Promise<Product[]> {
    // Buscar solo productos con stock total (qty_available > 0)
    const domain = [['sale_ok', '=', true], ['type', '=', 'product'], ['qty_available', '>', 0]];
    
    // 1. Fetch products
    const productsData = await this.call('product.product', 'search_read', [domain], {
      fields: ['id', 'display_name', 'default_code', 'qty_available', 'categ_id', 'brand_id', 'esl_tag_ids', 'x_studio_esl']
    });

    // 2. Fetch stock specifically in Vitrina (location_id = 36)
    const vitrinaStockData = await this.call('stock.quant', 'read_group', 
      [[['location_id', '=', 36], ['quantity', '>', 0]]],
      {
        fields: ['product_id', 'quantity'],
        groupby: ['product_id']
      }
    );

    // Map vitrina stock by product_id
    const vitrinaStockMap: Record<number, number> = {};
    vitrinaStockData.forEach((q: any) => {
      const prodId = q.product_id[0];
      vitrinaStockMap[prodId] = q.quantity;
    });

    return productsData.map((p: any) => {
      let eslVal = null;
      if (p.x_studio_esl) {
        eslVal = p.x_studio_esl;
      } else if (p.esl_tag_ids && p.esl_tag_ids.length > 0) {
        eslVal = 'Asignado';
      }

      const vitrinaQty = vitrinaStockMap[p.id] || 0;

      return {
        id: p.id,
        name: p.display_name || "Producto sin nombre",
        sku: p.default_code || `N/A-${p.id}`,
        brand: p.brand_id ? p.brand_id[1] : "Genérico",
        category: p.categ_id ? p.categ_id[1] : "Sin Categoría",
        esl: eslVal,
        exhibited: vitrinaQty > 0, // Es exhibido SOLO si hay inventario en Vitrina
        stock_vitrina: vitrinaQty,
        stock_total: p.qty_available || 0,
        assigned_vendor: null
      };
    });
  }
}

// Configuración extraída del Secret Vault y enrutada a través del proxy interno para evitar CORS
export const api = new OdooAPI('/odoo_api', 'binaural-dev-onprotec-16-release-8815487');
