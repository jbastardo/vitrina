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
  list_price: number;
  valuation: number;
  sales_count: number;
  purchases_count: number;
  is_hot_zone: boolean;
  days_in_vitrina: number | null;
  vitrina_in_date: string | null;
  has_serial: boolean;
  serial_numbers: Array<{ lotId: number; lotName: string; days: number; date: string }>;
  manual_rotation_date?: string | null;
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
    // Buscar todos los productos almacenables vendibles para poder calcular el total vs existencia
    const domain = [['sale_ok', '=', true], ['type', '=', 'product']];
    
    // 1. Fetch products
    const productsData = await this.call('product.product', 'search_read', [domain], {
      fields: ['id', 'display_name', 'default_code', 'qty_available', 'list_price', 'sales_count', 'purchased_product_qty', 'categ_id', 'brand_id', 'esl_tag_ids', 'x_studio_esl']
    });

    // 2. Fetch detailed stock quants in Vitrina (location_id = 36) with dates & serial numbers
    const vitrinaQuants = await this.call('stock.quant', 'search_read', 
      [[['location_id', '=', 36], ['quantity', '>', 0]]],
      {
        fields: ['product_id', 'quantity', 'lot_id', 'create_date']
      }
    );

    // Map vitrina stock and time in vitrina by product_id
    interface VitrinaQuantInfo {
      totalQty: number;
      oldestDate: string | null;
      maxDays: number;
      hasSerial: boolean;
      serials: Array<{ lotId: number; lotName: string; days: number; date: string }>;
    }

    const now = new Date();
    const vitrinaStockMap: Record<number, VitrinaQuantInfo> = {};

    vitrinaQuants.forEach((q: any) => {
      if (!q.product_id) return;
      const prodId = q.product_id[0];
      const createdDateStr = q.create_date ? q.create_date.replace(' ', 'T') + 'Z' : null;
      const createdTime = createdDateStr ? new Date(createdDateStr).getTime() : now.getTime();
      const diffDays = Math.max(0, Math.floor((now.getTime() - createdTime) / (1000 * 60 * 60 * 24)));

      if (!vitrinaStockMap[prodId]) {
        vitrinaStockMap[prodId] = {
          totalQty: 0,
          oldestDate: q.create_date || null,
          maxDays: diffDays,
          hasSerial: Boolean(q.lot_id),
          serials: []
        };
      }

      vitrinaStockMap[prodId].totalQty += (q.quantity || 0);
      if (diffDays > vitrinaStockMap[prodId].maxDays) {
        vitrinaStockMap[prodId].maxDays = diffDays;
        vitrinaStockMap[prodId].oldestDate = q.create_date;
      }
      if (q.lot_id) {
        vitrinaStockMap[prodId].hasSerial = true;
        vitrinaStockMap[prodId].serials.push({
          lotId: q.lot_id[0],
          lotName: q.lot_id[1],
          days: diffDays,
          date: q.create_date
        });
      }
    });

    let mappedProducts = productsData.map((p: any) => {
      let eslVal = null;
      if (p.x_studio_esl) {
        eslVal = p.x_studio_esl;
      } else if (p.esl_tag_ids && p.esl_tag_ids.length > 0) {
        eslVal = 'Asignado';
      }

      const vitrinaInfo = vitrinaStockMap[p.id];
      const vitrinaQty = vitrinaInfo ? vitrinaInfo.totalQty : 0;
      const stock_total = p.qty_available || 0;
      const list_price = p.list_price || 0;
      const valuation = stock_total * list_price;

      return {
        id: p.id,
        name: p.display_name || "Producto sin nombre",
        sku: p.default_code || `N/A-${p.id}`,
        brand: p.brand_id ? p.brand_id[1] : "Genérico",
        category: p.categ_id ? p.categ_id[1] : "Sin Categoría",
        esl: eslVal,
        exhibited: vitrinaQty > 0, // Es exhibido SOLO si hay inventario en Vitrina
        stock_vitrina: vitrinaQty,
        stock_total: stock_total,
        assigned_vendor: null,
        list_price: list_price,
        valuation: valuation,
        sales_count: p.sales_count || 0,
        purchases_count: p.purchased_product_qty || 0,
        is_hot_zone: false,
        days_in_vitrina: vitrinaQty > 0 && vitrinaInfo ? vitrinaInfo.maxDays : null,
        vitrina_in_date: vitrinaQty > 0 && vitrinaInfo ? vitrinaInfo.oldestDate : null,
        has_serial: vitrinaInfo ? vitrinaInfo.hasSerial : false,
        serial_numbers: vitrinaInfo ? vitrinaInfo.serials : []
      };
    });

    return mappedProducts;
  }
}

// Configuración extraída del Secret Vault y enrutada a través del proxy interno para evitar CORS
export const api = new OdooAPI('/odoo_api', 'binaural-dev-onprotec-16-release-8815487');
