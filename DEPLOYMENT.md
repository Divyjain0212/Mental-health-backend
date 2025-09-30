# Mental Health App - Backend Deployment Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or MongoDB instance)
- GitHub account
- Vercel account (connected to GitHub)
- Google AI API key (for Gemini)

## Local Development Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Variables**
Create `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mentalhealth
JWT_SECRET=your_secure_jwt_secret_here
GEMINI_API_KEY=your_google_ai_api_key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

3. **Development Server**
```bash
npm run dev
```

## MongoDB Setup

### Using MongoDB Atlas (Recommended)

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free account

2. **Create Cluster**
   - Create a new cluster (free tier available)
   - Choose a region close to your users

3. **Database Access**
   - Create a database user with read/write permissions
   - Note down username and password

4. **Network Access**
   - Add your IP address to whitelist
   - For production, add `0.0.0.0/0` (or specific IPs)

5. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

## GitHub Repository Setup

1. **Create New Repository**
   - Go to GitHub and create a new repository named `mental-health-backend`
   - Initialize without README (since you have existing code)

2. **Push Code to GitHub**
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Mental Health Backend API"

# Add remote origin
git remote add origin https://github.com/YOUR_USERNAME/mental-health-backend.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Vercel Deployment

### Method 1: Via Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your `mental-health-backend` repository

2. **Configure Build Settings**
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `npm install` (or leave empty)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

3. **Environment Variables**
   In Vercel project settings, add all production environment variables:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mentalhealth
   JWT_SECRET=your_super_secure_jwt_secret_for_production
   GEMINI_API_KEY=your_google_ai_api_key
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-deployment.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

### Method 2: Via Vercel CLI

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel --prod
```

## API Endpoints

Once deployed, your API will be available at:
- `https://your-backend-deployment.vercel.app/`
- `https://your-backend-deployment.vercel.app/api/auth/login`
- `https://your-backend-deployment.vercel.app/api/counsellors`
- etc.

## Security Configuration

### JWT Secret
Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### CORS Configuration
The backend is pre-configured with CORS settings that allow:
- Local development URLs (localhost:3000, localhost:5173)
- Your frontend deployment URL
- Configurable via `FRONTEND_URL` environment variable

## Database Seeding

To populate your database with initial data:

1. **Local Seeding**
```bash
npm run data:import
```

2. **Production Seeding**
You may need to run seeding scripts manually or create a separate seeding endpoint.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for JWT token signing | `64-character-hex-string` |
| `GEMINI_API_KEY` | Google AI API key | `your-api-key` |
| `NODE_ENV` | Environment mode | `production` |
| `FRONTEND_URL` | Frontend deployment URL | `https://yourapp.vercel.app` |
| `PORT` | Server port (auto-set by Vercel) | `5000` |

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Core Endpoints
- `GET /api/counsellors` - Get all counsellors
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/me` - Get user appointments
- `POST /api/chat` - AI chat interaction
- `POST /api/moods` - Log mood
- `GET /api/moods/stats` - Get mood statistics

## Monitoring and Debugging

### Vercel Dashboard
- Check function logs in Vercel Dashboard
- Monitor API response times
- View error logs and stack traces

### Database Monitoring
- Use MongoDB Atlas monitoring
- Check connection status
- Monitor query performance

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify MongoDB URI is correct
   - Check network access settings in MongoDB Atlas
   - Ensure database user has proper permissions

2. **CORS Errors**
   - Verify FRONTEND_URL environment variable
   - Check allowedOrigins array in api/index.js
   - Ensure frontend domain is included

3. **JWT Issues**
   - Verify JWT_SECRET is set in production
   - Check token expiration settings
   - Ensure consistent secret across deployments

4. **API Function Timeouts**
   - Vercel functions have 10-second timeout on Hobby plan
   - Optimize database queries
   - Consider upgrading to Pro plan for longer timeouts

### Production Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] All environment variables set in Vercel
- [ ] JWT secret is secure and unique
- [ ] CORS settings include frontend domain
- [ ] Database seeded with initial data
- [ ] API endpoints tested and working
- [ ] Error handling implemented
- [ ] Logging configured for monitoring

## Scaling Considerations

### Performance
- MongoDB Atlas provides auto-scaling
- Vercel automatically scales serverless functions
- Consider implementing caching for frequently accessed data

### Security
- Use MongoDB Atlas IP whitelisting
- Implement rate limiting
- Regular security audits
- Keep dependencies updated

## Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Navigate to "Settings" → "Domains"
3. Add your custom API domain
4. Update CORS settings with new domain