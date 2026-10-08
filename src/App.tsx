import { useEffect, useState, useMemo } from 'react';
import { Package, Search, AlertCircle, CheckCircle2, Store, Download, Users, Flame, ArrowUp, ArrowDown } from 'lucide-react';
import { api, type Product, VENDORS } from './OdooAPI';
import './index.css';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'EXHIBITED' | 'MISSING'>('ALL');
  const [filterBrand, setFilterBrand] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterVendor, setFilterVendor] = useState('ALL');
  const [filterESL, setFilterESL] = useState('ALL');
  const [filterHotZone, setFilterHotZone] = useState('ALL');
  const [hotZoneCriteria, setHotZoneCriteria] = useState<'VALUATION' | 'SALES' | 'PURCHASES'>('VALUATION');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'VALUATION' | 'NONE'>('NONE');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');
  const [ignoredIds, setIgnoredIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('vitrina_ignored_products');
    return saved ? JSON.parse(saved) : [];
  });

  // Save ignored products whenever it changes
  useEffect(() => {
    localStorage.setItem('vitrina_ignored_products', JSON.stringify(ignoredIds));
  }, [ignoredIds]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getVitrinaProducts();
        setProducts(data);
      } catch (err: any) {
        console.error("Failed to fetch products from Odoo:", err);
        setError(err.message || "Error al conectar con Odoo (Verifica CORS en la consola de Chrome)");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Derived lists for dropdowns
  const brands = useMemo(() => Array.from(new Set(products.map(p => p.brand).filter(Boolean))), [products]);
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))), [products]);

  // Process Hot Zones dynamically
  const processedProducts = useMemo(() => {
    if (products.length === 0) return [];
    
    const newProducts = products.map(p => ({...p, is_hot_zone: false}));
    
    // Sort by criteria
    newProducts.sort((a, b) => {
      if (hotZoneCriteria === 'VALUATION') return b.valuation - a.valuation;
      if (hotZoneCriteria === 'SALES') return b.sales_count - a.sales_count;
      if (hotZoneCriteria === 'PURCHASES') return b.purchases_count - a.purchases_count;
      return 0;
    });

    // Mark top 20%
    const hotZoneCount = Math.ceil(newProducts.length * 0.2);
    for (let i = 0; i < hotZoneCount; i++) {
      let val = 0;
      if (hotZoneCriteria === 'VALUATION') val = newProducts[i].valuation;
      if (hotZoneCriteria === 'SALES') val = newProducts[i].sales_count;
      if (hotZoneCriteria === 'PURCHASES') val = newProducts[i].purchases_count;

      if (val > 0) {
        newProducts[i].is_hot_zone = true;
      }
    }

    // Sort back by ID or name to keep table stable, or leave sorted by the criteria?
    // Let's leave sorted by the criteria so hot zones are at the top
    return newProducts;
  }, [products, hotZoneCriteria]);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    const filtered = processedProducts.filter(p => {
      if (ignoredIds.includes(p.id)) return false; // Hide ignored products

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

      if (filterESL === 'WITH_ESL' && !p.esl) return false;
      if (filterESL === 'WITHOUT_ESL' && p.esl) return false;

      if (filterHotZone === 'HOT_ZONE' && !p.is_hot_zone) return false;

      if (p.stock_total <= 0) return false; // Solo mostramos los que tienen stock para gestionar la vitrina

      return true;
    });
    
    if (sortField === 'VALUATION') {
      filtered.sort((a: Product, b: Product) => {
        return sortDirection === 'ASC' ? a.valuation - b.valuation : b.valuation - a.valuation;
      });
    }

    return filtered;
  }, [processedProducts, filterStatus, filterBrand, filterCategory, filterVendor, filterESL, filterHotZone, search, ignoredIds, sortField, sortDirection]);

  const totalProducts = products.length;
  const availableProducts = products.filter(p => p.stock_total > 0);
  const availableCount = availableProducts.length;

  const missingCount = availableProducts.filter(p => !p.exhibited).length;
  const exhibitedCount = availableProducts.filter(p => p.exhibited).length;
  const unassignedMissingCount = availableProducts.filter(p => !p.exhibited && !p.assigned_vendor).length;

  const percentageAvailable = totalProducts > 0 ? Math.round((availableCount / totalProducts) * 100) : 0;
  const percentageExhibited = availableCount > 0 ? Math.round((exhibitedCount / availableCount) * 100) : 0;
  const percentageMissing = availableCount > 0 ? Math.round((missingCount / availableCount) * 100) : 0;

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

    const headers = ["SKU", "Producto", "Marca", "Categoria", "Stock Total", "Stock Vitrina", "Valoracion", "Zona Caliente", "Estado", "Vendedor Asignado"];
    const rows = filteredProducts.map((p: Product) => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`, // Quote to handle commas/semicolons and escape quotes
      p.brand,
      p.category,
      p.stock_total,
      p.stock_vitrina,
      p.valuation.toString().replace('.', ','), // Use comma for decimal for Spanish Excel
      p.is_hot_zone ? "SI" : "NO",
      p.exhibited ? "Exhibido" : "Falta",
      p.assigned_vendor || "Sin Asignar"
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((r: any[]) => r.join(";"))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
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
          {ignoredIds.length > 0 && (
            <button className="button secondary" onClick={() => setIgnoredIds([])} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              Restaurar {ignoredIds.length} Ocultos
            </button>
          )}
        </div>
      </header>

      <div className="stats-grid">
        <div className="card stat-card">
          <span className="stat-label">Total Productos / Existencia</span>
          <span className="stat-value">
            {totalProducts} / {availableCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>({percentageAvailable}%)</span>
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Exhibidos (Disponibles)</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>
            {exhibitedCount} <span style={{ fontSize: '1rem', opacity: 0.8 }}>({percentageExhibited}%)</span>
          </span>
        </div>
        <div className="card stat-card" style={{ borderColor: missingCount > 0 ? 'var(--danger)' : '' }}>
          <span className="stat-label">Faltantes (Disponibles)</span>
          <span className="stat-value" style={{ color: 'var(--danger)' }}>
            {missingCount} <span style={{ fontSize: '1rem', opacity: 0.8 }}>({percentageMissing}%)</span>
          </span>
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

          <select className="select-input" value={filterESL} onChange={e => setFilterESL(e.target.value)}>
            <option value="ALL">Filtro ESL</option>
            <option value="WITH_ESL">Con ESL</option>
            <option value="WITHOUT_ESL">Sin ESL</option>
          </select>

          <select className="select-input" value={filterHotZone} onChange={e => setFilterHotZone(e.target.value)}>
            <option value="ALL">Todas las Zonas</option>
            <option value="HOT_ZONE">Solo Zonas Calientes</option>
          </select>

          <select className="select-input" value={hotZoneCriteria} onChange={e => setHotZoneCriteria(e.target.value as any)} style={{ borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 'bold' }}>
            <option value="VALUATION">Cálculo: Valoración</option>
            <option value="SALES">Cálculo: Ventas</option>
            <option value="PURCHASES">Cálculo: Compras</option>
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

        {error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', margin: '1rem 0' }}>
            <AlertCircle size={32} style={{ marginBottom: '1rem' }} />
            <h3>Ocurrió un error al cargar los datos</h3>
            <p>{error}</p>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Cargando datos de Odoo...
          </div>
        ) : (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Marca / Cat</th>
                  <th>Stock Vitrina</th>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }} 
                    onClick={() => {
                      if (sortField === 'VALUATION') {
                        if (sortDirection === 'DESC') setSortDirection('ASC');
                        else { setSortField('NONE'); setSortDirection('DESC'); }
                      } else {
                        setSortField('VALUATION');
                        setSortDirection('DESC');
                      }
                    }}
                  >
                    Valoración
                    {sortField === 'VALUATION' && (
                      sortDirection === 'ASC' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    )}
                  </th>
                  <th>Zona Caliente</th>
                  <th>ESL</th>
                  <th>Estado</th>
                  <th>Asignado A</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product: Product) => (
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
                    <td style={{ minWidth: '90px' }}>{product.stock_vitrina} / {product.stock_total}</td>
                    <td style={{ minWidth: '120px' }}>
                      ${product.valuation.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center', minWidth: '110px' }}>
                      {product.is_hot_zone ? <span title="Top 20% Zona Caliente"><Flame size={18} color="#ef4444" /></span> : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                    </td>
                    <td>
                      {product.esl ? (
                        <span className="vendor-badge" style={{ background: 'var(--primary)', color: '#fff' }}>{product.esl}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>---</span>
                      )}
                    </td>
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
                    <td>
                      <button 
                        className="button secondary" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => setIgnoredIds(prev => [...prev, product.id])}
                      >
                        Ocultar
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
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
