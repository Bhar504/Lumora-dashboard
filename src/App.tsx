import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import LumoraDashboard from './components/LumoraDashboard';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return user ? <LumoraDashboard /> : <Login />;
}

export default App;
