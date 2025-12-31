# Database Update Required

## ⚠️ Important: Add is_active Field to Database

Your frontend expects the `is_active` field in the users table. You need to add it to your PostgreSQL database.

## 🔧 Update Your Database

### **Option 1: Using psql Command**

```bash
psql -U postgres -d my_database -c "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;"
```

### **Option 2: Using psql Interactive**

```bash
# Connect to database
psql -U postgres -d my_database

# Run SQL command
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;

# Verify
\d users

# Exit
\q
```

### **Option 3: Update Existing Users**

If you want all existing users to be active:

```sql
-- Add column
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;

-- Set all existing users to active
UPDATE users SET is_active = TRUE;
```

---

## ✅ Verify the Update

```bash
# Check table structure
psql -U postgres -d my_database -c "\d users"
```

You should see:
```
                          Table "public.users"
  Column   |          Type          | Collation | Nullable | Default 
-----------+------------------------+-----------+----------+---------
 id        | integer                |           | not null | 
 name      | character varying(255) |           | not null | 
 email     | character varying(254) |           | not null | 
 is_active | boolean                |           | not null | true
```

---

## 🧪 Test the Update

```bash
# View all users with new field
psql -U postgres -d my_database -c "SELECT * FROM users;"
```

You should see the `is_active` column:
```
 id |    name    |       email        | is_active 
----+------------+--------------------+-----------
  1 | Kai Cao    | kaicao7@gmail.com  | t
  2 | Yuzhu Duan | raingdyz@gmail.com | t
```

---

## 🔄 After Database Update

1. **Restart Django backend:**
   ```bash
   cd /Users/yduan/git/helloApi
   # Press Ctrl+C to stop
   python manage.py runserver
   ```

2. **Test API:**
   ```bash
   curl http://localhost:8000/api/users/
   ```
   
   Should return users with `is_active` field:
   ```json
   {
     "id": 1,
     "name": "Kai Cao",
     "email": "kaicao7@gmail.com",
     "is_active": true
   }
   ```

3. **Start Frontend:**
   ```bash
   cd /Users/yduan/git/helloUI
   npm install
   npm start
   ```

---

## 🎯 Summary

**Current Schema:**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);
```

**Run this command:**
```bash
psql -U postgres -d my_database -c "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;"
```

**Then you're ready to go!** 🚀

