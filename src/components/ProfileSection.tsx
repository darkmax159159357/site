"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import LogoutButton from './LogoutButton';

const ProfileSection: React.FC = () => {
  const { user, userData, loading } = useAuth();
  const { updateProfile, isUpdating, updateError } = useProfile();
  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [editMode, setEditMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await updateProfile({ displayName })) {
      setEditMode(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className="p-4">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-white mb-4">Your Profile</h2>
      
      {updateError && (
        <div className="bg-red-700/40 border border-red-700 text-white p-3 rounded-md mb-4 text-sm">
          {updateError}
        </div>
      )}

      {editMode ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-transparent w-full outline-none focus:ring-2 focus:ring-gray-400 rounded-sm ring-1 ring-gray-400 py-2 px-4 text-white"
              disabled={isUpdating}
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 bg-[#df5f39] hover:bg-[#f0673e] text-white rounded-md transition-colors"
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-gray-400 text-sm">Email</p>
            <p className="text-white">{userData?.email}</p>
          </div>
          
          <div>
            <p className="text-gray-400 text-sm">Display Name</p>
            <p className="text-white">{userData?.displayName || 'Not set'}</p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Edit Profile
            </button>
            <LogoutButton />
          </div>
        </div>
      )}

      {/* Bookmarks section could go here */}
    </div>
  );
};

export default ProfileSection; 