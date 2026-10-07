import React, { useEffect, useState, useMemo } from 'react';
import { Package, Search, Filter, AlertCircle, CheckCircle2, Store } from 'lucide-react';
import { api, Product } from './OdooAPI';
import './index.css';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'EXHIBITED' | 'MISSING'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await api.getVitrinaProducts();
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products from Odoo:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // First apply search
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            p.sku.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      // Then apply status filter
      if (filter === 'EXHIBITED') return p.exhibited;
      if (filter === 'MISSING') return !p.exhibited;
      return true;
    });
  }, [products, filter, search]);

  const missingCount = products.filter(p => !p.exhibited).length;
  const exhibitedCount = products.filter(p => p.exhibited).length;

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">
          <Store size={36} color="#818cf8" />
          Control de Vitrina - Odoo
        </h1>
        <button className="button" onClick={() => window.location.reload()}>
          Actualizar Datos
        </button>
      </header>

      <div className="stats-grid">
        <div className="card stat-card">
          <span className="stat-label">Total Productos</span>
          <span className="stat-value">{products.length}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Exhibidos en Vitrina</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>{exhibitedCount}</span>
        </div>
        <div className="card stat-card" style={{ borderColor: missingCount > 0 ? 'var(--danger)' : '' }}>
          <span className="stat-label">Faltantes en Vitrina</span>
          <span className="stat-value" style={{ color: 'var(--danger)' }}>{missingCount}</span>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <button 
            className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            Todos los Productos
          </button>
          <button 
            className={`filter-btn ${filter === 'EXHIBITED' ? 'active' : ''}`}
            onClick={() => setFilter('EXHIBITED')}
          >
            Exhibidos
          </button>
          <button 
            className={`filter-btn ${filter === 'MISSING' ? 'active' : ''}`}
            onClick={() => setFilter('MISSING')}
          >
            Sin Exhibición
          </button>
          
          <div style={{ flex: 1 }}></div>
          
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar producto o SKU..." 
              className="search-input"
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Cargando datos de Odoo...
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Stock Total</th>
                  <th>Stock en Vitrina</th>
                  <th>Estado de Exhibición</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {product.sku}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Package size={18} color="var(--primary)" />
                        {product.name}
                      </div>
                    </td>
                    <td>{product.stock_total}</td>
                    <td>{product.stock_vitrina}</td>
                    <td>
                      {product.exhibited ? (
                        <span className="status-badge status-exhibited">
                          <CheckCircle2 size={14} />
                          Exhibido
                        </span>
                      ) : (
                        <span className="status-badge status-missing">
                          <AlertCircle size={14} />
                          Falta Exhibición
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No se encontraron productos con estos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
