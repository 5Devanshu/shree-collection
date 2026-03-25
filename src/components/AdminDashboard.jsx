import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="admin-content">
      <div className="stat-cards">
        <div className="stat-card">
          <h3 className="label-md">Total Revenue</h3>
          <p className="display-lg">$124,500</p>
        </div>
        <div className="stat-card">
          <h3 className="label-md">Total Orders</h3>
          <p className="display-lg">248</p>
        </div>
        <div className="stat-card">
          <h3 className="label-md">Products In Stock</h3>
          <p className="display-lg">1,024</p>
        </div>
        <div className="stat-card">
          <h3 className="label-md">Active Categories</h3>
          <p className="display-lg">12</p>
        </div>
      </div>

      <div className="recent-activity">
        <h2 className="headline-md">Recent Orders Overview</h2>
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
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
