import React from 'react';

const AdminProducts = () => {
  return (
    <div className="admin-content">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-6)' }}>
        <h2 className="headline-md">Products List</h2>
        <button className="btn btn-primary" style={{ padding: 'var(--spacing-3) var(--spacing-6)', borderRadius: '4px' }}>+ Add Product</button>
      </div>

      <div className="recent-activity">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="label-md">Product Image</th>
              <th className="label-md">Product Name</th>
              <th className="label-md">Category</th>
              <th className="label-md">Price</th>
              <th className="label-md">Stock</th>
              <th className="label-md">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><div style={{width:'40px', height:'40px', backgroundColor:'var(--surface-container-high)'}}></div></td>
              <td className="body-lg">Lumina Diamond Solitaire</td>
              <td className="body-lg">Rings</td>
              <td className="body-lg">$4,200</td>
              <td><span className="status-badge status-delivered">In Stock</span></td>
              <td><button className="btn btn-tertiary">Edit</button></td>
            </tr>
            <tr>
              <td><div style={{width:'40px', height:'40px', backgroundColor:'var(--surface-container-high)'}}></div></td>
              <td className="body-lg">Eclipse Pearl Drop</td>
              <td className="body-lg">Earrings</td>
              <td className="body-lg">$8,500</td>
              <td><span className="status-badge status-shipped">Low Stock</span></td>
              <td><button className="btn btn-tertiary">Edit</button></td>
            </tr>
            <tr>
              <td><div style={{width:'40px', height:'40px', backgroundColor:'var(--surface-container-high)'}}></div></td>
              <td className="body-lg">Solstice Emerald Cuff</td>
              <td className="body-lg">Bracelets</td>
              <td className="body-lg">$12,000</td>
              <td><span className="status-badge status-pending">Out of Stock</span></td>
              <td><button className="btn btn-tertiary">Edit</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;
