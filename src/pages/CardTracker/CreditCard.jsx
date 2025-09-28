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
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Edit, Plus, CreditCard as CreditCardIcon, HelpCircle } from 'lucide-react';

const bgColorOptions = [
  { value: 'bg-red-500', label: 'Red' },
  { value: 'bg-blue-500', label: 'Blue' },
  { value: 'bg-green-500', label: 'Green' },
  { value: 'bg-purple-500', label: 'Purple' },
  { value: 'bg-yellow-500', label: 'Yellow' },
  { value: 'bg-indigo-500', label: 'Indigo' },
  { value: 'bg-pink-500', label: 'Pink' },
  { value: 'bg-teal-500', label: 'Teal' },
];

const CreditCards = () => {
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [newCard, setNewCard] = useState({ name: '', number: '', bgColor: '', settlementDay: '' });
  const [newTransaction, setNewTransaction] = useState({ name: '', actual: 0, cardId: '', category: 'Expense', date: '' });
  const [db, setDb] = useState(null);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [filterCard, setFilterCard] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [sort, setSort] = useState({ column: '', direction: 'asc' });

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
      loadCards(database);
      loadTransactions(database);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.errorCode);
    };
  }, []);

  const loadCards = (database) => {
    const transaction = database.transaction(['creditCards'], 'readonly');
    const store = transaction.objectStore('creditCards');
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = () => {
      setCards(getAllRequest.result);
    };
  };

  const loadTransactions = (database) => {
    const transaction = database.transaction(['transactions'], 'readonly');
    const store = transaction.objectStore('transactions');
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = () => {
      setTransactions(getAllRequest.result.filter(item => item.isCreditCardTransaction));
    };
  };

  const saveCards = (database, items) => {
    const transaction = database.transaction(['creditCards'], 'readwrite');
    const store = transaction.objectStore('creditCards');
    store.clear();
    items.forEach((item) => store.add(item));
  };

  const saveTransactions = (database, items) => {
    const transaction = database.transaction(['transactions'], 'readwrite');
    const store = transaction.objectStore('transactions');
    store.clear();
    items.forEach((item) => store.add(item));
  };

  const handleSaveCard = () => {
    let updatedCards;
    if (editingCardId) {
      updatedCards = cards.map((card) =>
        card.id === editingCardId ? { ...newCard, id: editingCardId } : card
      );
    } else {
      updatedCards = [...cards, { ...newCard, id: Date.now() }];
    }
    setCards(updatedCards);
    if (db) saveCards(db, updatedCards);
    resetCardForm();
    setIsCardOpen(false);
  };

  const handleDeleteCard = (id) => {
    const updatedCards = cards.filter((card) => card.id !== id);
    const updatedTransactions = transactions.filter((trans) => trans.cardId !== id);
    setCards(updatedCards);
    setTransactions(updatedTransactions);
    if (db) {
      saveCards(db, updatedCards);
      saveTransactions(db, [...updatedTransactions, ...transactions.filter(item => !item.isCreditCardTransaction)]);
    }
  };

  const handleEditCard = (card) => {
    setNewCard(card);
    setEditingCardId(card.id);
    setIsCardOpen(true);
  };

  const resetCardForm = () => {
    setNewCard({ name: '', number: '', bgColor: '', settlementDay: '' });
    setEditingCardId(null);
  };

  const handleSaveTransaction = () => {
    let updatedTransactions;
    const actual = parseFloat(newTransaction.actual);
    const category = newTransaction.category === 'Bill' ? 'Settlement' : newTransaction.category;
    const newItem = {
      ...newTransaction,
      actual,
      id: editingTransactionId || Date.now(),
      isCreditCardTransaction: true,
      category,
      acName: newTransaction.name,
      transactionDate: newTransaction.date,
      creditCard: newTransaction.cardId,
      status: 'Done',
      budget: 0,
      modeOfPayment: 'Credit Card',
      platform: cards.find(card => card.id === newTransaction.cardId)?.name || '',
      type: category
    };
    if (editingTransactionId) {
      updatedTransactions = transactions.map((trans) =>
        trans.id === editingTransactionId ? newItem : trans
      );
    } else {
      updatedTransactions = [...transactions, newItem];
    }
    setTransactions(updatedTransactions);
    if (db) saveTransactions(db, [...updatedTransactions, ...transactions.filter(item => !item.isCreditCardTransaction)]);
    resetTransactionForm();
    setIsTransactionOpen(false);
  };

  const handleDeleteTransaction = (id) => {
    const updatedTransactions = transactions.filter((trans) => trans.id !== id);
    setTransactions(updatedTransactions);
    if (db) saveTransactions(db, [...updatedTransactions, ...transactions.filter(item => !item.isCreditCardTransaction)]);
  };

  const handleEditTransaction = (trans) => {
    setNewTransaction({
      name: trans.acName,
      actual: trans.actual,
      cardId: trans.creditCard,
      category: trans.category === 'Settlement' ? 'Bill' : trans.category,
      date: trans.transactionDate
    });
    setEditingTransactionId(trans.id);
    setIsTransactionOpen(true);
  };

  const resetTransactionForm = () => {
    setNewTransaction({ name: '', actual: 0, cardId: '', category: 'Expense', date: '' });
    setEditingTransactionId(null);
  };

  const getBillingCycleDates = (settlementDay) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    let startDate, endDate;

    const day = parseInt(settlementDay);
    if (isNaN(day) || day < 1 || day > 31) {
      return { startDate: null, endDate: null, periodText: 'Invalid settlement day' };
    }

    if (today.getDate() >= day) {
      startDate = new Date(currentYear, currentMonth, day);
      endDate = new Date(currentYear, currentMonth + 1, day);
    } else {
      startDate = new Date(currentYear, currentMonth - 1, day);
      endDate = new Date(currentYear, currentMonth, day);
    }

    const formatDate = (date) => {
      const options = { day: 'numeric', month: 'short', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    };

    const periodText = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    return { startDate, endDate, periodText };
  };

  const selectedCardData = filterCard
    ? transactions.filter((item) => {
        if (item.creditCard !== filterCard) return false;
        const card = cards.find((c) => c.id === filterCard);
        if (!card || !card.settlementDay) return false;
        const { startDate, endDate } = getBillingCycleDates(card.settlementDay);
        if (!startDate || !endDate) return false;
        const transDate = new Date(item.transactionDate);
        return transDate >= startDate && transDate < endDate;
      })
    : transactions;

  const cardTotals = cards.reduce((acc, card) => {
    const cardTrans = selectedCardData.filter((trans) => trans.creditCard === card.id);
    const expenses = cardTrans
      .filter((trans) => trans.category === 'Expense')
      .reduce((sum, trans) => sum + trans.actual, 0);
    const bills = cardTrans
      .filter((trans) => trans.category === 'Settlement')
      .reduce((sum, trans) => sum + trans.actual, 0);
    acc[card.id] = expenses - bills;
    return acc;
  }, {});

  const filteredData = selectedCardData.filter((item) => {
    return (
      (filterCategory ? item.category === (filterCategory === 'Bill' ? 'Settlement' : filterCategory) : true) &&
      (filterSearch ? item.acName.toLowerCase().includes(filterSearch.toLowerCase()) : true)
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sort.column) return 0;
    let valA = a[sort.column === 'name' ? 'acName' : sort.column === 'cardId' ? 'creditCard' : sort.column === 'date' ? 'transactionDate' : sort.column === 'actual' ? 'actual' : sort.column];
    let valB = b[sort.column === 'name' ? 'acName' : sort.column === 'cardId' ? 'creditCard' : sort.column === 'date' ? 'transactionDate' : sort.column === 'actual' ? 'actual' : sort.column];
    if (sort.column === 'date') {
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

  const handleFilterCategoryChange = (value) => {
    setFilterCategory(value === 'all' ? '' : value);
  };

  const selectedCard = cards.find((card) => card.id === filterCard);
  const billingPeriod = selectedCard ? getBillingCycleDates(selectedCard.settlementDay).periodText : 'All Cards';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h1 className="text-2xl font-bold tracking-tight">
          Credit Cards Dashboard - {selectedCard ? `${selectedCard.name} (${billingPeriod})` : 'All Cards'}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isCardOpen} onOpenChange={setIsCardOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 transition-all duration-300">
                <Plus className="mr-2 h-4 w-4" /> Add Credit Card
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl">{editingCardId ? 'Edit Credit Card' : 'Add New Credit Card'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 p-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Card Name</label>
                  <Input
                    placeholder="Card Name"
                    value={newCard.name}
                    onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Card Number</label>
                  <Input
                    placeholder="Card Number"
                    value={newCard.number}
                    onChange={(e) => setNewCard({ ...newCard, number: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Background Color</label>
                  <Select onValueChange={(value) => setNewCard({ ...newCard, bgColor: value })} value={newCard.bgColor}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select Color" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 text-white">
                      {bgColorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Settlement Day</label>
                  <Select onValueChange={(value) => setNewCard({ ...newCard, settlementDay: value })} value={newCard.settlementDay}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select Settlement Day" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 text-white">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>{`${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of Month`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveCard} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 transition-all duration-300">
                {editingCardId ? 'Update Card' : 'Add Card'}
              </Button>
            </DialogContent>
          </Dialog>
          <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 transition-all duration-300">
                <Plus className="mr-2 h-4 w-4" /> Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl">{editingTransactionId ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 p-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Transaction Name</label>
                  <Input
                    placeholder="Transaction Name"
                    value={newTransaction.name}
                    onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Actual Amount</label>
                  <Input
                    type="number"
                    placeholder="Actual Amount"
                    value={newTransaction.actual}
                    onChange={(e) => setNewTransaction({ ...newTransaction, actual: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Credit Card</label>
                  <Select onValueChange={(value) => setNewTransaction({ ...newTransaction, cardId: value })} value={newTransaction.cardId}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select Card" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 text-white">
                      {cards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Category</label>
                  <Select onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })} value={newTransaction.category}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 text-white">
                      <SelectItem value="Expense">Expense</SelectItem>
                      <SelectItem value="Bill">Bill</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Date</label>
                  <Input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                  />
                </div>
              </div>
              <Button onClick={handleSaveTransaction} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 transition-all duration-300">
                {editingTransactionId ? 'Update Transaction' : 'Add Transaction'}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            placeholder="Search by Transaction Name"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
          />
          <Select onValueChange={(value) => setFilterCard(value === 'all' ? '' : value)} value={filterCard || 'all'}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Filter by Card" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600 text-white">
              <SelectItem value="all">All Cards</SelectItem>
              {cards.map((card) => (
                <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={handleFilterCategoryChange} value={filterCategory || 'all'}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600 text-white">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Expense">Expense</SelectItem>
              <SelectItem value="Bill">Bill</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Credit Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Card key={card.id} className={`${card.bgColor} text-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 relative`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <CreditCardIcon className="h-8 w-8" />
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditCard(card)}
                      className="text-white hover:bg-white/20"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCard(card.id)}
                      className="text-white hover:bg-white/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="text-xl font-bold mt-4">{card.name}</h3>
                <p className="text-sm opacity-80">{card.number}</p>
                <p className="text-sm mt-2">Settlement Day: {card.settlementDay}{card.settlementDay === '1' ? 'st' : card.settlementDay === '2' ? 'nd' : card.settlementDay === '3' ? 'rd' : 'th'} of Month</p>
                <p className="text-lg font-semibold mt-4">Total Spent: ₹{Math.abs(cardTotals[card.id] || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Transactions Table */}
        <div className="flex-1 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-900">
              <TableRow>
                {['name', 'actual', 'cardId', 'category', 'date'].map((col) => (
                  <TableHead
                    key={col}
                    className="text-gray-300 hover:text-white cursor-pointer transition-colors duration-200"
                    onClick={() => handleSort(col)}
                  >
                    {col === 'name' ? 'Transaction Name' :
                     col === 'actual' ? 'Actual Amount' :
                     col === 'cardId' ? 'Card' :
                     col.charAt(0).toUpperCase() + col.slice(1)}
                    {sort.column === col && (sort.direction === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-700/50 transition-colors duration-200">
                  <TableCell>{item.acName}</TableCell>
                  <TableCell className={item.category === 'Expense' ? 'text-red-400' : 'text-green-400'}>
                    ₹{Math.abs(item.actual).toLocaleString()} {item.category === 'Settlement' ? '(Paid)' : ''}
                  </TableCell>
                  <TableCell>{cards.find((card) => card.id === item.creditCard)?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge className={item.category === 'Expense' ? 'bg-red-500' : 'bg-green-500'}>{item.category}</Badge>
                  </TableCell>
                  <TableCell>{item.transactionDate}</TableCell>
                  <TableCell className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditTransaction(item)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTransaction(item.id)}
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

export default CreditCards;