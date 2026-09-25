import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import callRoutes from './routes/callRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import savedSearchRoutes from './routes/savedSearchRoutes.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { initSocket } from './socket/socketHandler.js';
import { ensureUploadsDir } from './utils/uploadToCloudinary.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsPath = path.resolve(__dirname, './uploads');

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = (process.env.CLIENT_URL || '')
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);
      if (!origin || allowed.includes(origin) || allowed.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

ensureUploadsDir();
app.use('/uploads', express.static(uploadsPath, { maxAge: '30d' }));

app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Room Rental API is running' });
});

app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const base = (process.env.CLIENT_URL || '').split(',').map((u) => u.trim()).filter(Boolean)[0] || `${req.protocol}://${req.get('host')}`;
    const staticPaths = ['/', '/rooms', '/login', '/register'];
    let roomsXml = '';
    if (mongoose.connection.readyState === 1) {
      const { default: Room } = await import('./models/Room.js');
      const rooms = await Room.find({ isAvailable: true })
        .sort({ updatedAt: -1 })
        .limit(500)
        .select('updatedAt')
        .lean();
      roomsXml = rooms
        .map(
          (room) =>
            `  <url><loc>${base}/rooms/${room._id}</loc><lastmod>${room.updatedAt.toISOString().slice(0, 10)}</lastmod></url>`
        )
        .join('\n');
    }
    const today = new Date().toISOString().slice(0, 10);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPaths.map((p) => `  <url><loc>${base}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
${roomsXml}
</urlset>`;
    res.header('Content-Type', 'application/xml').send(xml);
  } catch (error) {
    next(error);
  }
});

app.get('/robots.txt', (req, res) => {
  const base = (process.env.CLIENT_URL || '').split(',').map((u) => u.trim()).filter(Boolean)[0] || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`);
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/saved-searches', savedSearchRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

connectDB().then(() => {
  const httpServer = http.createServer(app);
  const io = initSocket(httpServer, allowedOrigins);
  app.set('io', io);

  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});
