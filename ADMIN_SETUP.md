# Admin Setup Guide

This guide explains how to promote users to admin and access the admin panel.

## 🔐 Making a User an Admin

There are **three ways** to make a user an admin:

### Method 1: Using the Script (Recommended)

Use the provided script to promote a user by email or ID:

```bash
# By email
npm run make-admin user@example.com

# By user ID
npm run make-admin cm1234567890abcdef

# By Kinde ID (if different)
npm run make-admin kinde_123456
```

### Method 2: Using the Admin Panel (If you already have an admin)

1. Log in as an existing admin
2. Go to `/admin` → Users Management tab
3. Find the user you want to promote
4. Change their role from "User" to "Admin" using the dropdown

### Method 3: Direct Database Update (Advanced)

If you have direct database access:

```sql
-- Update by email
UPDATE "User" SET role = 'ADMIN' WHERE email = 'user@example.com';

-- Update by ID
UPDATE "User" SET role = 'ADMIN' WHERE id = 'user-id-here';
```

Or using Prisma Studio:
```bash
npx prisma studio
```
Then navigate to the User table and update the `role` field to `ADMIN`.

## 🚪 Accessing the Admin Panel

1. **Log in** to your ByteDialogue account
2. Navigate to `/admin` in your browser
3. If you're an admin, you'll see the admin dashboard
4. If you're not an admin, you'll be redirected to `/dashboard`

## 📋 Admin Panel Features

Once you have admin access, you can:

- **View Analytics Dashboard**: Charts showing active users, upload trends, token usage, and revenue
- **Manage Users**: Search, filter, and manage all users
  - Change user roles (User ↔ Admin)
  - Suspend or ban accounts
  - View user details and statistics
- **View Usage Analytics**: Overall platform statistics
- **Adjust Subscriptions**: Change user subscription tiers

## 🔒 Security Notes

- Only users with `role = 'ADMIN'` can access `/admin`
- Admin endpoints are protected with `requireAdmin()` function
- The first admin should be created using Method 1 (script) or Method 3 (database)
- Admins can promote other users to admin through the UI

## 🆘 Troubleshooting

**Can't access `/admin`?**
- Check that your user has `role = 'ADMIN'` in the database
- Try logging out and logging back in
- Verify the role was saved correctly

**Script not working?**
- Make sure you have the correct email/ID
- Check that the user exists in the database
- Ensure Prisma client is generated: `npx prisma generate`

**Need to demote an admin?**
- Use the admin panel to change their role back to "User"
- Or use the script with a modified version to set role to 'USER'

