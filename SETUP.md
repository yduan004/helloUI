# Setup Guide - User Management Frontend

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd /Users/yduan/git/helloUI
npm install
```

This will install:
- React 18.2.0
- TypeScript 4.9.5
- Axios 1.6.2 (for API calls)
- React Scripts 5.0.1 (build tools)

### Step 2: Make Sure Backend is Running

```bash
# In another terminal
cd /Users/yduan/git/helloApi
python manage.py runserver
```

Verify backend is accessible:
```bash
curl http://localhost:8000/api/users/
```

### Step 3: Start Frontend

```bash
npm start
```

The app will automatically open at `http://localhost:3000`

## 📊 What You'll See

### Main Interface

```
┌─────────────────────────────────────────────────┐
│        User Management System                   │
│   Manage users with full CRUD operations        │
├─────────────────────────────────────────────────┤
│                                                 │
│  [+ Create New User]                            │
│                                                 │
│  Search: [_____________] [Search] [Clear]       │
│  Filter: [All Users ▼]  [Refresh]               │
│                                                 │
│  ┌───┬──────────┬──────────────┬────────┬──────┐│
│  │ID │ Name     │ Email        │ Status │Action││
│  ├───┼──────────┼──────────────┼────────┼──────┤│
│  │ 1 │ John Doe │john@ex.com   │ Active │[Edit]││
│  │   │          │              │        │[Deac]││
│  │   │          │              │        │[Del] ││
│  ├───┼──────────┼──────────────┼────────┼──────┤│
│  │ 2 │ Jane     │jane@ex.com   │Inactive│[Edit]││
│  │   │          │              │        │[Act] ││
│  │   │          │              │        │[Del] ││
│  └───┴──────────┴──────────────┴────────┴──────┘│
│                                                 │
│  Total: 2 users                                 │
└─────────────────────────────────────────────────┘
```

## 🎯 Features Walkthrough

### 1. View All Users
- Automatically loads on page load
- Shows ID, Name, Email, Status
- Active users: green badge
- Inactive users: red badge, dimmed row

### 2. Create New User
1. Click "Create New User" button
2. Modal form appears
3. Fill in:
   - Name (required)
   - Email (required)
   - Active checkbox (default: checked)
4. Click "Create User"
5. Form validates and submits to API
6. List refreshes automatically

### 3. Edit User
1. Click "Edit" button on any row
2. Modal form appears with current data
3. Modify fields
4. Click "Update User"
5. Changes saved to API

### 4. Delete User
1. Click "Delete" button
2. Confirmation dialog appears
3. Confirm to delete
4. User removed from database

### 5. Activate/Deactivate
- **Active users**: Show "Deactivate" button (orange)
- **Inactive users**: Show "Activate" button (green)
- Click to toggle status
- List refreshes automatically

### 6. Search Users
1. Type in search box (searches name and email)
2. Click "Search" or press Enter
3. Results filtered
4. Click "Clear" to reset

### 7. Filter by Status
- Select "All Users" - shows everyone
- Select "Active Only" - shows only active users
- Select "Inactive Only" - shows only inactive users

## 🔧 Configuration

### API URL

Default: `http://localhost:8000/api`

To change, create `.env` file:
```env
REACT_APP_API_URL=http://localhost:8000/api
```

### Port

Default: `3000`

To change:
```bash
PORT=3001 npm start
```

## 🎨 Customization

### Change Colors

Edit `src/App.css`:
```css
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Change to your preferred gradient */
}
```

### Modify Table Columns

Edit `src/components/UserList.tsx`:
```tsx
<th>ID</th>
<th>Name</th>
<th>Email</th>
<th>Status</th>
<th>Actions</th>
```

## 🧪 Testing the App

### Test Create
1. Click "Create New User"
2. Enter:
   - Name: "Test User"
   - Email: "test@example.com"
3. Click "Create User"
4. Check backend: `curl http://localhost:8000/api/users/`

### Test Edit
1. Click "Edit" on any user
2. Change name to "Updated Name"
3. Click "Update User"
4. Verify change in table

### Test Delete
1. Click "Delete" on any user
2. Confirm deletion
3. User disappears from list

### Test Search
1. Type "john" in search box
2. Click "Search"
3. Only matching users shown

### Test Filter
1. Select "Active Only"
2. Only active users shown
3. Select "Inactive Only"
4. Only inactive users shown

### Test Activate/Deactivate
1. Click "Deactivate" on active user
2. Status changes to "Inactive"
3. Button changes to "Activate"
4. Click "Activate" to reverse

## 🐛 Troubleshooting

### "Network Error" or "Failed to fetch"

**Cause:** Backend not running or CORS not configured

**Solution:**
1. Check backend is running: `http://localhost:8000/api/users/`
2. Check Django settings have `CORS_ALLOW_ALL_ORIGINS = True`
3. Restart both servers

### "npm: command not found"

**Cause:** Node.js not installed

**Solution:**
```bash
# Install Node.js
brew install node

# Verify installation
node --version
npm --version
```

### Port 3000 already in use

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

### TypeScript errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📝 Code Structure

### Type Definitions (`src/types/User.ts`)
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
}
```

### API Service (`src/services/api.ts`)
```typescript
export const userAPI = {
  getAll: (params) => axios.get('/users/', { params }),
  create: (data) => axios.post('/users/', data),
  update: (id, data) => axios.put(`/users/${id}/`, data),
  delete: (id) => axios.delete(`/users/${id}/`),
  activate: (id) => axios.post(`/users/${id}/activate/`),
  deactivate: (id) => axios.post(`/users/${id}/deactivate/`),
  // ... more methods
};
```

### Components
- **App.tsx** - Main container, manages state
- **UserList.tsx** - Displays users, handles actions
- **UserForm.tsx** - Create/edit form with validation

## 🎯 Development Workflow

```
1. Edit code in src/
2. Save file
3. App automatically reloads in browser
4. Test changes
5. Repeat
```

## 🏗️ Build for Production

```bash
# Create optimized build
npm run build

# Output in build/ directory
# Deploy to static hosting (Netlify, Vercel, S3, etc.)
```

## 📚 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Axios** - HTTP client
- **CSS3** - Styling (no UI framework)
- **React Scripts** - Build tooling

## 🔗 Related

- Backend API: `/Users/yduan/git/helloApi`
- API Documentation: `helloApi/README.md`
- API Reference: `helloApi/API_REFERENCE.md`

---

**Enjoy your User Management System! 🎉**

