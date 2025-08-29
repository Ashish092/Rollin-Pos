# POSS Admin Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Setup

1. Create a new Supabase project
2. Get your project URL and anon key from the project settings
3. Add them to your `.env.local` file

## Database Tables

You'll need to create the following tables in your Supabase database:

### Stores Table
```sql
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Profiles Table
```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  role TEXT CHECK (role IN ('admin', 'store_manager', 'staff')),
  store_id UUID REFERENCES stores(id),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- ✅ Login page with Supabase authentication
- ✅ Dashboard with basic stats
- ✅ Settings page
- ✅ Sidebar navigation
- ✅ Top bar with profile and logout
- ✅ Responsive design with Tailwind CSS

## Next Steps

- Set up Supabase authentication
- Create admin user
- Add store management functionality
- Implement user management
- Add transaction tracking
- Create reports and analytics
