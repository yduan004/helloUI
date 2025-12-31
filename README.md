# User Management Frontend

React + TypeScript frontend for the Django User Management API.

## 🚀 Features

- ✅ **List Users** - View all users with pagination
- ✅ **Create User** - Add new users with validation
- ✅ **Edit User** - Update user information
- ✅ **Delete User** - Remove users from the system
- ✅ **Search** - Search users by name or email
- ✅ **Filter** - Filter by active/inactive status
- ✅ **Activate/Deactivate** - Toggle user status
- ✅ **Responsive Design** - Works on desktop and mobile

## 📋 Prerequisites

- Node.js 16+ and npm
- Django backend running on `http://localhost:8000`

## 🛠️ Setup

### 1. Install Dependencies

```bash
cd /Users/yduan/git/helloUI
npm install
```

### 2. Configure API URL (Optional)

Create a `.env` file if your backend runs on a different port:

```bash
REACT_APP_API_URL=http://localhost:8000/api
```

### 3. Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

## 📁 Project Structure

```
helloUI/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── components/         # React components
│   │   ├── UserList.tsx    # User list with search/filter
│   │   ├── UserList.css
│   │   ├── UserForm.tsx    # Create/Edit form
│   │   └── UserForm.css
│   ├── services/           # API service layer
│   │   └── api.ts          # Axios API client
│   ├── types/              # TypeScript types
│   │   └── User.ts         # User type definitions
│   ├── App.tsx             # Main app component
│   ├── App.css
│   ├── index.tsx           # Entry point
│   └── index.css
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints Used

| Method | Endpoint | Component | Description |
|--------|----------|-----------|-------------|
| GET | `/api/users/` | UserList | List all users |
| POST | `/api/users/` | UserForm | Create user |
| GET | `/api/users/{id}/` | - | Get user details |
| PUT | `/api/users/{id}/` | UserForm | Update user |
| PATCH | `/api/users/{id}/` | - | Partial update |
| DELETE | `/api/users/{id}/` | UserList | Delete user |
| POST | `/api/users/{id}/activate/` | UserList | Activate user |
| POST | `/api/users/{id}/deactivate/` | UserList | Deactivate user |
| GET | `/api/users/active_users/` | - | Get active users |

## 🎨 UI Components

### UserList Component
- Displays users in a table
- Search functionality
- Filter by status (all/active/inactive)
- Action buttons (Edit, Activate/Deactivate, Delete)
- Responsive design

### UserForm Component
- Modal form for create/edit
- Form validation
- Error handling
- Loading states

## 🧪 Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject configuration (one-way operation)
npm run eject
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

### CORS

Make sure your Django backend has CORS enabled for `http://localhost:3000`

## 📝 Usage

### Running Both Backend and Frontend

**Terminal 1 - Backend:**
```bash
cd /Users/yduan/git/helloApi
python manage.py runserver
# Runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd /Users/yduan/git/helloUI
npm start
# Runs on http://localhost:3000
```

### Creating a User

1. Click "Create New User" button
2. Fill in name and email
3. Toggle active status if needed
4. Click "Create User"

### Editing a User

1. Click "Edit" button on any user row
2. Modify the fields
3. Click "Update User"

### Searching Users

1. Type in the search box
2. Click "Search" or press Enter
3. Click "Clear" to reset

### Filtering Users

Use the dropdown to filter:
- All Users
- Active Only
- Inactive Only

## 🎯 TypeScript Types

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
}

interface UserInput {
  name: string;
  email: string;
  is_active?: boolean;
}
```

## 🚨 Troubleshooting

### CORS Error

If you see CORS errors, make sure Django backend has:
```python
CORS_ALLOW_ALL_ORIGINS = True  # or specify localhost:3000
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

## 📦 Dependencies

- **react** - UI library
- **typescript** - Type safety
- **axios** - HTTP client
- **react-scripts** - Build tooling

## 🎨 Styling

- Custom CSS (no external UI library)
- Responsive design
- Modern gradient header
- Clean table layout
- Modal forms

## 🔐 Security Notes

- Input validation on frontend
- API validation on backend
- No sensitive data in frontend
- HTTPS recommended for production

## 🚀 Production Build

```bash
# Create optimized build
npm run build

# Serve with static server
npx serve -s build
```

## 📄 License

MIT

---

**Happy Coding! 🎉**

