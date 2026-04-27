// 🔍 URL Construction Debug Script
// Run this in browser console to see what URL is being constructed

console.log('=== VITE_API_URL Debug ===');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Order ID: #ORD-005');

const orderId = '#ORD-005';
const paymentInitUrl = `${import.meta.env.VITE_API_URL}/orders/${orderId}/payment/initiate`;

console.log('Constructed URL:', paymentInitUrl);
console.log('');
console.log('Expected: https://shree-collection-backend-production.up.railway.app/api/orders/#ORD-005/payment/initiate');
console.log('Actual:  ', paymentInitUrl);
console.log('');

if (paymentInitUrl.includes('/api/api/')) {
  console.error('❌ ERROR: URL has /api/api/ - Double /api detected!');
  console.error('This means VITE_API_URL itself contains /api/api/');
} else {
  console.log('✅ URL is correct format');
}
