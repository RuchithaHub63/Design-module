import React from 'react';
import Board from './components/Board';

export default function Page() {
  return (
   <main className="min-h-screen bg-gray-50 dark:bg-white p-8">
  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-900 mb-6">Stage Board</h1>
  <Board />
    </main>
  );
}
