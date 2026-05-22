# Deployment Guide

This document provides instructions for deploying the Food Ordering Backend to production.

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Create `.env` file with production values
- [ ] Set `NODE_ENV=production`
- [ ] Generate a secure `JWT_SECRET` (minimum 32 characters)
- [ ] Configure `POCKETBASE_URL` pointing to your PocketBase instance
- [ ] Set `CLIENT_URLS` to your frontend domain
- [ ] Configure Cloudinary credentials
- [ ] Set appropriate rate limit values

### 2. Security
- [ ] JWT_SECRET is not committed to version control
- [ ] All environment variables are secured
- [ ] HTTPS is enabled on deployment platform
- [ ] CORS is restricted to known domains
- [ ] Rate limiting is configured appropriately

### 3. Database
- [ ] PocketBase instance is running and accessible
- [ ] Database schema is up to date (run `npm run pb:schema:check`)
- [ ] Backup strategy is in place
- [ ] Database credentials are secure

### 4. Dependencies
- [ ] All dependencies are installed (`npm install`)
- [ ] No development dependencies in production
- [ ] Security vulnerabilities are resolved

### 5. Testing
- [ ] All tests pass (`npm test`)
- [ ] Environment validation passes (`npm run pb:check`)
- [ ] API endpoints are manually tested

## Deployment Platforms

### Render

1. **Connect Repository**
   - Add your GitHub repository to Render
   - Select Node.js as the environment

2. **Configure Environment**
   - Add all variables from `.env` in Render dashboard
   - Set `NODE_ENV=production`

3. **Build & Deploy**
   - Render will automatically run `npm install`
   - Build command: (leave empty, not needed)
   - Start command: `npm run start:prod`

4. **Verify Deployment**
   - Check logs in Render dashboard
   - Test health endpoint: `GET /health`

### Railway

1. **Connect Repository**
   - Import project from GitHub
   - Select Node.js template

2. **Configure Environment**
   - Add all environment variables in Railway dashboard
   - Ensure `NODE_ENV=production`

3. **Deploy**
   - Railway automatically detects Node.js from `package.json`
   - Start command: `npm run start:prod`

4. **Verify**
   - Check deployment logs
   - Test health endpoint

### Vercel Backend

1. **Create API Routes**
   - Vercel supports serverless Node.js functions
   - Configure `vercel.json` for routing

2. **Environment Variables**
   - Add all `.env` variables in Vercel dashboard
   - Set `NODE_ENV=production`

3. **Deploy**
   - Connect GitHub repository
   - Vercel automatically deploys on push

4. **Note**
   - Socket.io requires special configuration on serverless
   - Consider using Render or Railway for WebSocket support

### VPS Deployment (Manual)

1. **SSH to Server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd Food-Ordering-platform/backend
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install Dependencies**
   ```bash
   npm install --production
   ```

5. **Setup Environment**
   ```bash
   cp .env.example .env
   nano .env  # Edit with production values
   ```

6. **Setup Process Manager (PM2)**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "food-backend"
   pm2 startup
   pm2 save
   ```

7. **Setup Reverse Proxy (Nginx)**
   ```bash
   sudo apt-get install -y nginx
   sudo nano /etc/nginx/sites-available/default
   ```

   Add configuration:
   ```nginx
   upstream food_backend {
     server 127.0.0.1:5000;
   }

   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://food_backend;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

8. **Enable HTTPS (Let's Encrypt)**
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

9. **Restart Services**
   ```bash
   sudo systemctl restart nginx
   pm2 restart all
   ```

## Environment Variables Template

```env
# Server
NODE_ENV=production
PORT=5000

# Client
CLIENT_URL=https://your-frontend-domain.com
CLIENT_URLS=https://your-frontend-domain.com

# JWT
JWT_SECRET=your-very-secure-random-secret-min-32-chars
JWT_EXPIRES_IN=7d

# Bcrypt
BCRYPT_SALT_ROUNDS=12

# PocketBase
POCKETBASE_URL=https://your-pocketbase-instance.com
POCKETBASE_CHECK_ON_STARTUP=true
POCKETBASE_SUPERUSER_EMAIL=admin@example.com
POCKETBASE_SUPERUSER_PASSWORD=your-secure-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
AUTH_RATE_LIMIT_MAX=20
ADMIN_RATE_LIMIT_MAX=50
ORDER_RATE_LIMIT_MAX=120

# Request
REQUEST_BODY_LIMIT=1mb
```

## Health Checks

Test your deployment with:

```bash
# Health check
curl https://your-api-domain.com/health

# Expected response:
{
  "success": true,
  "status": "OK"
}
```

## Monitoring

### Logs
- Check deployment platform logs regularly
- Monitor error rates and response times
- Set up alerts for critical errors

### Performance
- Monitor database query performance
- Track API response times
- Monitor server resource usage (CPU, memory)

### Security
- Monitor rate limit hits
- Review failed authentication attempts
- Check for suspicious API activity

## Scaling Considerations

### Database
- Use PocketBase clustering for high availability
- Implement caching layer if needed
- Monitor database performance

### API Server
- Use load balancer for multiple server instances
- Configure session affinity for Socket.io
- Implement health checks for load balancer

### Socket.io
- Configure sticky sessions for WebSocket connections
- Consider Redis adapter for multiple server instances
- Monitor connection count and memory usage

## Troubleshooting

### Server Won't Start
- Check environment variables are set
- Verify PocketBase is running and accessible
- Check for port conflicts
- Review logs for specific errors

### Database Connection Failed
- Verify POCKETBASE_URL is correct
- Check PocketBase is running
- Verify database credentials
- Check network connectivity

### Rate Limiting Issues
- Adjust rate limit values in `.env`
- Verify rate limiter is working correctly
- Check client is respecting 429 responses

### Socket.io Not Working
- Verify WebSocket support is enabled
- Check CORS configuration
- Verify client is using correct URL
- Check for firewall blocks

## Rollback

### To Rollback Deployment
1. Revert to previous git commit
2. Redeploy using your platform's deployment tool
3. Or restore from backup if database issues

## Support

For issues:
1. Check deployment logs
2. Review error messages in health endpoint
3. Verify environment configuration
4. Check database connectivity
5. Review application logs

## Additional Resources

- [Node.js Production Checklist](https://nodejs.org/en/docs/guides/nodejs-web-app-getting-started/)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [PocketBase Documentation](https://pocketbase.io/)
- [Socket.io Deployment Guide](https://socket.io/docs/v4/deployment/)
