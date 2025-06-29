
import React from 'react';
import ModularFigmaStepsGenerator from '@/components/code-generator/ModularFigmaStepsGenerator';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <ModularFigmaStepsGenerator />
      </div>
    </ErrorBoundary>
  );
}

export default App;
