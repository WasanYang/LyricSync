// src/components/shared/MainLayout.tsx
import React from 'react';
// import Header from '../Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  headerActions?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  headerActions,
}) => {
  return (
    <div className='flex flex-col min-h-screen'>
      {/* <Header title={title} actions={headerActions} /> */}
      <main className='flex-grow container mx-auto px-4'>{children}</main>
    </div>
  );
};

export default MainLayout;
