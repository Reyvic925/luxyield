import React from 'react';

const AdminPageLayout = ({ children, title, actions }) => {
  return (
    <>
      <header className="py-4 border-b border-gray-700">
        <div className="px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          {actions && <div className="flex items-center gap-4">{actions}</div>}
        </div>
      </header>
      <main className="px-8 py-6">
        {children}
      </main>
    </>
  );
};

export default AdminPageLayout;
