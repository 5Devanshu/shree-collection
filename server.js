import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ SPA Routing Fix: Middleware to handle client-side routes
// This middleware intercepts requests and checks if they're actual files
// If not, it serves index.html so React Router can handle the route

// 1. Serve actual static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, 'dist'), {
  // maxAge helps with caching
  maxAge: '1d',
  etag: false
}));

// 2. SPA Fallback: Any request that's not a static file gets index.html
// This allows React Router to handle client-side routing
app.use((req, res, next) => {
  // If the file was found in static, express already sent it
  // This middleware only runs if no static file was found
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Serving from: ${path.join(__dirname, 'dist')}`);
});
