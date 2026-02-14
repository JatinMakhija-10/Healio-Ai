# Firebase Configuration Setup

The app is crashing because it doesn't have your Firebase configuration keys. It's currently using "mock" keys which are invalid.

## Step 1: Create the Environment File
Create a new file named `.env.local` in the root of your project (`c:\Users\JATIN\Desktop\Healio.AI\.env.local`).

## Step 2: Add Your Keys
Copy the following content into that file, replacing the placeholder values with your actual Firebase project settings:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 3: Restart the Server
After creating the file, you must restart your development server for the changes to take effect:
1. Stop the running server (Ctrl+C).
2. Run `npm run dev` again.
