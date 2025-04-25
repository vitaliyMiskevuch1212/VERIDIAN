import React, { useState } from 'react';
import { DataProvider } from '../context/DataContext';
import { UIProvider, useUI } from '../context/UIContext';
import DashboardHeader from '../layouts/DashboardHeader';
import DashboardLeftPanel from '../layouts/DashboardLeftPanel';
import DashboardCenter from '../layouts/DashboardCenter';
import DashboardRightPanel from '../layouts/DashboardRightPanel';
import DashboardOverlays from '../layouts/DashboardOverlays';

function CommandCenterLayout({ isInitialLoad, setIsInitialLoad }) {
  const { defconLevel } = useUI();
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: 'var(--defcon-bg-shift, var(--color-bg))', transition: 'background 1.5s ease' }}>
      <DashboardHeader />
      
      {/* MAIN 3-COLUMN COMMAND CENTER */}
      <div className="flex-1 relative overflow-hidden flex">
        <DashboardLeftPanel />
        <DashboardCenter />
        <DashboardRightPanel />
        <DashboardOverlays isInitialLoad={isInitialLoad} setIsInitialLoad={setIsInitialLoad} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  return (
    <DataProvider>
      <UIProvider>
        <CommandCenterLayout isInitialLoad={isInitialLoad} setIsInitialLoad={setIsInitialLoad} />
      </UIProvider>
    </DataProvider>
  );
}
