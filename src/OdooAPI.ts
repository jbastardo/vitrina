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
}

export const VENDORS = [
  "Ana García",
  "Carlos López",
  "María Rodríguez",
  "Juan Pérez",
  "Sofía Martínez"
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
    // Aplicamos buenas prácticas del SKILL: Buscar en product.product, pedir display_name
    const domain = [['sale_ok', '=', true], ['type', '=', 'product']];
    
    const productsData = await this.call('product.product', 'search_read', [domain], {
      fields: ['id', 'display_name', 'default_code', 'qty_available', 'categ_id'],
      limit: 150 // Limitamos para no sobrecargar el frontend en la demo
    });

    return productsData.map((p: any) => ({
      id: p.id,
      name: p.display_name || "Producto sin nombre",
      sku: p.default_code || `N/A-${p.id}`,
      brand: "General", // Odoo nativo no tiene 'brand' a menos que haya un módulo instalado
      category: p.categ_id ? p.categ_id[1] : "Sin Categoría",
      exhibited: Math.random() > 0.5, // Simulado temporalmente, requeriría un campo custom en Odoo (ej: x_exhibited)
      stock_vitrina: 0, // Simulado, requeriría lógica de múltiples almacenes
      stock_total: p.qty_available || 0,
      assigned_vendor: null // Simulado, requeriría campo custom en Odoo
    }));
  }
}

// Configuración extraída del Secret Vault y enrutada a través del proxy interno para evitar CORS
export const api = new OdooAPI('/odoo_api', 'binaural-dev-onprotec-16-release-8815487');
