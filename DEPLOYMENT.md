# EnCode Supabase Deployment Guide

This document provides step-by-step instructions for deploying EnCode with Supabase backend.

---

## Prerequisites

- A Supabase account (free tier works)
- Node.js 18+ installed
- Supabase CLI installed (optional, but recommended for Edge Functions)
- An OpenAI API key (or Gemini API key)

---

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose organization, project name, database password, and region
4. Wait for project initialization (~2 minutes)

---

## Step 2: Run Database Schema

1. In your Supabase dashboard, navigate to **SQL Editor**
2. Copy the entire contents of `supabase/schema.sql`
3. Paste into the SQL Editor and click "Run"
4. Verify that the `analyses` table appears in **Database** → **Tables**

---

## Step 3: Deploy Edge Function

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the Edge Function
supabase functions deploy analyze_product

# Set environment variables for the Edge Function
supabase secrets set LLM_API_KEY=your_openai_api_key_here
```

### Option B: Using Supabase Dashboard

1. Navigate to **Edge Functions** in your Supabase dashboard
2. Click "Create a new function"
3. Name it `analyze_product`
4. Copy the contents of `supabase/functions/analyze_product/index.ts`
5. Paste into the editor and deploy
6. Go to **Edge Functions** → **Settings** and add environment variable:
   - Key: `LLM_API_KEY`
   - Value: `your_openai_api_key_here`

---

## Step 4: Configure Frontend Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. To find these values:
   - Go to your Supabase project dashboard
   - Navigate to **Settings** → **API**
   - Copy **Project URL** → `VITE_SUPABASE_URL`
   - Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`

---

## Step 5: Test Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Open the app in your browser (usually `http://localhost:5173`)

4. Test the flow:
   - Enter your email address
   - Click "Send Magic Link"
   - Check your email and click the magic link
   - You should be redirected back and signed in
   - Enter ingredient text and submit
   - Verify AI analysis appears
   - Check history tab

---

## Step 6: Deploy Frontend to Production

### Option A: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard:
# Settings → Environment Variables
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### Option B: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the app
npm run build

# Deploy
netlify deploy --prod --dir=dist

# Add environment variables in Netlify dashboard:
# Site settings → Environment variables
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

---

## Step 7: Configure Email Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize "Magic Link" template if desired
4. For production, configure a custom SMTP provider:
   - Go to **Settings** → **Auth** → **SMTP Settings**
   - Use your own email service (SendGrid, AWS SES, etc.)

---

## Troubleshooting

### Magic link emails not arriving

- Check Supabase logs: **Authentication** → **Logs**
- Verify email provider is configured correctly
- Check spam folder
- For development, consider using a test email service like [Mailtrap](https://mailtrap.io)

### Edge Function errors

- Check Edge Function logs: **Edge Functions** → **Logs**
- Verify `LLM_API_KEY` is set correctly
- Test Edge Function directly from Supabase dashboard
- Ensure OpenAI API key has sufficient credits

### Database permission errors

- Verify RLS policies are enabled
- Check that user is authenticated before querying
- Review Supabase auth logs

### Build errors

- Delete `node_modules` and `package-lock.json`, then run `npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Ensure environment variables are prefixed with `VITE_`

---

## Production Checklist

- [ ] SQL schema deployed to Supabase
- [ ] RLS policies enabled and tested
- [ ] Edge Function deployed with correct environment variables
- [ ] Frontend environment variables configured
- [ ] Email authentication tested
- [ ] Custom SMTP provider configured (for production emails)
- [ ] Frontend deployed to Vercel/Netlify
- [ ] Test full user flow from magic link to analysis
- [ ] Verify RLS isolation (different users can't see each other's data)

---

## LLM Configuration

### Using OpenAI (Default)

The Edge Function is configured for OpenAI's `gpt-4o-mini` model by default. To use a different model:

1. Edit `supabase/functions/analyze_product/index.ts`
2. Change `model: "gpt-4o-mini"` to your preferred model
3. Redeploy the Edge Function

### Switching to Google Gemini

1. Edit `supabase/functions/analyze_product/index.ts`
2. Replace the `callLLM` function with Gemini API call:

```typescript
async function callLLM(inputText: string): Promise<LLMResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${OPENAI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${SYSTEM_PROMPT}\n\nIngredient list:\n${inputText}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      })
    }
  );

  const result = await response.json();
  const content = result.candidates[0].content.parts[0].text;
  const parsed = JSON.parse(content);

  if (!validateResponse(parsed)) {
    throw new Error("LLM response does not match required schema");
  }

  return parsed;
}
```

3. Update environment variable name if needed
4. Redeploy the Edge Function

---

## Cost Estimates

### Supabase (Free Tier)
- Database: 500 MB storage
- Auth: Unlimited users
- Edge Functions: 500K invocations/month
- Bandwidth: 5 GB/month

**Recommendation**: Free tier is sufficient for initial launch and testing.

### OpenAI API (gpt-4o-mini)
- Input: ~$0.15 / 1M tokens
- Output: ~$0.60 / 1M tokens
- Average analysis: ~500 tokens total ≈ $0.0003 per analysis

**Recommendation**: $10 credit = ~30,000+ analyses

### Hosting (Vercel/Netlify Free Tier)
- Both offer generous free tiers for frontend hosting
- No cost for typical usage

---

## Security Notes

- Never commit `.env` file to version control (already in `.gitignore`)
- Use Supabase service role key ONLY on the server (Edge Function)
- RLS policies ensure data isolation between users
- Magic links expire after 1 hour by default
- Rate limiting is handled by Supabase Auth

---

## Support

For issues related to:
- **Supabase**: [https://supabase.com/docs](https://supabase.com/docs)
- **OpenAI API**: [https://platform.openai.com/docs](https://platform.openai.com/docs)
- **Vite**: [https://vitejs.dev](https://vitejs.dev)
