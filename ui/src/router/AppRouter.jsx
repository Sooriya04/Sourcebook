import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import HomePage from '../pages/HomePage';
import NotebookPage from '../pages/NotebookPage';
import { useNotebooks } from '../hooks/useNotebooks';

export default function AppRouter() {
  const { notebooks, createNotebook, deleteNotebook, getNotebook, updateNotebook } = useNotebooks();

  return (
    <AppShell onNewNotebook={() => {}}>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              notebooks={notebooks}
              onCreateNotebook={createNotebook}
              onDeleteNotebook={deleteNotebook}
            />
          }
        />
        <Route
          path="/notebook/:id"
          element={
            <NotebookPage
              getNotebook={getNotebook}
              updateNotebook={updateNotebook}
            />
          }
        />
      </Routes>
    </AppShell>
  );
}
