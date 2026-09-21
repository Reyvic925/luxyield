import React from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function NotificationProvider({ children }) {
  // Support notifications are now handled by Smartsupp - no need to listen for supportNotification events

  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}

