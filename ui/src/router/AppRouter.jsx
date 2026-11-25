import React, { Suspense, lazy, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Spinner from '../components/ui/Spinner';
import { useNotebooks } from '../hooks/useNotebooks';

const HomePage = lazy(() => import('../pages/HomePage'));
const NotebookPage = lazy(() => import('../pages/NotebookPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const YouTubeChatPage = lazy(() => import('../pages/ytchat/YouTubeChatPage'));

export default function AppRouter() {
  const { notebooks, createNotebook, deleteNotebook, getNotebook, updateNotebook } = useNotebooks();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);

  return (
    <AppShell
      notebooks={notebooks}
      onNewNotebook={() => setIsCreateModalOpen(true)}
      onOpenYouTube={() => setIsYouTubeModalOpen(true)}
      onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
    >
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-[#131314]"><Spinner size="lg" /></div>}>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                notebooks={notebooks}
                onCreateNotebook={createNotebook}
                onDeleteNotebook={deleteNotebook}
                isMobileSidebarOpen={isMobileSidebarOpen}
                setIsMobileSidebarOpen={setIsMobileSidebarOpen}
                isCreateModalOpen={isCreateModalOpen}
                setIsCreateModalOpen={setIsCreateModalOpen}
                isYouTubeModalOpen={isYouTubeModalOpen}
                setIsYouTubeModalOpen={setIsYouTubeModalOpen}
              />
            }
          />
          <Route
            path="/notebook/:id"
            element={
              <NotebookPage
                getNotebook={getNotebook}
                updateNotebook={updateNotebook}
                createNotebook={createNotebook}
              />
            }
          />
          <Route
            path="/settings"
            element={<SettingsPage />}
          />
          <Route
            path="/youtube/:videoId"
            element={<YouTubeChatPage />}
          />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
