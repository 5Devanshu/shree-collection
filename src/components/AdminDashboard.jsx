import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

const AdminDashboard = () => {
  const { products, categories } = useStore();

  const inStock       = products.filter(p => p.stock > 0).length;
  const featured      = products.filter(p => p.featured).length;
  const inventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  return (
    <div className="admin-content">
      <div className="stat-cards">
        <div className="stat-card">
          <h3 className="label-md">Total Products</h3>
          <p className="display-lg">{products.length}</p>
        </div>
        <div className="stat-card">
          <h3 className="label-md">Categories</h3>
          <p className="display-lg">{categories.length}</p>
        </div>
        <div className="stat-card">
          <h3 className="label-md">In Stock</h3>
          <p className="display-lg">{inStock}</p>
        </div>
        <div className="stat-card">
          <h3 className="label-md">Inventory Value</h3>
          <p className="display-lg" style={{ fontSize: '1.8rem' }}>₹{inventoryValue.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-6)' }}>
        <div className="recent-activity">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--spacing-6)' }}>
            <h2 className="headline-md">Categories</h2>
            <Link to="/admin/categories" className="btn btn-tertiary" style={{ fontSize: '0.8rem' }}>Manage →</Link>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th className="label-md">Name</th>
                <th className="label-md">URL Slug</th>
              </tr>
            </thead>
            <tbody>
              {categories.slice(0, 6).map(c => (
                <tr key={c._id}>
                  <td className="body-lg">{c.name}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--primary)', fontFamily: 'monospace' }}>/collections/{c.slug}</td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={2} style={{ color: 'var(--on-surface-variant)', padding: 'var(--spacing-6)' }}>No categories yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="recent-activity">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--spacing-6)' }}>
            <h2 className="headline-md">Recent Products</h2>
            <Link to="/admin/products" className="btn btn-tertiary" style={{ fontSize: '0.8rem' }}>Manage →</Link>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th className="label-md">Name</th>
                <th className="label-md">Price</th>
                <th className="label-md">Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(-5).reverse().map(p => (
                <tr key={p._id}>
                  <td className="body-lg" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</td>
                  <td className="body-lg">₹{Number(p.price).toLocaleString()}</td>
                  <td>
                    {p.stock > 5
                      ? <span className="status-badge status-delivered">In Stock</span>
                      : p.stock > 0
                        ? <span className="status-badge status-shipped">Low</span>
                        : <span className="status-badge status-pending">Out</span>
                    }
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={3} style={{ color: 'var(--on-surface-variant)', padding: 'var(--spacing-6)' }}>No products yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="recent-activity">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--spacing-6)' }}>
          <h2 className="headline-md">Featured on Homepage ({featured})</h2>
          <Link to="/admin/products" className="btn btn-tertiary" style={{ fontSize: '0.8rem' }}>Edit →</Link>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-6)', flexWrap: 'wrap' }}>
          {products.filter(p => p.featured).map(p => (
            <div key={p._id} style={{
              display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center',
              padding: 'var(--spacing-4)', border: '1px solid var(--outline-variant)',
              background: 'var(--surface-container-low)', minWidth: 200,
            }}>
              <div style={{ width: 40, height: 40, background: 'var(--surface-container-high)', overflow: 'hidden', flexShrink: 0 }}>
                {p.image && <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{p.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>₹{Number(p.price).toLocaleString()}</div>
              </div>
            </div>
          ))}
          {featured === 0 && (
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>
              No featured products — mark products as "Featured" in the Products panel.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;