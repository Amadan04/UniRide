import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import Routes from './router/Routes';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : (
        <BrowserRouter>
          <Routes />
        </BrowserRouter>
      )}
    </>
  );
}

export default App;
