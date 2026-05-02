# Vercel Deployment Guide

## Quick Start

Your Utsav Decor project is now ready for Vercel deployment with PostgreSQL (NeonDB).

### Step 1: Set Up NeonDB PostgreSQL

1. Visit [Neon](https://neon.tech/) and sign up for a free account
2. Create a new project
3. Create a database (default name is fine)
4. Copy the connection string (should look like: `postgresql://user:password@host/dbname`)

### Step 2: Deploy to Vercel

#### Option A: Using GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment with PostgreSQL"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up or log in with your GitHub account
   - Click "New Project"
   - Select the `trixenora-s/Utsavdecor` repository
   - Click "Import"

3. **Configure Environment Variables**:
   - In the Vercel dashboard, go to Settings → Environment Variables
   - Add the following variables:
     - `DATABASE_URL`: Your NeonDB connection string
     - `RAZORPAY_KEY_ID`: Your Razorpay merchant key
     - `RAZORPAY_KEY_SECRET`: Your Razorpay secret key
     - `CLIENT_ORIGIN`: Your domain (e.g., `https://yourdomain.vercel.app`)

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (~2-5 minutes)

#### Option B: Using Vercel CLI (Local)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts to authenticate and set up your project
   - Select "PostgreSQL" when asked about database
   - Add environment variables when prompted

### Step 3: Initialize the Database

After deployment, run migrations:

```bash
vercel env pull  # Pull environment variables locally
npx prisma db push  # Push schema to production database
```

Or through Vercel CLI in the deployed environment:

```bash
vercel env ls
```

### Step 4: Seed Data (Optional)

To populate initial products:

```bash
# Create a seed migration or run seed script
node backend/src/seed/seedProducts.js
```

Note: You'll need to update the seed script to use Prisma instead of Mongoose.

## Project Structure

```
.
├── api/                    # Serverless API routes (Vercel Functions)
│   ├── health.js
│   ├── products.js
│   ├── bookings.js
│   ├── reviews.js
│   ├── payments/
│   └── admin/
├── lib/                    # Shared utilities
│   ├── db.js              # Prisma client
│   └── models/            # (removed - use Prisma instead)
├── prisma/                # Database schema
│   └── schema.prisma
├── index.html             # Static HTML
├── style.css              # Styles
├── js/                    # Frontend scripts
├── images/                # Static images
├── package.json           # Dependencies
├── vercel.json            # Vercel configuration
└── .env.example           # Environment variables template
```

## API Routes

All API endpoints are available at:

```
https://your-project.vercel.app/api/
```

### Available Endpoints:

- `GET /api/health` - Health check
- `GET /api/products` - List products
- `GET /api/products/[id]` - Get product by ID
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `GET /api/reviews` - List reviews
- `POST /api/reviews` - Create review
- `GET /api/admin/payments/overview` - Payment overview
- `POST /api/payments/config` - Razorpay config
- `POST /api/payments/create-order` - Create order
- `POST /api/payments/verify` - Verify payment

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` is correct
- Check that your NeonDB IP whitelist includes Vercel's IPs
- Run `npx prisma db push` to sync schema

### Missing Environment Variables

- Ensure all variables are set in Vercel dashboard
- Check that variable names match exactly (case-sensitive)

### Build Failures

- Check build logs in Vercel dashboard
- Ensure `package.json` has all required dependencies
- Run `npm install` locally to test

## Next Steps

1. Update the frontend to point to your Vercel domain
2. Configure your domain in Vercel settings
3. Set up SSL/TLS (automatic with Vercel)
4. Monitor usage in Vercel Analytics dashboard
5. Set up CI/CD workflows with GitHub

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [NeonDB Documentation](https://neon.tech/docs/)
