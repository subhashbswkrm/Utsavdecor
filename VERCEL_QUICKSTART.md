# README for Quick Start

Your Utsav Decor project is now **ready for Vercel deployment**!

## What's Been Configured

✅ **Vercel API Routes** - All backend endpoints are serverless functions in the `/api` folder  
✅ **PostgreSQL (NeonDB)** - Replaced MongoDB with Prisma ORM  
✅ **Environment Variables** - `.env.example` provided  
✅ **CORS Headers** - Configured in `vercel.json`  
✅ **Static Files** - HTML, CSS, JS served directly  

## Deploy in 3 Steps

### 1️⃣ Get Your NeonDB Connection String
- Sign up at [neon.tech](https://neon.tech)
- Create a project and copy your connection string

### 2️⃣ Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 3️⃣ Deploy to Vercel
- Go to [vercel.com](https://vercel.com)
- Click "Import Project"
- Select your GitHub repository
- Add environment variables (DATABASE_URL, RAZORPAY keys)
- Click Deploy

Your site will be live in **2-5 minutes**!

## Environment Variables to Set

In Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://...    # Your NeonDB connection string
RAZORPAY_KEY_ID=your_key_id      # From Razorpay account
RAZORPAY_KEY_SECRET=your_secret  # From Razorpay account
```

## After Deployment

1. Set up your database:
   ```bash
   npx prisma db push
   ```

2. Update frontend API base URL to your Vercel domain

3. Test all API endpoints

## Need Help?

- See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide
- Check [package.json](./package.json) for all dependencies
- Review [prisma/schema.prisma](./prisma/schema.prisma) for database structure

**Happy deploying!** 🚀
