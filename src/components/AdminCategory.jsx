import React from 'react';

const AdminCategory = () => {
  return (
    <div className="admin-content">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-6)' }}>
        <h2 className="headline-md">Categories List</h2>
        <button className="btn btn-primary" style={{ padding: 'var(--spacing-3) var(--spacing-6)', borderRadius: '4px' }}>+ Add Category</button>
      </div>

      <div className="recent-activity">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="label-md">Category Name</th>
              <th className="label-md">Slug</th>
              <th className="label-md">Products Count</th>
              <th className="label-md">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="body-lg">Rings</td>
              <td className="body-lg">/rings</td>
              <td className="body-lg">342</td>
              <td><button className="btn btn-tertiary">Edit</button></td>
            </tr>
            <tr>
              <td className="body-lg">Earrings</td>
              <td className="body-lg">/earrings</td>
              <td className="body-lg">156</td>
              <td><button className="btn btn-tertiary">Edit</button></td>
            </tr>
            <tr>
              <td className="body-lg">Necklaces</td>
              <td className="body-lg">/necklaces</td>
              <td className="body-lg">289</td>
              <td><button className="btn btn-tertiary">Edit</button></td>
            </tr>
            <tr>
              <td className="body-lg">Bracelets</td>
              <td className="body-lg">/bracelets</td>
              <td className="body-lg">94</td>
              <td><button className="btn btn-tertiary">Edit</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCategory;
