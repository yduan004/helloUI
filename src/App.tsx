/**
 * Main App Component
 * User Management Application
 */

import React, { useState } from 'react';
import UserList from './components/UserList';
import UserForm from './components/UserForm';
import { User } from './types/User';
import './App.css';

const App: React.FC = () => {
    const [showForm, setShowForm] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [refreshKey, setRefreshKey] = useState<number>(0);

    /**
     * Handle create new user
     */
    const handleCreate = () => {
        setEditingUser(null);
        setShowForm(true);
    };

    /**
     * Handle edit user
     */
    const handleEdit = (user: User) => {
        setEditingUser(user);
        setShowForm(true);
    };

    /**
     * Handle form success (create or update)
     */
    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingUser(null);
        setRefreshKey((prev) => prev + 1); // Trigger refresh
    };

    /**
     * Handle form cancel
     */
    const handleFormCancel = () => {
        setShowForm(false);
        setEditingUser(null);
    };

    /**
     * Handle refresh
     */
    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className="App">
            <header className="app-header">
                <h1>User Management System</h1>
                <p className="subtitle">Manage users with full CRUD operations</p>
            </header>

            <main className="app-main">
                <div className="container">
                    {/* Action Bar */}
                    <div className="action-bar">
                        <button onClick={handleCreate} className="btn btn-primary btn-lg">
                            + Create New User
                        </button>
                    </div>

                    {/* User List */}
                    <UserList
                        key={refreshKey}
                        onEdit={handleEdit}
                        onRefresh={handleRefresh}
                    />

                    {/* User Form Modal */}
                    {showForm && (
                        <UserForm
                            user={editingUser}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    )}
                </div>
            </main>

            <footer className="app-footer">
                <p>
                    Backend API: <code>http://localhost:8000/api</code>
                </p>
                <p>
                    Built with React + TypeScript + Django REST Framework
                </p>
            </footer>
        </div>
    );
};

export default App;

