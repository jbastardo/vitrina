// import axios from 'axios';

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

// In a real scenario, this would use Odoo's JSON-RPC endpoint.
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
        model: _model,
        method: _method,
        args: _args,
        kwargs: _kwargs
      }
    });
    return response.data.result;
    */
    return [];
  }

  async getVitrinaProducts(): Promise<Product[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return [
      { id: 1, name: "IPhone 15 Pro", sku: "APP-IP15P", brand: "Apple", category: "Smartphones", exhibited: true, stock_vitrina: 2, stock_total: 10, assigned_vendor: "Ana García" },
      { id: 2, name: "Galaxy S24 Ultra", sku: "SAM-S24U", brand: "Samsung", category: "Smartphones", exhibited: false, stock_vitrina: 0, stock_total: 5, assigned_vendor: null },
      { id: 3, name: "MacBook Air M3", sku: "APP-MBA-M3", brand: "Apple", category: "Laptops", exhibited: true, stock_vitrina: 1, stock_total: 3, assigned_vendor: "Carlos López" },
      { id: 4, name: "Sony WH-1000XM5", sku: "SON-WH5", brand: "Sony", category: "Audio", exhibited: false, stock_vitrina: 0, stock_total: 15, assigned_vendor: null },
      { id: 5, name: "Apple Watch Series 9", sku: "APP-AW9", brand: "Apple", category: "Wearables", exhibited: true, stock_vitrina: 3, stock_total: 20, assigned_vendor: "María Rodríguez" },
      { id: 6, name: "MX Master 3S", sku: "LOG-MX3S", brand: "Logitech", category: "Accesorios", exhibited: false, stock_vitrina: 0, stock_total: 8, assigned_vendor: null },
      { id: 7, name: "Galaxy Tab S9", sku: "SAM-TS9", brand: "Samsung", category: "Tablets", exhibited: false, stock_vitrina: 0, stock_total: 12, assigned_vendor: null },
      { id: 8, name: "AirPods Pro 2", sku: "APP-AP2", brand: "Apple", category: "Audio", exhibited: false, stock_vitrina: 0, stock_total: 25, assigned_vendor: null },
      { id: 9, name: "ThinkPad X1", sku: "LEN-X1", brand: "Lenovo", category: "Laptops", exhibited: false, stock_vitrina: 0, stock_total: 4, assigned_vendor: null },
      { id: 10, name: "Bose QuietComfort", sku: "BOS-QC", brand: "Bose", category: "Audio", exhibited: true, stock_vitrina: 2, stock_total: 9, assigned_vendor: "Juan Pérez" },
    ];
  }
}

export const api = new OdooAPI('https://your-odoo-instance.com', 'your_db');
