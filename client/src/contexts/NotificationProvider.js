import React, { useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// You must have a socket context or hook that provides the socket instance
import { useSocket } from '../hooks/useSocket';

export default function NotificationProvider({ children }) {
  const socket = useSocket();

  // Support notifications are now handled by Smartsupp - no need to listen for supportNotification events

  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}

