/**
 * UserList Component
 * Displays a list of users with search, filter, and action buttons
 */

import React, { useState, useEffect } from 'react';
import { User } from '../types/User';
import { userAPI } from '../services/api';
import './UserList.css';

interface UserListProps {
  onEdit: (user: User) => void;
  onRefresh: () => void;
}

const UserList: React.FC<UserListProps> = ({ onEdit, onRefresh }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('all');

  // Fetch users on component mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [filterActive]);

  /**
   * Fetch users from API
   */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (filterActive !== 'all') {
        params.is_active = filterActive === 'active';
      }
      
      const response = await userAPI.getAll(params);
      setUsers(response.results || response as any);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle search
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchUsers();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.search(searchTerm);
      setUsers(response.results || response as any);
    } catch (err: any) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete user
   */
  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"?`)) {
      return;
    }

    try {
      await userAPI.delete(id);
      fetchUsers();
      onRefresh();
    } catch (err: any) {
      alert('Failed to delete user: ' + (err.response?.data?.detail || err.message));
    }
  };

  /**
   * Handle activate user
   */
  const handleActivate = async (id: number) => {
    try {
      await userAPI.activate(id);
      fetchUsers();
      onRefresh();
    } catch (err: any) {
      alert('Failed to activate user');
    }
  };

  /**
   * Handle deactivate user
   */
  const handleDeactivate = async (id: number) => {
    try {
      await userAPI.deactivate(id);
      fetchUsers();
      onRefresh();
    } catch (err: any) {
      alert('Failed to deactivate user');
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={fetchUsers}>Retry</button>
      </div>
    );
  }

  return (
    <div className="user-list">
      <div className="controls">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              fetchUsers();
            }}
            className="btn btn-secondary"
          >
            Clear
          </button>
        </form>

        {/* Filter */}
        <div className="filter">
          <label>Filter: </label>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Users</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Refresh Button */}
        <button onClick={fetchUsers} className="btn btn-secondary">
          Refresh
        </button>
      </div>

      {/* Users Table */}
      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="no-users">
                No users found
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id} className={user.is_active ? '' : 'inactive-row'}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="actions">
                  <button
                    onClick={() => onEdit(user)}
                    className="btn btn-sm btn-info"
                    title="Edit user"
                  >
                    Edit
                  </button>
                  {user.is_active ? (
                    <button
                      onClick={() => handleDeactivate(user.id)}
                      className="btn btn-sm btn-warning"
                      title="Deactivate user"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(user.id)}
                      className="btn btn-sm btn-success"
                      title="Activate user"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(user.id, user.name)}
                    className="btn btn-sm btn-danger"
                    title="Delete user"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="user-count">
        Total: {users.length} user{users.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default UserList;

