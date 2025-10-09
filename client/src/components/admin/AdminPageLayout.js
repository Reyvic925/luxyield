import React from 'react';

const AdminPageLayout = ({ children, title, actions }) => {
  return (
    <>
      <header className="py-3 md:py-4 border-b border-gray-700">
        <div className="px-4 md:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-white">{title}</h1>
          {actions && (
            <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
              {actions}
            </div>
          )}
        </div>
      </header>
      <main className="px-4 md:px-8 py-4 md:py-6 overflow-x-auto">
        {children}
      </main>
    </>
  );
};

export default AdminPageLayout;
