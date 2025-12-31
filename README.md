# User Management Frontend

React + TypeScript frontend for the Django User Management API.

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd /Users/yduan/git/helloUI
npm install
```

### Step 2: Start Backend

```bash
# In another terminal
cd /Users/yduan/git/helloApi
python manage.py runserver
```

### Step 3: Start Frontend

```bash
npm start
```

The app will open at `http://localhost:3000`

---

## ✨ Features

### All 9 API Endpoints Implemented:

| Endpoint | Method | UI Feature |
|----------|--------|------------|
| `/api/users/` | GET | List all users in table |
| `/api/users/` | POST | Create user via modal form |
| `/api/users/{id}/` | GET | Get user (used in edit) |
| `/api/users/{id}/` | PUT | Update user via modal form |
| `/api/users/{id}/` | DELETE | Delete with confirmation |
| `/api/users/?search=` | GET | Search by name/email |
| `/api/users/?is_active=` | GET | Filter by active status |
| `/api/users/{id}/activate/` | POST | Activate inactive user |
| `/api/users/{id}/deactivate/` | POST | Deactivate active user |

### UI Features:
- ✅ Modern gradient header
- ✅ Responsive table design
- ✅ Color-coded status badges (Green=Active, Red=Inactive)
- ✅ Modal forms with validation
- ✅ Search functionality
- ✅ Status filter dropdown
- ✅ Confirmation dialogs
- ✅ Loading states
- ✅ Error handling

---

## 📁 Project Structure

```
helloUI/
├── public/
│   └── index.html              # HTML template
├── src/
│   ├── types/
│   │   └── User.ts             # TypeScript type definitions
│   ├── services/
│   │   └── api.ts              # Axios API client
│   ├── components/
│   │   ├── UserList.tsx        # User table with search/filter
│   │   ├── UserList.css
│   │   ├── UserForm.tsx        # Create/edit form
│   │   └── UserForm.css
│   ├── App.tsx                 # Main app component
│   ├── App.css
│   ├── index.tsx               # Entry point
│   └── index.css               # Global styles
├── package.json
├── tsconfig.json
└── .gitignore
```

---

## 📋 Prerequisites

- Node.js 16+ and npm
- Django backend running on `http://localhost:8000`
- PostgreSQL database with `users` table including `is_active` field

---

## 🎯 Usage Guide

### Creating a User
1. Click **"Create New User"** button
2. Fill in name and email (required)
3. Toggle active status if needed (default: checked)
4. Click **"Create User"**

### Editing a User
1. Click **"Edit"** button on any user row
2. Modify the fields
3. Click **"Update User"**

### Deleting a User
1. Click **"Delete"** button
2. Confirm in the dialog

### Searching Users
1. Type in the search box (searches name and email)
2. Click **"Search"** or press Enter
3. Click **"Clear"** to reset

### Filtering Users
Click the filter buttons:
- **All Users** - Show everyone
- **Active Users** - Show only active
- **Inactive Users** - Show only inactive

### Activating/Deactivating
- For active users: Click **"Deactivate"** (orange button)
- For inactive users: Click **"Activate"** (green button)

---

## 🔧 Configuration

### API URL (Optional)

Default: `http://localhost:8000/api`

To change, create `.env` file:
```env
REACT_APP_API_URL=http://localhost:8000/api
```

### Change Port

```bash
PORT=3001 npm start
```

---

## 🧪 Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

---

## 🎨 TypeScript Types

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
}

interface UserFormData {
  name: string;
  email: string;
  is_active: boolean;
}
```

---

## 🚨 Troubleshooting

### CORS Error

Make sure Django backend has CORS enabled:
```python
# backend/settings.py
CORS_ALLOW_ALL_ORIGINS = True
```

### API Connection Error

1. Check backend is running: `http://localhost:8000/api/users/`
2. Check `.env` file has correct API URL
3. Restart frontend: `npm start`

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or run on different port
PORT=3001 npm start
```

### "Cannot find module 'react'" Error

```bash
# Reinstall dependencies
npm install
```

---

## 📦 Dependencies

- **react** (18.2.0) - UI library
- **typescript** (4.9.5) - Type safety
- **axios** (1.6.2) - HTTP client
- **react-scripts** (5.0.1) - Build tooling

---

## 🔐 Security Notes

- Input validation on frontend
- API validation on backend
- No sensitive data stored in frontend
- HTTPS recommended for production

---

## 🚀 Production Build

```bash
# Create optimized build
npm run build

# Output in build/ directory
# Deploy to static hosting (Netlify, Vercel, AWS S3, etc.)
```

---

## 💻 Technology Stack

- React 18 - UI library
- TypeScript - Type safety
- Axios - HTTP client
- CSS3 - Custom styling (no UI framework)

---

## 🔗 Related Projects

- **Backend API**: `/Users/yduan/git/helloApi`
- **Backend Documentation**: `helloApi/README.md`
- **API Reference**: `helloApi/API_REFERENCE.md`

---

## 📄 License

MIT

---

**Happy Coding! 🎉**
