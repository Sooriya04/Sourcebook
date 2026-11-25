import React from 'react';

export default function WorkspaceLayout({ children }) {
  return (
    <div className="workspace-container">
      <main className="workspace-main">
        {children}
      </main>
    </div>
  );
}
