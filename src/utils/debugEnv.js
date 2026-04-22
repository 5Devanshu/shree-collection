// Debug utility for checking frontend environment and API connectivity
// Add this to src/utils/debugEnv.js

export const checkEnvironment = () => {
  const checks = {
    apiUrl: import.meta.env.VITE_API_URL,
    adminToken: !!localStorage.getItem('shree_admin_token'),
    customerToken: !!localStorage.getItem('shree_customer_token'),
    adminTokenValue: localStorage.getItem('shree_admin_token')?.substring(0, 20) + '...',
    customerTokenValue: localStorage.getItem('shree_customer_token')?.substring(0, 20) + '...',
    currentPage: window.location.href,
    isAdminPage: window.location.href.includes('/admin'),
  };

  console.table(checks);
  return checks;
};

// Test API connectivity
export const testApiConnectivity = async () => {
  console.log('\n🧪 Testing API Connectivity...\n');

  const endpoints = [
    { method: 'GET', url: '/categories', auth: false, name: 'Get Categories' },
    { method: 'GET', url: '/products?limit=1', auth: false, name: 'Get Products' },
  ];

  const adminToken = localStorage.getItem('shree_admin_token');
  if (adminToken) {
    endpoints.push(
      { method: 'GET', url: '/media', auth: true, name: 'Get Media (Admin)' },
    );
  }

  const baseUrl = import.meta.env.VITE_API_URL;

  for (const endpoint of endpoints) {
    try {
      const headers = {};
      if (endpoint.auth && adminToken) {
        headers.Authorization = `Bearer ${adminToken}`;
      }

      console.log(`📍 Testing: ${endpoint.name} (${endpoint.method} ${endpoint.url})`);

      const response = await fetch(baseUrl + endpoint.url, {
        method: endpoint.method,
        headers,
      });

      console.log(`   ✅ Status: ${response.status}`);
      
      const data = await response.json();
      console.log(`   📦 Response:`, {
        success: data.success,
        keys: Object.keys(data).filter(k => k !== 'success'),
        itemCount: Array.isArray(data.data) ? data.data.length : Array.isArray(data.categories) ? data.categories.length : 'N/A',
      });
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
};

// Export both for console access
window.debugShreeCollection = {
  checkEnvironment,
  testApiConnectivity,
};

console.log('🔧 Debug utilities available. Run in console:');
console.log('  - debugShreeCollection.checkEnvironment()');
console.log('  - debugShreeCollection.testApiConnectivity()');
