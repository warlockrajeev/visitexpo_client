/**
 * @file server.js
 * @description Production HTTP server entry point for Next.js on cPanel / LiteSpeed / Phusion Passenger (MilesWeb).
 * cPanel's "Setup Node.js App" uses this file to launch the Next.js production server.
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV === 'development';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.once('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> VisitExpo Client Dashboard ready on http://${hostname}:${port}`);
    console.log(`> Target Domain: https://client.visitexpo.in`);
    console.log(`> Mode: ${dev ? 'development' : 'production'}`);
  });
}).catch((err) => {
  console.error('Failed to prepare Next.js application:', err);
  process.exit(1);
});
