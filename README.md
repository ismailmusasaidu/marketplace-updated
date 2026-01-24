# Delivery App

A multi-vendor delivery marketplace app built with Expo and Supabase.

## Setup Instructions

### 1. Environment Variables

Update the `.env` file with your credentials:

```
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
```

### 2. Google Maps Setup

The app uses Google Maps Distance Matrix API to calculate delivery distances and fees. The API is called securely through a Supabase Edge Function.

1. Go to the Google Cloud Console at https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Enable the Distance Matrix API for your project
4. Go to Credentials and create an API key
5. In your Supabase dashboard:
   - Navigate to Project Settings > Edge Functions > Secrets
   - Add a new secret named `GOOGLE_MAPS_API_KEY` with your API key

The Edge Function `calculate-distance` is already deployed and will securely handle all distance calculations using your API key.

Note: The Distance Matrix API provides accurate road-based distances rather than straight-line distances.

### 3. Database Setup

Follow the instructions in `DATABASE_SETUP.md` to set up your Supabase database.

### 4. Running the App

```bash
npm install
npm run dev
```
