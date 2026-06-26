"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { updateUserProfile, changePassword, UserData } from '@/lib/firebaseAuth';

export const useProfile = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  const updateProfile = async (data: { displayName?: string; photoURL?: string }) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      await updateUserProfile(data);
      toast.success('Profile updated successfully');
      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setUpdateError(error.message || 'Failed to update profile');
      toast.error(error.message || 'Failed to update profile');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };
  
  const updatePassword = async (newPassword: string) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      await changePassword(newPassword);
      toast.success('Password updated successfully');
      return true;
    } catch (error: any) {
      console.error('Error updating password:', error);
      setUpdateError(error.message || 'Failed to update password');
      toast.error(error.message || 'Failed to update password');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };
  
  return {
    updateProfile,
    updatePassword,
    isUpdating,
    updateError
  };
};

export default useProfile; 