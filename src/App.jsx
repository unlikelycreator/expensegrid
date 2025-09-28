import React, { useState, useEffect } from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from "@/components/ui/sonner";
import AppRoutes from "./routes";
import './index.css';
import { TooltipProvider } from "@/components/ui/tooltip";
import { HashRouter as Router, useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'; 
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else { 
      root.classList.remove('dark'); 
    }
    // Global mobile overflow fix
    document.body.style.overflowX = 'hidden';
  }, [theme]);

  return (
    <div className="app min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
      <TooltipProvider>
        <Toaster />
        <ToastContainer 
          position="bottom-right" 
          autoClose={3000} 
          hideProgressBar={false} 
          newestOnTop={false} 
          closeOnClick 
          rtl={false} 
          pauseOnFocusLoss 
          draggable 
          pauseOnHover={false} 
          theme={theme} 
        />
        <AppRoutes />
      </TooltipProvider>
    </div>
  );
}

const WrappedApp = () => (
  <Router>
    <App />
  </Router>
);

export default WrappedApp;