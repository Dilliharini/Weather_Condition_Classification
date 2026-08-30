import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HomeView } from '@/views/HomeView';
import { PredictView } from '@/views/PredictView';
import { ModelInfoView } from '@/views/ModelInfoView';
import { ResultsView } from '@/views/ResultsView';
import { ExplainView } from '@/views/ExplainView';
import type { View } from '@/types/navigation';

function App() {
  const [view, setView] = useState<View>('home');

  const handleNavigate = (next: View) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <Navbar current={view} onNavigate={handleNavigate} />
      <main className="flex-1">
        {view === 'home' && <HomeView onNavigate={handleNavigate} />}
        {view === 'predict' && <PredictView />}
        {view === 'model' && <ModelInfoView />}
        {view === 'results' && <ResultsView />}
        {view === 'explain' && <ExplainView />}
      </main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
