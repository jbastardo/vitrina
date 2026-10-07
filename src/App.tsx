import { useEffect, useState, useMemo } from 'react';
import { Package, Search, AlertCircle, CheckCircle2, Store, Download, Users } from 'lucide-react';
import { api, type Product, VENDORS } from './OdooAPI';
import './index.css';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'EXHIBITED' | 'MISSING'>('ALL');
  const [filterBrand, setFilterBrand] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterVendor, setFilterVendor] = useState('ALL');
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

  // Derived lists for dropdowns
  const brands = useMemo(() => Array.from(new Set(products.map(p => p.brand).filter(Boolean))), [products]);
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))), [products]);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            p.sku.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      if (filterStatus === 'EXHIBITED' && !p.exhibited) return false;
      if (filterStatus === 'MISSING' && p.exhibited) return false;

      if (filterBrand !== 'ALL' && p.brand !== filterBrand) return false;
      if (filterCategory !== 'ALL' && p.category !== filterCategory) return false;
      
      if (filterVendor === 'UNASSIGNED') {
        if (p.assigned_vendor) return false;
      } else if (filterVendor !== 'ALL' && p.assigned_vendor !== filterVendor) {
        return false;
      }

      return true;
    });
  }, [products, filterStatus, filterBrand, filterCategory, filterVendor, search]);

  const missingCount = products.filter(p => !p.exhibited).length;
  const exhibitedCount = products.filter(p => p.exhibited).length;
  const unassignedMissingCount = products.filter(p => !p.exhibited && !p.assigned_vendor).length;

  const handleAutoAssign = () => {
    setProducts(prev => {
      const newProducts = [...prev];
      // Get all missing products that are NOT assigned yet
      const unassignedMissing = newProducts.filter(p => !p.exhibited && !p.assigned_vendor);
      
      let vendorIndex = 0;
      unassignedMissing.forEach(prod => {
        prod.assigned_vendor = VENDORS[vendorIndex];
        vendorIndex = (vendorIndex + 1) % VENDORS.length;
      });

      return newProducts;
    });
    alert("Productos faltantes asignados equitativamente a los vendedores.");
  };

  const handleExportCSV = () => {
    if (filteredProducts.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const headers = ["SKU", "Producto", "Marca", "Categoria", "Stock Total", "Stock Vitrina", "Estado", "Vendedor Asignado"];
    const rows = filteredProducts.map(p => [
      p.sku,
      `"${p.name}"`, // Quote to handle commas in names
      p.brand,
      p.category,
      p.stock_total,
      p.stock_vitrina,
      p.exhibited ? "Exhibido" : "Falta",
      p.assigned_vendor || "Sin Asignar"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "reporte_vitrina.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">
          <Store size={36} color="#818cf8" />
          Control de Vitrina - Odoo
        </h1>
        <div className="header-actions">
          <button className="button secondary" onClick={() => window.location.reload()}>
            Recargar
          </button>
          <button className="button secondary" onClick={handleExportCSV}>
            <Download size={18} />
            Exportar CSV
          </button>
          <button className="button success" onClick={handleAutoAssign} disabled={unassignedMissingCount === 0} style={{ opacity: unassignedMissingCount === 0 ? 0.5 : 1 }}>
            <Users size={18} />
            Asignar {unassignedMissingCount} Pendientes
          </button>
        </div>
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
        <div className="filters-bar">
          <div className="filter-group">
            <button className={`filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`} onClick={() => setFilterStatus('ALL')}>
              Todos
            </button>
            <button className={`filter-btn ${filterStatus === 'EXHIBITED' ? 'active' : ''}`} onClick={() => setFilterStatus('EXHIBITED')}>
              Exhibidos
            </button>
            <button className={`filter-btn ${filterStatus === 'MISSING' ? 'active' : ''}`} onClick={() => setFilterStatus('MISSING')}>
              Faltantes
            </button>
          </div>

          <select className="select-input" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
            <option value="ALL">Todas las Marcas</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select className="select-input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="ALL">Todas las Categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select className="select-input" value={filterVendor} onChange={e => setFilterVendor(e.target.value)}>
            <option value="ALL">Todos los Vendedores</option>
            <option value="UNASSIGNED">Sin Asignar</option>
            {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          <div style={{ flex: 1 }}></div>
          
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar producto o SKU..." 
              className="search-input"
              style={{ paddingLeft: '2.5rem', width: '100%', minWidth: '250px' }}
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
                  <th>Marca / Cat</th>
                  <th>Stock Vitrina</th>
                  <th>Estado</th>
                  <th>Asignado A</th>
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
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {product.brand} • {product.category}
                    </td>
                    <td>{product.stock_vitrina} / {product.stock_total}</td>
                    <td>
                      {product.exhibited ? (
                        <span className="status-badge status-exhibited">
                          <CheckCircle2 size={14} /> Exhibido
                        </span>
                      ) : (
                        <span className="status-badge status-missing">
                          <AlertCircle size={14} /> Faltante
                        </span>
                      )}
                    </td>
                    <td>
                      {product.assigned_vendor ? (
                        <span className="vendor-badge">{product.assigned_vendor}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>---</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
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
