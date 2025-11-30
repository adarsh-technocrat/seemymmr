# seemymmr

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- ✅ Next.js 16 with App Router
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ MongoDB Atlas Database
- ✅ Mongoose ODM
- ✅ Database Query Utilities

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
```

**To get your MONGODB_URI:**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (if you don't have one)
3. Click "Connect" on your cluster
4. Choose "Connect your application"
5. Copy the connection string (it will look like: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`)
6. Replace `<password>` with your database password
7. Optionally change `<dbname>` to your preferred database name

### 3. Set Up MongoDB Atlas

This project uses MongoDB Atlas with Mongoose ODM for database operations.

1. **Create a MongoDB Atlas account:**

   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   - Sign up for a free account (M0 Free Tier available)

2. **Create a cluster:**

   - Click "Build a Database"
   - Choose the free M0 tier
   - Select your preferred cloud provider and region
   - Click "Create"

3. **Configure database access:**

   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and password (save these!)
   - Set user privileges to "Atlas admin" or create custom role
   - Click "Add User"

4. **Configure network access:**

   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development, click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, add only your server IPs
   - Click "Confirm"

5. **Get your connection string:**

   - Go back to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Add it to your `.env.local` as `MONGODB_URI`

6. **Define your models:**
   - Edit `db/models/` to create your Mongoose models
   - See `db/models/Profile.ts` for an example

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
├── app/
│   ├── layout.tsx
│   └── page.tsx               # Home page
├── db/
│   ├── index.ts                # MongoDB connection utility
│   └── models/                 # Mongoose models
│       └── Profile.ts          # Example Profile model
├── types/
│   └── mongodb.d.ts            # MongoDB TypeScript types
└── utils/
    └── database/
        └── queries.ts          # Database query utilities (Mongoose)
```

## Database Usage

This project uses **MongoDB Atlas** with **Mongoose ODM** for database operations.

### Using MongoDB in Your Code

**Server Components (Recommended):**

```typescript
import connectDB from "@/db";
import Profile from "@/db/models/Profile";

export default async function Page() {
  await connectDB();

  // Query data
  const profiles = await Profile.find({}).sort({ createdAt: -1 });

  // Query with conditions
  const userProfile = await Profile.findOne({ userId: "user-id" });

  // ... use data
}
```

**Using Query Utilities:**

```typescript
import {
  getProfiles,
  getProfileByUserId,
  createProfile,
  updateProfile,
  deleteProfile,
} from "@/utils/database/queries";

// Get all profiles
const profiles = await getProfiles();

// Get profile by user ID
const profile = await getProfileByUserId("user-id");

// Create profile
const newProfile = await createProfile({
  userId: "user-id",
  fullName: "John Doe",
  avatarUrl: "https://...",
});

// Update profile
const updated = await updateProfile("user-id", {
  fullName: "Jane Doe",
});

// Delete profile
await deleteProfile("user-id");
```

**Creating New Models:**

1. Create a new model file in `db/models/`:

```typescript
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IYourModel extends Document {
  // Define your fields
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const YourModelSchema = new Schema<IYourModel>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const YourModel: Model<IYourModel> =
  mongoose.models.YourModel ||
  mongoose.model<IYourModel>("YourModel", YourModelSchema);

export default YourModel;
```

2. Use the model in your queries or create utility functions in `utils/database/queries.ts`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Don't forget to add your environment variables in Vercel's project settings!
