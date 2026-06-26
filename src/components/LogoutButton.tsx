"use client";

import React from 'react';
import useLogout from '@/hooks/useLogout';

interface LogoutButtonProps {
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ className }) => {
  const { logout, isLoading } = useLogout();
  
  return (
    <button 
      onClick={logout} 
      disabled={isLoading}
      className={`px-4 py-2 bg-[#df5f39] hover:bg-[#f0673e] text-white rounded-md transition-colors ${className || ''}`}
    >
      {isLoading ? 'Signing out...' : 'Sign out'}
    </button>
  );
};

export default LogoutButton; 