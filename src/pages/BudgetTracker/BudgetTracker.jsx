import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, Plus, HelpCircle } from 'lucide-react';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const categories = ['Income', 'Expense', 'Investment', 'Other', 'Settlement'];

const categoryColors = {
  Income: 'from-green-600 to-green-800',
  Expense: 'from-red-600 to-red-800',
  Investment: 'from-blue-600 to-blue-800',
  Other: 'from-yellow-600 to-yellow-800',
  Settlement: 'from-purple-600 to-purple-800',
  Balance: 'from-teal-600 to-teal-800',
};

const rowBgColors = {
  Income: 'bg-green-900/20',
  Expense: 'bg-red-900/20',
  Investment: 'bg-blue-900/20',
  Other: 'bg-yellow-900/20',
  Settlement: 'bg-purple-900/20',
};

const categoryColorsAmount = {
  Income: 'text-green-400',
  Expense: 'text-red-400',
  Settlement: 'text-purple-400',
  Investment: 'text-blue-400',
  Other: 'text-yellow-400',
};

const BudgetTracker = () => {
  const [data, setData] = useState([]);
  const [cards, setCards] = useState([]);
  const [newEntry, setNewEntry] = useState({
    acName: '',
    category: '',
    type: '',
    status: 'Not started',
    actual: 0,
    budget: 0,
    transactionDate: '',
    modeOfPayment: '',
    platform: '',
    creditCard: '',
  });
  const [db, setDb] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [sort, setSort] = useState({ column: '', direction: 'asc' });
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const yearOptions = [];
  for (let y = 2020; y <= 2030; y++) {
    yearOptions.push(y);
  }

  useEffect(() => {
    const request = indexedDB.open('ExpenseGridDB', 1);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      database.createObjectStore('creditCards', { keyPath: 'id', autoIncrement: true });
      database.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
    };

    request.onsuccess = (event) => {
      const database = event.target.result;
      setDb(database);
      loadData(database);
      loadCards(database);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.errorCode);
    };
  }, []);

  const loadData = (database) => {
    const transaction = database.transaction(['transactions'], 'readonly');
    const store = transaction.objectStore('transactions');
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = () => {
      setData(getAllRequest.result);
    };
  };

  const loadCards = (database) => {
    const transaction = database.transaction(['creditCards'], 'readonly');
    const store = transaction.objectStore('creditCards');
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = () => {
      setCards(getAllRequest.result);
    };
  };

  const saveData = (database, items) => {
    const transaction = database.transaction(['transactions'], 'readwrite');
    const store = transaction.objectStore('transactions');
    store.clear();
    items.forEach((item) => store.add(item));
  };

  const handleSaveEntry = () => {
    let updatedData;
    const newItem = {
      ...newEntry,
      actual: parseFloat(newEntry.actual),
      budget: parseFloat(newEntry.budget),
      id: editingId || Date.now(),
      isCreditCardTransaction: !!newEntry.creditCard && newEntry.category !== 'Settlement',
    };
    if (editingId) {
      updatedData = data.map((item) =>
        item.id === editingId ? newItem : item
      );
    } else {
      updatedData = [...data, newItem];
    }
    setData(updatedData);
    if (db) saveData(db, updatedData);
    resetForm();
    setIsOpen(false);
  };

  const handleDelete = (id) => {
    const updatedData = data.filter((item) => item.id !== id);
    setData(updatedData);
    if (db) saveData(db, updatedData);
  };

  const handleEdit = (item) => {
    setNewEntry(item);
    setEditingId(item.id);
    setIsOpen(true);
  };

  const resetForm = () => {
    setNewEntry({
      acName: '',
      category: '',
      type: '',
      status: 'Not started',
      actual: 0,
      budget: 0,
      transactionDate: '',
      modeOfPayment: '',
      platform: '',
      creditCard: '',
    });
    setEditingId(null);
  };

  const selectedMonthData = data.filter((item) => {
    const date = new Date(item.transactionDate);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  });

  const categoryTotals = categories.reduce((acc, cat) => {
    acc[cat] = selectedMonthData
      .filter((item) => item.category === cat)
      .reduce((sum, item) => sum + item.actual, 0);
    return acc;
  }, {});

  const remainingBalance = categoryTotals.Income - (
    categoryTotals.Expense +
    categoryTotals.Investment +
    categoryTotals.Other
  );

  const filteredData = selectedMonthData.filter((item) => {
    return (
      (filterCategory ? item.category === filterCategory : true) &&
      (filterStatus ? item.status === filterStatus : true) &&
      (filterSearch ? item.acName.toLowerCase().includes(filterSearch.toLowerCase()) : true)
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sort.column) return 0;
    let valA = a[sort.column];
    let valB = b[sort.column];
    if (sort.column === 'transactionDate') {
      valA = new Date(valA);
      valB = new Date(valB);
    }
    if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (column) => {
    const direction = sort.column === column && sort.direction === 'asc' ? 'desc' : 'asc';
    setSort({ column, direction });
  };

  const getStatusVariant = (status) => {
    if (status === 'Done') return 'success';
    if (status === 'In progress') return 'warning';
    return 'secondary';
  };

  const handleFilterCategoryChange = (value) => {
    setFilterCategory(value === 'all' ? '' : value);
  };

  const handleFilterStatusChange = (value) => {
    setFilterStatus(value === 'all' ? '' : value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h1 className="text-2xl font-bold tracking-tight">
          Budget Dashboard - {monthNames[selectedMonth]} {selectedYear}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 transition-all duration-300">
                <Plus className="mr-2 h-4 w-4" /> Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl">{editingId ? 'Edit Entry' : 'Add New Entry'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Account Name</label>
                  <Input
                    placeholder="Account Name"
                    value={newEntry.acName}
                    onChange={(e) => setNewEntry({ ...newEntry, acName: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Category</label>
                  <Select onValueChange={(value) => setNewEntry({ ...newEntry, category: value })} value={newEntry.category}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 text-white">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Type</label>
                  <Select onValueChange={(value) => setNewEntry({ ...newEntry, type: value })} value={newEntry.type}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 text-white">
                      {['Income', 'Investments', 'Bills', 'Medical', 'Miscellaneous', 'Settlement', 'Others', 'Commute', 'Food', 'Loan', 'Insurance', 'Mutual Fund', 'Utility', 'Cash', 'Social', 'Donation', 'Transfer', 'Friend', 'Wellness', 'Loans'].map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Status</label>
                  <Select onValueChange={(value) => setNewEntry({ ...newEntry, status: value })} value={newEntry.status}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 text-white">
                      {['Not started', 'In progress', 'Done'].map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Actual Amount</label>
                  <Input
                    type="number"
                    placeholder="Actual Amount"
                    value={newEntry.actual}
                    onChange={(e) => setNewEntry({ ...newEntry, actual: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Budget Amount</label>
                  <Input
                    type="number"
                    placeholder="Budget Amount"
                    value={newEntry.budget}
                    onChange={(e) => setNewEntry({ ...newEntry, budget: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Transaction Date</label>
                  <Input
                    type="date"
                    value={newEntry.transactionDate}
                    onChange={(e) => setNewEntry({ ...newEntry, transactionDate: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Mode of Payment</label>
                  <Select onValueChange={(value) => setNewEntry({ ...newEntry, modeOfPayment: value })} value={newEntry.modeOfPayment}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Mode of Payment" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 text-white">
                      {['NEFT', 'UPI', 'Bank Transfer', 'Cheque', 'ATM Withdrawal', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking'].map((mode) => (
                        <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Platform</label>
                  <Select onValueChange={(value) => setNewEntry({ ...newEntry, platform: value })} value={newEntry.platform}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 text-white">
                      {['Phonepe', 'Google Pay', 'CRED', 'Kotak Mahindra Ba.', 'Slice', 'Groww', 'Zerodha', 'Amazon Pay', 'Cash'].map((platform) => (
                        <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Credit Card (If)</label>
                  <Select onValueChange={(value) => setNewEntry({ ...newEntry, creditCard: value === 'none' ? '' : value })} value={newEntry.creditCard || 'none'}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Credit Card (If)" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 text-white">
                      <SelectItem value="none">None</SelectItem>
                      {cards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveEntry} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 transition-all duration-300">
                {editingId ? 'Update Entry' : 'Add Entry'}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto">
        {/* Filters and Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Select onValueChange={setSelectedMonth} value={selectedMonth}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600 text-white">
              {monthNames.map((month, index) => (
                <SelectItem key={index} value={index}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setSelectedYear} value={selectedYear}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600 text-white">
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={handleFilterCategoryChange} value={filterCategory || 'all'}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600 text-white">
              {['all', ...categories].map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={handleFilterStatusChange} value={filterStatus || 'all'}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600 text-white">
              {['all', 'Not started', 'In progress', 'Done'].map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Bar */}
        <Input
          placeholder="Search by Transaction Name"
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Card
              key={cat}
              className={`bg-gradient-to-r ${categoryColors[cat]} text-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300`}
            >
              <CardHeader>
                <CardTitle className="text-lg">Total {cat}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">₹{Math.abs(categoryTotals[cat]).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
          <Card
            className={`bg-gradient-to-r ${categoryColors.Balance} text-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300`}
          >
            <CardHeader>
              <CardTitle className="text-lg">Remaining Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${remainingBalance >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                ₹{Math.abs(remainingBalance).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="flex-1 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-900">
              <TableRow>
                {['acName', 'category', 'type', 'status', 'actual', 'budget', 'transactionDate', 'modeOfPayment', 'platform', 'creditCard'].map((col) => (
                  <TableHead
                    key={col}
                    className="text-gray-300 hover:text-white cursor-pointer transition-colors duration-200"
                    onClick={() => handleSort(col)}
                  >
                    {col === 'acName' ? 'Transaction Name' :
                      col === 'transactionDate' ? 'Date' :
                      col === 'modeOfPayment' ? 'Payment Mode' :
                      col === 'creditCard' ? 'Credit Card' :
                      col.charAt(0).toUpperCase() + col.slice(1)}
                    {sort.column === col && (sort.direction === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item) => (
                <TableRow
                  key={item.id}
                  className={`hover:bg-gray-700/50 transition-colors duration-200 ${rowBgColors[item.category]}`}
                >
                  <TableCell>{item.acName}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(item.status)}
                      className={`${item.status === 'Done' ? 'bg-green-700' :
                        item.status === 'In progress' ? 'bg-yellow-600' :
                        'bg-gray-700'
                      } text-white`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={categoryColorsAmount[item.category] || "text-gray-400"}>
                    ₹{Math.abs(item.actual).toLocaleString()}
                  </TableCell>
                  <TableCell>₹{item.budget.toLocaleString()}</TableCell>
                  <TableCell>{item.transactionDate}</TableCell>
                  <TableCell>{item.modeOfPayment}</TableCell>
                  <TableCell>{item.platform}</TableCell>
                  <TableCell>{cards.find(card => card.id === item.creditCard)?.name || 'None'}</TableCell>
                  <TableCell className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default BudgetTracker;