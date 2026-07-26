// src/components/InAppNotifications.js
import React, { useState, useEffect } from 'react';
import { FiBell, FiX } from 'react-icons/fi';
import { getNotifications } from '../services/notificationAPI';

const InAppNotifications = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications(userId);
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    
    // Set up real-time updates (e.g., WebSocket or polling)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const markAsRead = async (id) => {
    try {
      // await markNotificationAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 relative theme-aware-hover-bg rounded-full"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 theme-aware-bg-secondary rounded-lg shadow-lg z-50 border theme-aware-border">
          <div className="p-3 border-b theme-aware-border-secondary flex justify-between items-center">
            <h3 className="font-bold theme-aware-text">Notifications</h3>
            <button onClick={() => setIsOpen(false)} className="theme-aware-text-secondary hover:theme-aware-text">
              <FiX />
            </button>
          </div>
          
          <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gold">
            {notifications.length === 0 ? (
              <div className="p-4 text-center theme-aware-text-muted">No notifications</div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-3 border-b theme-aware-border-secondary theme-aware-hover-bg cursor-pointer ${
                    !notification.read ? 'theme-aware-active' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <p className="text-sm theme-aware-text">{notification.message}</p>
                  <p className="text-xs theme-aware-text-muted mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-2 border-t theme-aware-border-secondary text-center">
              <button className="text-xs text-gold hover:underline">
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InAppNotifications;
