'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => Promise<void>;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const router = useRouter();
  const { user } = useAuth();
  
  useEffect(() => {
    if (isOpen) {
      // Redirect to auth page
      router.push('/auth');
      // Close the modal
      onClose();
    }
  }, [isOpen, onClose, router]);

  useEffect(() => {
    // If user is logged in and onSuccess is provided, call it
    if (user && onSuccess) {
      onSuccess();
    }
  }, [user, onSuccess]);

  // Return null since we're redirecting
  return null;
};

export default LoginModal; 