# Supabase Setup

Great! We are now using Supabase.

I found your project ID from the database URL: `ddqnicwygobkrcqqpbwo`

But we need your **Public API Keys** to make the frontend work.

## Step 1: Update .env.local
Open your `.env.local` file and replace its contents with this:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ddqnicwygobkrcqqpbwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
```

## Step 2: Where to find the Anon Key?
1. Go to your Supabase Dashboard: [https://supabase.com/dashboard/project/ddqnicwygobkrcqqpbwo/settings/api](https://supabase.com/dashboard/project/ddqnicwygobkrcqqpbwo/settings/api)
2. **In the Left Sidebar**, click on **API Keys** (it is located right below the "Data API" tab).
3. Look for the **anon** / **public** key on the right side.
4. Copy that string and paste it into `.env.local` replacing `YOUR_SUPABASE_ANON_KEY_HERE`.

## Step 3: Restart Server
Run `npm run dev` again to load the new variables.
