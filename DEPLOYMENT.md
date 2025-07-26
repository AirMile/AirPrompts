# 🚀 AirPrompts Deployment Guide

This guide covers deploying AirPrompts to various hosting platforms and production configurations.

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] Run linting: `npm run lint`
- [ ] Fix any ESLint errors or warnings
- [ ] Remove all `console.log` statements
- [ ] Remove development-only code and features
- [ ] Ensure all TODO comments are resolved

### Security
- [ ] Environment variables are properly configured
- [ ] No sensitive data in source code
- [ ] API keys are stored securely
- [ ] CORS settings are production-ready
- [ ] Content Security Policy headers configured

### Performance
- [ ] Run production build: `npm run build`
- [ ] Check bundle size: `npm run build -- --analyze`
- [ ] Verify lazy loading is working
- [ ] Test with Chrome Lighthouse
- [ ] Optimize images and assets

### Testing
- [ ] All features work in production build
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Verify offline functionality
- [ ] Check error handling

## 🔧 Build Configuration

### Environment Variables

Create a `.env.production` file:

```env
# Production API URL (if applicable)
VITE_API_URL=https://api.yourdomain.com

# Analytics (optional)
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X
VITE_ENABLE_ANALYTICS=true

# Feature Flags
VITE_ENABLE_EXPORT=true
VITE_ENABLE_IMPORT=true
VITE_ENABLE_SHARING=false

# Storage Configuration
VITE_STORAGE_PREFIX=airprompts_prod_
VITE_MAX_STORAGE_SIZE=10485760

# Sentry Error Tracking (optional)
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Build Commands

```bash
# Standard production build
npm run build

# Build with source maps (for debugging)
npm run build -- --sourcemap

# Build with bundle analysis
npm run build -- --analyze

# Build for specific environment
NODE_ENV=production npm run build
```

## 🌐 Deployment Platforms

### Vercel

#### Automatic Deployment

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   ```

2. **Configure Project**
   ```bash
   # Initialize Vercel project
   vercel
   
   # Follow prompts:
   # - Set up and deploy
   # - Link to existing project (if applicable)
   # - Configure build settings
   ```

3. **Environment Variables**
   - Go to Vercel Dashboard > Project Settings > Environment Variables
   - Add all production environment variables
   - Redeploy to apply changes

4. **Custom Domain**
   ```bash
   # Add custom domain
   vercel domains add yourdomain.com
   ```

#### vercel.json Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Netlify

#### Deploy via UI

1. **Connect GitHub Repository**
   - Login to Netlify
   - Click "New site from Git"
   - Choose your repository

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables: Add in settings

3. **Deploy**
   - Automatic deploys on push to main branch
   - Preview deploys for pull requests

#### netlify.toml Configuration

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "16"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Cache control for assets
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### AWS S3 + CloudFront

#### S3 Setup

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://airprompts-production
   ```

2. **Configure for Static Hosting**
   ```bash
   aws s3 website s3://airprompts-production \
     --index-document index.html \
     --error-document index.html
   ```

3. **Upload Build**
   ```bash
   # Build project
   npm run build
   
   # Sync to S3
   aws s3 sync dist/ s3://airprompts-production \
     --delete \
     --cache-control "public, max-age=31536000" \
     --exclude "index.html" \
     --exclude "*.json"
   
   # Upload index.html with no-cache
   aws s3 cp dist/index.html s3://airprompts-production \
     --cache-control "no-cache, no-store, must-revalidate"
   ```

#### CloudFront Configuration

```json
{
  "Origins": [{
    "DomainName": "airprompts-production.s3.amazonaws.com",
    "S3OriginConfig": {
      "OriginAccessIdentity": ""
    }
  }],
  "DefaultRootObject": "index.html",
  "CustomErrorResponses": [{
    "ErrorCode": 404,
    "ResponseCode": 200,
    "ResponsePagePath": "/index.html",
    "ErrorCachingMinTTL": 300
  }],
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-airprompts-production",
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": { "Forward": "none" }
    }
  }
}
```

### Docker Deployment

#### Dockerfile

```dockerfile
# Build stage
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/json;

    # Cache static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Docker Commands

```bash
# Build Docker image
docker build -t airprompts:latest .

# Run locally
docker run -p 8080:80 airprompts:latest

# Push to registry
docker tag airprompts:latest yourdockerhub/airprompts:latest
docker push yourdockerhub/airprompts:latest
```

## 🔒 Security Configuration

### Content Security Policy

Add to your index.html:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.yourdomain.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
```

### HTTPS Configuration

Always use HTTPS in production:

1. **SSL Certificate**
   - Use Let's Encrypt for free certificates
   - Or use your hosting provider's SSL

2. **Force HTTPS**
   - Configure in your hosting platform
   - Add redirect rules

3. **HSTS Header**
   ```
   Strict-Transport-Security: max-age=31536000; includeSubDomains
   ```

## 📊 Monitoring

### Performance Monitoring

1. **Google Analytics**
   ```javascript
   // Add to index.html
   if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
     // GA script
   }
   ```

2. **Web Vitals**
   ```bash
   npm install web-vitals
   ```

3. **Sentry Error Tracking**
   ```javascript
   import * as Sentry from "@sentry/react";
   
   if (import.meta.env.PROD) {
     Sentry.init({
       dsn: import.meta.env.VITE_SENTRY_DSN,
       environment: "production",
     });
   }
   ```

### Health Checks

Create a health check endpoint:

```javascript
// public/health.json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
      env:
        VITE_API_URL: ${{ secrets.VITE_API_URL }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 🚨 Rollback Strategy

### Quick Rollback

1. **Vercel**
   ```bash
   # List deployments
   vercel ls
   
   # Rollback to previous
   vercel rollback [deployment-url]
   ```

2. **Netlify**
   - Go to Deploys tab
   - Click "Publish deploy" on previous version

3. **Docker**
   ```bash
   # Use previous tag
   docker pull yourdockerhub/airprompts:previous
   docker tag yourdockerhub/airprompts:previous yourdockerhub/airprompts:latest
   ```

### Feature Flags

Use feature flags for gradual rollout:

```javascript
const features = {
  newFeature: import.meta.env.VITE_ENABLE_NEW_FEATURE === 'true',
};

if (features.newFeature) {
  // New feature code
}
```

## 📱 Post-Deployment

### Verification Steps

1. **Functionality Testing**
   - [ ] All pages load correctly
   - [ ] Forms submit properly
   - [ ] Data persists correctly
   - [ ] Search works as expected

2. **Performance Testing**
   - [ ] Run Lighthouse audit
   - [ ] Check load times
   - [ ] Verify lazy loading
   - [ ] Test on slow connections

3. **Monitoring Setup**
   - [ ] Error tracking active
   - [ ] Analytics working
   - [ ] Uptime monitoring configured
   - [ ] Alerts configured

### Maintenance

1. **Regular Updates**
   ```bash
   # Check for updates
   npm outdated
   
   # Update dependencies
   npm update
   ```

2. **Backup Strategy**
   - Regular user data exports
   - Database backups (if applicable)
   - Configuration backups

3. **Security Updates**
   - Monitor npm audit
   - Apply security patches promptly
   - Regular security reviews

---

**Remember**: Always test in a staging environment before deploying to production!