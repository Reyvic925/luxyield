// src/components/admin/PageWrapper.js
import React from 'react';

const PageWrapper = ({ children, title, actions }) => {
  return (
    <div className="w-full h-full min-h-[calc(100vh-4rem)] bg-gray-900">
      <div className="max-w-screen-xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-100">{title}</h1>
          {actions && (
            <div className="flex items-center space-x-4">
              {actions}
            </div>
          )}
        </div>
        <div className="bg-gray-800 rounded-xl shadow-lg min-h-[calc(100vh-12rem)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageWrapper;