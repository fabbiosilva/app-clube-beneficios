import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDoc } from 'firebase/firestore';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Firebase for server use (without offline cache)
  let db: any = null;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const firebaseApp = initializeApp(firebaseConfig, 'server-app');
      db = initializeFirestore(firebaseApp, {}, firebaseConfig.firestoreDatabaseId);
      console.log('Firebase initialized successfully on Express server');
    }
  } catch (err) {
    console.error('Failed to initialize Firebase on server:', err);
  }

  // In-memory cache for the logo buffer to make requests lightning fast
  let cachedLogoBuffer: Buffer | null = null;
  let cachedLogoETag: string = "";

  async function getLogoBuffer(): Promise<Buffer | null> {
    if (cachedLogoBuffer) {
      return cachedLogoBuffer;
    }

    // Try reading from Firestore first
    if (db) {
      try {
        const docRef = doc(db, 'config', 'logo');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.logoBase64) {
            let base64Str = data.logoBase64;
            if (base64Str.startsWith('data:')) {
              // strip data:image/png;base64,
              const commaIdx = base64Str.indexOf(',');
              if (commaIdx !== -1) {
                base64Str = base64Str.substring(commaIdx + 1);
              }
            }
            const buffer = Buffer.from(base64Str, 'base64');
            // Verify signature is valid PNG
            if (buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
              cachedLogoBuffer = buffer;
              cachedLogoETag = `W/"${buffer.length}-${Date.now()}"`;
              console.log(`Successfully fetched and cached logo from Firestore (${buffer.length} bytes)`);
              
              // Also write to files to ensure consistency across build/disk
              try {
                fs.writeFileSync(path.join(process.cwd(), 'public/logo-share.png'), buffer);
                const distLogoPath = path.join(process.cwd(), 'dist/logo-share.png');
                if (fs.existsSync(path.dirname(distLogoPath))) {
                  fs.writeFileSync(distLogoPath, buffer);
                }
              } catch (writeErr) {
                console.error('Failed to write Firestore logo to disk:', writeErr);
              }
              
              return buffer;
            }
          }
        }
      } catch (err) {
        console.error('Error getting logo from Firestore:', err);
      }
    }

    // Fallback: Try reading from public/logo-share.png
    try {
      const publicPath = path.join(process.cwd(), 'public/logo-share.png');
      if (fs.existsSync(publicPath)) {
        const buffer = fs.readFileSync(publicPath);
        if (buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
          cachedLogoBuffer = buffer;
          cachedLogoETag = `W/"${buffer.length}-fallback"`;
          return buffer;
        }
      }
    } catch (e) {
      console.error('Error reading fallback logo-share.png:', e);
    }

    return null;
  }

  // Intercept logo requests to serve the correct and non-corrupted database logo
  app.get(['/logo-share.png', '/logo-preview.png'], async (req, res, next) => {
    try {
      const buffer = await getLogoBuffer();
      if (buffer) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        if (cachedLogoETag) {
          res.setHeader('ETag', cachedLogoETag);
        }
        res.send(buffer);
        return;
      }
    } catch (err) {
      console.error('Error serving dynamic logo:', err);
    }
    next();
  });




  // Blog Image SSR Cache
  const cachedBlogImages = new Map<string, { buffer: Buffer, contentType: string, etag: string }>();

  app.get('/api/blog-image/:id', async (req, res) => {
    try {
      const postId = req.params.id;
      
      if (cachedBlogImages.has(postId)) {
        const cached = cachedBlogImages.get(postId)!;
        res.setHeader('Content-Type', cached.contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('ETag', cached.etag);
        res.send(cached.buffer);
        return;
      }
      
      if (db) {
        const docRef = doc(db, 'blog_posts', postId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.image) {
            let base64Str = data.image;
            let contentType = 'image/jpeg';
            
            if (base64Str.startsWith('data:')) {
              const commaIdx = base64Str.indexOf(',');
              if (commaIdx !== -1) {
                const header = base64Str.substring(0, commaIdx);
                const match = header.match(/data:([^;]+)/);
                if (match && match[1]) {
                  contentType = match[1];
                }
                base64Str = base64Str.substring(commaIdx + 1);
              }
            }
            
            const buffer = Buffer.from(base64Str, 'base64');
            const etag = `W/"${buffer.length}-${Date.now()}"`;
            
            cachedBlogImages.set(postId, { buffer, contentType, etag });
            
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('ETag', etag);
            res.send(buffer);
            return;
          }
        }
      }
      
      res.status(404).send('Image not found');
    } catch (err) {
      console.error('Error serving blog image:', err);
      res.status(500).send('Internal Server Error');
    }
  });

  async function injectMetaTags(html: string, reqPath: string, host: string, protocol: string): Promise<string> {
    console.log('injectMetaTags called for:', reqPath);
    if (reqPath.startsWith('/blog/') && reqPath.length > 6 && db) {
      const postId = reqPath.split('/')[2];
      console.log('Detected blog post ID:', postId);
      try {
        const docRef = doc(db, 'blog_posts', postId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const postData = snap.data();
          console.log('Blog post found:', postData.title);
          const title = postData.title || "FABISA | Blog";
          let coverUrl = "https://i.ibb.co/6YV3Zk7X/FABISA-logo.png";
          
          if (postData.image) {
            if (postData.image.startsWith('http')) {
               coverUrl = postData.image;
            } else {
               coverUrl = `${protocol}://${host}/api/blog-image/${postId}`;
            }
          }
          
          const safeTitle = title.replace(/"/g, '&quot;');
          
          html = html.replace(/<meta property="og:title" content="[^"]+" \/>/g, `<meta property="og:title" content="${safeTitle}" />`);
          html = html.replace(/<meta property="twitter:title" content="[^"]+" \/>/g, `<meta property="twitter:title" content="${safeTitle}" />`);
          
          html = html.replace(/<meta property="og:image" content="[^"]+" \/>/g, `<meta property="og:image" content="${coverUrl}" />`);
          html = html.replace(/<meta property="og:image:secure_url" content="[^"]+" \/>/g, `<meta property="og:image:secure_url" content="${coverUrl}" />`);
          html = html.replace(/<meta name="twitter:image" content="[^"]+" \/>/g, `<meta name="twitter:image" content="${coverUrl}" />`);
        }
      } catch (e) {
        console.error('Error fetching blog post for SSR meta tags:', e);
      }
    }

    const absoluteUrl = `${protocol}://${host}${reqPath}`;
    html = html.replace(/<meta property="og:url" content="[^"]+" \/>/g, `<meta property="og:url" content="${absoluteUrl}" />`);
    
    return html;
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      console.log('Catch-all route hit:', req.originalUrl);
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        const host = req.headers.host || "clubefabisa.online";
        const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
        
        const pathName = req.originalUrl.split('?')[0];
        template = await injectMetaTags(template, pathName, host, protocol);
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', async (req, res) => {
      const indexHtmlPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexHtmlPath)) {
        let html = fs.readFileSync(indexHtmlPath, 'utf8');
        const host = req.headers.host || "clubefabisa.online";
        const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
        
        const pathName = req.originalUrl.split('?')[0];
        html = await injectMetaTags(html, pathName, host, protocol);
        
        res.send(html);
      } else {
        res.sendFile(indexHtmlPath);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
