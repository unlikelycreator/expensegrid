import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Menu, X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import Logo from '../../assets/logo.png';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [db, setDb] = useState(null);
  const [storageInfo, setStorageInfo] = useState({ quota: null, usage: null, error: null });
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const fileInputRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    // Initialize IndexedDB
    const request = indexedDB.open('MoneyMeshDB', 1);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      database.createObjectStore('creditCards', { keyPath: 'id', autoIncrement: true });
      database.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
    };

    request.onsuccess = (event) => {
      setDb(event.target.result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.errorCode);
    };

    // Fetch storage estimate
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        setStorageInfo({
          quota: (estimate.quota / (1024 * 1024)).toFixed(2), // Convert bytes to MB
          usage: (estimate.usage / (1024 * 1024)).toFixed(2), // Convert bytes to MB
          error: null
        });
      }).catch(err => {
        setStorageInfo({
          quota: null,
          usage: null,
          error: 'Unable to retrieve storage information'
        });
        console.error('Storage estimate error:', err);
      });
    } else {
      setStorageInfo({
        quota: null,
        usage: null,
        error: 'Storage estimate not supported in this browser'
      });
    }
  }, []);

  const exportToExcel = () => {
    if (!db) return;
    const transaction = db.transaction(['creditCards', 'transactions'], 'readonly');
    const cardStore = transaction.objectStore('creditCards');
    const transStore = transaction.objectStore('transactions');

    Promise.all([
      new Promise(resolve => {
        cardStore.getAll().onsuccess = (event) => resolve(event.target.result);
      }),
      new Promise(resolve => {
        transStore.getAll().onsuccess = (event) => resolve(event.target.result);
      })
    ]).then(([cards, transactions]) => {
      const wsCards = XLSX.utils.json_to_sheet(cards);
      const wsTrans = XLSX.utils.json_to_sheet(transactions.map(t => ({
        ...t,
        creditCard: cards.find(c => c.id === t.creditCard)?.name || t.creditCard || 'None'
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsCards, 'CreditCards');
      XLSX.utils.book_append_sheet(wb, wsTrans, 'Transactions');
      XLSX.writeFile(wb, `MoneyMesh_data_${new Date().toISOString().slice(0,10)}.xlsx`);
    });
  };

  const exportToJson = () => {
    if (!db) return;
    const transaction = db.transaction(['creditCards', 'transactions'], 'readonly');
    const cardStore = transaction.objectStore('creditCards');
    const transStore = transaction.objectStore('transactions');

    Promise.all([
      new Promise(resolve => {
        cardStore.getAll().onsuccess = (event) => resolve(event.target.result);
      }),
      new Promise(resolve => {
        transStore.getAll().onsuccess = (event) => resolve(event.target.result);
      })
    ]).then(([cards, transactions]) => {
      const dataToExport = { cards, transactions };
      const json = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MoneyMesh_data.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file && db) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          const newCards = importedData.cards.map((card, index) => ({
            ...card,
            id: Date.now() + index,
          }));
          const newTransactions = importedData.transactions.map((trans, index) => ({
            ...trans,
            id: Date.now() + newCards.length + index,
            creditCard: newCards.find((c) => c.name === trans.cardName)?.id || trans.creditCard || '',
          }));

          const transaction = db.transaction(['creditCards', 'transactions'], 'readwrite');
          const cardStore = transaction.objectStore('creditCards');
          const transStore = transaction.objectStore('transactions');

          cardStore.clear();
          newCards.forEach((item) => cardStore.add(item));
          transStore.clear();
          newTransactions.forEach((item) => transStore.add(item));
        } catch (err) {
          console.error('Invalid JSON', err);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-4 fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="flex items-center gap-5 text-2xl font-bold tracking-tight">
            <img src={Logo} className='h-10'/> MoneyMesh
          </h1>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex space-x-4">
              <NavLink
                to="/home/budget-tracker"
                className={({ isActive }) =>
                  `text-gray-300 hover:text-white transition-colors duration-200 ${
                    isActive ? 'text-blue-400 font-semibold' : ''
                  }`
                }
              >
                Budget Tracker
              </NavLink>
              <NavLink
                to="/home/credit-tracker"
                className={({ isActive }) =>
                  `text-gray-300 hover:text-white transition-colors duration-200 ${
                    isActive ? 'text-blue-400 font-semibold' : ''
                  }`
                }
              >
                Credit Cards
              </NavLink>
            </nav>
            <div className="hidden md:flex gap-2">
              <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 transition-all duration-300">
                Export to Excel
              </Button>
              <Button onClick={exportToJson} className="bg-purple-600 hover:bg-purple-700 transition-all duration-300">
                Export JSON
              </Button>
              <Button onClick={() => fileInputRef.current.click()} className="bg-indigo-600 hover:bg-indigo-700 transition-all duration-300">
                Import JSON
              </Button>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImport}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-300 hover:text-white"
              onClick={toggleMenu}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 flex flex-col space-y-2">
            <NavLink
              to="/home/budget-tracker"
              className={({ isActive }) =>
                `text-gray-300 hover:text-white transition-colors duration-200 p-2 rounded ${
                  isActive ? 'bg-blue-600/20 text-blue-400 font-semibold' : ''
                }`
              }
              onClick={toggleMenu}
            >
              Budget Tracker
            </NavLink>
            <NavLink
              to="/home/credit-tracker"
              className={({ isActive }) =>
                `text-gray-300 hover:text-white transition-colors duration-200 p-2 rounded ${
                  isActive ? 'bg-blue-600/20 text-blue-400 font-semibold' : ''
                }`
              }
              onClick={toggleMenu}
            >
              Credit Cards
            </NavLink>
            <div className="flex flex-col gap-2 p-2">
              <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 transition-all duration-300">
                Export to Excel
              </Button>
              <Button onClick={exportToJson} className="bg-purple-600 hover:bg-purple-700 transition-all duration-300">
                Export JSON
              </Button>
              <Button onClick={() => fileInputRef.current.click()} className="bg-indigo-600 hover:bg-indigo-700 transition-all duration-300">
                Import JSON
              </Button>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImport}
              />
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20 pb-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 p-4 fixed bottom-0 left-0 right-0 z-50">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <p className="text-sm text-gray-400">All rights reserved © 2025 MoneyMesh</p>
            <div className="flex gap-4">
              <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="text-gray-300 hover:text-white">
                    <HelpCircle className="mr-2 h-4 w-4" /> Help
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Help & FAQs</DialogTitle>
                  </DialogHeader>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Using MoneyMesh</h3>
                    <p className="text-sm mb-4">MoneyMesh helps you track your budget and credit card transactions using two main dashboards: Budget Tracker and Credit Cards.</p>
                    <h4 className="text-md font-semibold mb-2">Budget Tracker</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm mb-4">
                      <li>Select a month and year to view transactions for that period.</li>
                      <li>Add entries with details like name, category (e.g., Income, Expense, Settlement), amount, and optional credit card.</li>
                      <li>Filter transactions by category, status, or search by name.</li>
                      <li>View total Income, Expense, Investment, Other, and Settlement amounts, along with the remaining balance.</li>
                    </ol>
                    <h4 className="text-md font-semibold mb-2">Credit Cards</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm mb-4">
                      <li>Add credit cards with a name, number, color, and settlement day (e.g., 13th of every month).</li>
                      <li>Add transactions with a name, amount, card, category (Expense or Bill), and date. Bills are recorded as Settlements.</li>
                      <li>Filter by card to view transactions within its billing cycle (e.g., 13th to 13th of the next month).</li>
                      <li>View total spent per card, accounting for Expenses minus Settlements.</li>
                    </ol>
                    <h4 className="text-md font-semibold mb-2">Data Management</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li>Export all data to Excel or JSON using the header buttons.</li>
                      <li>Import data from a JSON file to restore cards and transactions.</li>
                      <li>All data is stored locally in your browser using IndexedDB.</li>
                    </ul>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isPolicyOpen} onOpenChange={setIsPolicyOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="text-gray-300 hover:text-white">
                    Privacy Policy
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Privacy Policy</DialogTitle>
                  </DialogHeader>
                  <div className="p-4 text-sm space-y-4">
                    <p>MoneyMesh stores all your data locally in your browser using IndexedDB. This includes credit card details and transaction records entered in the Budget Tracker and Credit Cards dashboards.</p>
                    <p>No data is transmitted to any external servers or third parties. Your information remains private and secure on your device.</p>
                    <p>When exporting data to Excel or JSON, the files are generated locally and saved to your device. Importing JSON files will overwrite existing data in the app.</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            {storageInfo.error ? (
              storageInfo.error
            ) : storageInfo.quota && storageInfo.usage ? (
              `Storage: ${(storageInfo.quota - storageInfo.usage).toFixed(2)} MB available of ${storageInfo.quota} MB total`
            ) : (
              'Fetching storage information...'
            )}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;