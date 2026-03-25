import React from 'react';

const AdminOrders = () => {
  return (
    <div className="admin-content">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-6)' }}>
        <h2 className="headline-md">All Orders</h2>
        <button className="btn btn-secondary" style={{ padding: 'var(--spacing-3) var(--spacing-6)', borderRadius: '4px' }}>Export CSV</button>
      </div>

      <div className="recent-activity">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="label-md">Order ID</th>
              <th className="label-md">Customer</th>
              <th className="label-md">Date</th>
              <th className="label-md">Status</th>
              <th className="label-md">Total</th>
              <th className="label-md">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="body-lg">#ORD-001</td>
              <td className="body-lg">Eleanor Vance</td>
              <td className="body-lg">Oct 24, 2025</td>
              <td><span className="status-badge status-pending">Pending</span></td>
              <td className="body-lg">$4,200</td>
              <td><button className="btn btn-tertiary">View</button></td>
            </tr>
            <tr>
              <td className="body-lg">#ORD-002</td>
              <td className="body-lg">Luke Crain</td>
              <td className="body-lg">Oct 23, 2025</td>
              <td><span className="status-badge status-shipped">Shipped</span></td>
              <td className="body-lg">$12,000</td>
              <td><button className="btn btn-tertiary">View</button></td>
            </tr>
            <tr>
              <td className="body-lg">#ORD-003</td>
              <td className="body-lg">Theodora Crain</td>
              <td className="body-lg">Oct 22, 2025</td>
              <td><span className="status-badge status-delivered">Delivered</span></td>
              <td className="body-lg">$8,500</td>
              <td><button className="btn btn-tertiary">View</button></td>
            </tr>
            <tr>
              <td className="body-lg">#ORD-004</td>
              <td className="body-lg">Shirley Jackson</td>
              <td className="body-lg">Oct 21, 2025</td>
              <td><span className="status-badge status-delivered">Delivered</span></td>
              <td className="body-lg">$2,100</td>
              <td><button className="btn btn-tertiary">View</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
