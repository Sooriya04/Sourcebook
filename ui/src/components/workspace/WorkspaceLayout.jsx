import React, { useState } from 'react';
import WorkspaceSidebar from './WorkspaceSidebar';

export default function WorkspaceLayout({
  notebooks = [],
  activeView = 'all',
  onSelectView,
  archivedIds = [],
  onNewNotebook,
  onOpenYouTube,
  isMobileSidebarOpen = false,
  onCloseMobileSidebar,
  children
}) {
  return (
    <div className="workspace-container">
      {/* Persistent Desktop & Mobile Drawer Sidebar */}
      <WorkspaceSidebar
        notebooks={notebooks}
        activeView={activeView}
        onSelectView={onSelectView}
        archivedIds={archivedIds}
        onNewNotebook={onNewNotebook}
        onOpenYouTube={onOpenYouTube}
        isOpen={isMobileSidebarOpen}
        onClose={onCloseMobileSidebar}
      />

      {/* Main Research Workspace Content */}
      <main className="workspace-main">
        {children}
      </main>
    </div>
  );
}
