// import axios from 'axios';

export interface Product {
  id: number;
  name: string;
  sku: string;
  exhibited: boolean;
  stock_vitrina: number;
  stock_total: number;
}

// In a real scenario, this would use Odoo's JSON-RPC endpoint.
// For the purpose of the UI demonstration, we provide mock data,
// but include the real fetch structure below.
export class OdooAPI {
  baseUrl: string;
  db: string;
  
  constructor(baseUrl: string, db: string) {
    this.baseUrl = baseUrl;
    this.db = db;
  }

  // Real Odoo JSON-RPC call structure
  async call(_model: string, _method: string, _args: any[], _kwargs: any = {}) {
    /* 
    const response = await axios.post(`${this.baseUrl}/web/dataset/call_kw`, {
      jsonrpc: "2.0",
      method: "call",
      params: {
        model: model,
        method: method,
        args: args,
        kwargs: kwargs
      }
    });
    return response.data.result;
    */
    return [];
  }

  async getVitrinaProducts(): Promise<Product[]> {
    // Simulated delay for premium feel
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // MOCK DATA for demonstration
    return [
      { id: 1, name: "IPhone 15 Pro", sku: "APP-IP15P", exhibited: true, stock_vitrina: 2, stock_total: 10 },
      { id: 2, name: "Samsung Galaxy S24 Ultra", sku: "SAM-S24U", exhibited: false, stock_vitrina: 0, stock_total: 5 },
      { id: 3, name: "MacBook Air M3", sku: "APP-MBA-M3", exhibited: true, stock_vitrina: 1, stock_total: 3 },
      { id: 4, name: "Sony WH-1000XM5", sku: "SON-WH5", exhibited: false, stock_vitrina: 0, stock_total: 15 },
      { id: 5, name: "Apple Watch Series 9", sku: "APP-AW9", exhibited: true, stock_vitrina: 3, stock_total: 20 },
      { id: 6, name: "Logitech MX Master 3S", sku: "LOG-MX3S", exhibited: false, stock_vitrina: 0, stock_total: 8 },
    ];
  }
}

export const api = new OdooAPI('https://your-odoo-instance.com', 'your_db');
