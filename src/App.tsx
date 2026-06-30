import React, { useState, useEffect } from "react";
import { User, Expense } from "./types";
import { KOTLIN_CODE_BLOCKS } from "./kotlinCode";
import { DashboardScreen, BalancesScreen, AddExpenseScreen } from "./components/Screens";
import {
  Smartphone,
  Code,
  Copy,
  Check,
  RotateCcw,
  Plus,
  Users,
  Wifi,
  WifiOff,
  Battery,
  List,
  Sparkles,
  Award,
  BookOpen,
  PlusCircle,
  FileCode,
  Share2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Initial mock data
const INITIAL_USERS: User[] = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
  { id: "3", name: "Charlie" },
  { id: "4", name: "David" },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: "e1",
    description: "Gasoline for road trip",
    totalAmount: 60.00,
    payerId: "1", // Alice paid
    involvedUserIds: ["1", "2", "3", "4"], // split with all
  },
  {
    id: "e2",
    description: "Dinner & drinks",
    totalAmount: 120.00,
    payerId: "2", // Bob paid
    involvedUserIds: ["1", "2", "3"], // David skipped dinner
  },
  {
    id: "e3",
    description: "Park entrance tickets",
    totalAmount: 40.00,
    payerId: "3", // Charlie paid
    involvedUserIds: ["1", "2", "3", "4"], // split with all
  },
];

const MAX_PARTICIPANTS = 7;

export default function App() {
  // Simulator State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [simScreen, setSimScreen] = useState<"dashboard" | "balances" | "addExpense">("dashboard");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [newFriendName, setNewFriendName] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [friendLimitError, setFriendLimitError] = useState<string | null>(null);

  // Auto-dismiss the friendly snackbar after 4 seconds
  useEffect(() => {
    if (friendLimitError) {
      const timer = setTimeout(() => {
        setFriendLimitError(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [friendLimitError]);

  // Offline-First states
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Background Sync Engine (WorkManager simulation task)
  const triggerBackgroundSync = async () => {
    if (offlineQueue.length === 0 || isSyncing) return;
    setIsSyncing(true);

    // Process queued receipts sequentially
    const queueCopy = [...offlineQueue];
    for (const queuedReceipt of queueCopy) {
      try {
        const response = await fetch("/api/scan-receipt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageBase64: queuedReceipt.imageBase64,
            mimeType: queuedReceipt.mimeType,
          }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
          const rawItems = data.items || [];
          const mappedItems = rawItems.map((item: any) => ({
            name: item.name || "Item",
            price: Number(item.price) || 0,
            type: (item.type === "TAX" ? "TAX" : "FOOD"),
            splitUserIds: item.type === "FOOD" ? users.map((u) => u.id) : [], // Split equally by default
          }));

          const calculatedTotal = mappedItems.reduce((sum: number, item: any) => sum + item.price, 0);

          const newExpense: Expense = {
            id: `e${Date.now()}`,
            description: data.description || queuedReceipt.description || "Auto-Synced Receipt",
            totalAmount: calculatedTotal,
            payerId: users[0]?.id || "1", // Default payer Alice
            involvedUserIds: users.map((u) => u.id), // Split equally
            items: mappedItems,
          };

          setExpenses((prev) => [...prev, newExpense]);
          // Remove from local cache queue
          setOfflineQueue((prev) => prev.filter((q) => q.id !== queuedReceipt.id));
        } else {
          console.error("Failed background sync for receipt:", queuedReceipt.id, data.error);
        }
      } catch (err) {
        console.error("Error during WorkManager sync task:", err);
      }

      // 1.5s simulated network delay so user can observe the cool sync visual cues in real-time
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    setIsSyncing(false);
  };

  // Real-time listener that fires WorkManager task on connection restoration
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0 && !isSyncing) {
      triggerBackgroundSync();
    }
  }, [isOnline, offlineQueue, isSyncing]);

  const handleQueueOfflineReceipt = (metadata: any) => {
    setOfflineQueue((prev) => [...prev, metadata]);
  };

  const handleRemoveQueuedReceipt = (id: string) => {
    setOfflineQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Code Viewer State
  const [activeCodeIdx, setActiveCodeIdx] = useState(1); // Default to ViewModel
  const [copiedMap, setCopiedMap] = useState<Record<number, boolean>>({});

  // OS Status Bar Clock
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // Generate a beautiful Android-styled clock (e.g. 09:41)
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  // Add new friend in the simulator
  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;

    if (users.length >= MAX_PARTICIPANTS) {
      setFriendLimitError("Maximum limit of 7 friends reached for this trip.");
      return;
    }

    // Capitalize first letter
    const name = newFriendName.trim().charAt(0).toUpperCase() + newFriendName.trim().slice(1);
    
    // Check duplicate
    if (users.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
      alert("This friend is already added to the trip!");
      return;
    }

    const newUser: User = {
      id: String(users.length + 1),
      name: name,
    };

    setUsers([...users, newUser]);
    setNewFriendName("");
    setShowAddFriend(false);
  };

  // Add/Update Expense in the simulator
  const handleAddExpense = (description: string, totalAmount: number, payerId: string, involvedUserIds: string[], id?: string, items?: any[]) => {
    if (id) {
      // Edit mode: Overwrite existing expense record
      setExpenses(
        expenses.map((exp) =>
          exp.id === id
            ? { ...exp, description, totalAmount, payerId, involvedUserIds, items }
            : exp
        )
      );
      setEditingExpense(null);
    } else {
      // Add mode: Create new expense record
      const newExpense: Expense = {
        id: `e${Date.now()}`,
        description,
        totalAmount,
        payerId,
        involvedUserIds,
        items,
      };
      setExpenses([...expenses, newExpense]);
    }
  };

  // Delete Expense in the simulator
  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((exp) => exp.id !== id));
  };

  // Reset simulator to mock state
  const handleResetSimulator = () => {
    if (window.confirm("Reset trip state back to initial mock values?")) {
      setUsers(INITIAL_USERS);
      setExpenses(INITIAL_EXPENSES);
      setSimScreen("dashboard");
    }
  };

  // Handle code copy to clipboard
  const handleCopyCode = (index: number, code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedMap((prev) => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setCopiedMap((prev) => ({ ...prev, [index]: false }));
      }, 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 shadow-2xs sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xs">
              <Smartphone className="animate-pulse" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">TripSplit</h1>
                <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-600 px-2.5 py-0.5 rounded-full font-bold">
                  Android Native Code + Web Sim
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Full-stack Jetpack Compose + Material 3 Architecture & Split Engine Prototype
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Currency Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/50">
              <label htmlFor="currency-select" className="text-xs font-semibold text-slate-500">Currency:</label>
              <select
                id="currency-select"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent focus:outline-hidden cursor-pointer"
              >
                <option value="₹">INR (₹)</option>
                <option value="$">USD ($)</option>
                <option value="€">EUR (€)</option>
                <option value="£">GBP (£)</option>
              </select>
            </div>

            <button
              onClick={handleResetSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/80 hover:text-slate-900 rounded-lg transition-all cursor-pointer border border-slate-200/40"
              title="Reset data back to demo state"
            >
              <RotateCcw size={12} />
              <span>Reset Data</span>
            </button>

            <a
              href="https://developer.android.com/compose"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100/70 transition-all"
            >
              <BookOpen size={12} />
              <span>Android Docs</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Split Interface */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: THE PHONE EMULATOR (4 cols on wide screen) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center justify-start">
          <div className="w-full text-center mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              📱 Live Android App Simulator
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Fully interactive! Test calculations in real-time
            </p>
          </div>

          {/* Interactive Connectivity Controller Widget */}
          <div className="w-full max-w-[340px] mb-4 bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800">Device Connectivity</span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {isOnline ? "5G Active (Gemini Cloud Extraction)" : "Device Offline (Room Cache Enabled)"}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setIsOnline(!isOnline)}
              id="connectivity-toggle"
              className={`px-3 py-1 text-[10px] font-extrabold rounded-lg border uppercase tracking-wider transition-all cursor-pointer ${
                isOnline 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                  : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              }`}
            >
              {isOnline ? "Go Offline" : "Go Online"}
            </button>
          </div>

          {/* Physical Phone Frame */}
          <div className="relative w-full max-w-[340px] aspect-[9/18.5] bg-slate-950 rounded-[48px] p-3.5 shadow-2xl border-4 border-slate-900 flex flex-col overflow-hidden">
            {/* Phone Speaker Cutout */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-center gap-2">
              <div className="w-12 h-1 bg-slate-800 rounded-full" />
              <div className="w-2.5 h-2.5 bg-slate-950 rounded-full" />
            </div>

            {/* Simulated Phone Screen Container */}
            <div className="relative flex-1 bg-white rounded-[32px] overflow-hidden flex flex-col shadow-inner select-none z-20">
              
              {/* Phone Status Bar */}
              <div className={`px-5 pt-3 pb-1 flex justify-between items-center text-[10px] font-bold z-40 select-none border-b transition-colors duration-300 ${
                isOnline 
                  ? "bg-slate-50 text-slate-600 border-slate-100" 
                  : "bg-red-50 text-red-700 border-red-100"
              }`}>
                <span>{currentTime || "10:00 AM"}</span>
                <div className="flex items-center gap-1.5">
                  {isOnline ? (
                    <>
                      <Wifi size={10} className="text-emerald-600" />
                      <span className="text-[9px] text-slate-500">5G</span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={10} className="text-red-500" />
                      <span className="text-[8px] font-black uppercase bg-red-100 text-red-700 px-1 rounded">Offline</span>
                    </>
                  )}
                  <Battery size={12} className="text-slate-500" />
                </div>
              </div>

              {/* Live Simulated Screens Wrapper */}
              <div className="flex-1 overflow-hidden relative">
                {simScreen === "dashboard" && (
                  <DashboardScreen
                    users={users}
                    expenses={expenses}
                    onDeleteExpense={handleDeleteExpense}
                    onNavigate={setSimScreen}
                    currencySymbol={currencySymbol}
                    onStartEdit={(expense) => {
                      setEditingExpense(expense);
                      setSimScreen("addExpense");
                    }}
                    isOnline={isOnline}
                    offlineQueue={offlineQueue}
                    onRemoveQueuedReceipt={handleRemoveQueuedReceipt}
                    isSyncing={isSyncing}
                  />
                )}

                {simScreen === "balances" && (
                  <BalancesScreen
                    users={users}
                    expenses={expenses}
                    onNavigate={setSimScreen}
                    currencySymbol={currencySymbol}
                  />
                )}

                {simScreen === "addExpense" && (
                  <AddExpenseScreen
                    users={users}
                    expenses={expenses}
                    onAddExpense={handleAddExpense}
                    onNavigate={(screen) => {
                      if (screen === "dashboard") {
                        setEditingExpense(null);
                      }
                      setSimScreen(screen);
                    }}
                    currencySymbol={currencySymbol}
                    editingExpense={editingExpense}
                    isOnline={isOnline}
                    onQueueOfflineReceipt={handleQueueOfflineReceipt}
                  />
                )}

                {/* Simulated FAB (Floating Action Button) */}
                {simScreen !== "addExpense" && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setEditingExpense(null);
                      setSimScreen("addExpense");
                    }}
                    className="absolute bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors z-40 cursor-pointer"
                    id="phone-fab-add"
                  >
                    <Plus size={22} />
                  </motion.button>
                )}
              </div>

              {/* Simulated Jetpack Compose Bottom Navigation Bar */}
              {simScreen !== "addExpense" && (
                <div className="bg-white border-t border-slate-100 py-2.5 px-4 flex justify-around items-center text-xs text-slate-500 z-40">
                  <button
                    onClick={() => {
                      setEditingExpense(null);
                      setSimScreen("dashboard");
                    }}
                    className={`flex flex-col items-center gap-1 flex-1 py-1 relative cursor-pointer ${
                      simScreen === "dashboard" ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-600"
                    }`}
                    id="nav-btn-dashboard"
                  >
                    <AnimatePresence>
                      {simScreen === "dashboard" && (
                        <motion.span
                          layoutId="activeBottomNav"
                          className="absolute inset-x-4 -top-1 bottom-0 bg-blue-50/75 rounded-full -z-10 border border-blue-100/50"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                    <List size={16} />
                    <span className="text-[10px] font-bold">Expenses</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingExpense(null);
                      setSimScreen("balances");
                    }}
                    className={`flex flex-col items-center gap-1 flex-1 py-1 relative cursor-pointer ${
                      simScreen === "balances" ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-600"
                    }`}
                    id="nav-btn-balances"
                  >
                    <AnimatePresence>
                      {simScreen === "balances" && (
                        <motion.span
                          layoutId="activeBottomNav"
                          className="absolute inset-x-4 -top-1 bottom-0 bg-blue-50/75 rounded-full -z-10 border border-blue-100/50"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                    <Users size={16} />
                    <span className="text-[10px] font-bold">Balances</span>
                  </button>
                </div>
              )}

              {/* Physical gesture indicator pill at the bottom */}
              <div className="bg-white pb-2.5 pt-1.5 flex justify-center items-center z-40">
                <div className="w-20 h-1 bg-slate-200 rounded-full" />
              </div>
            </div>
          </div>

          {/* Quick Friend Addition Tool panel (Below phone) */}
          <div className="w-full max-w-[340px] mt-4 bg-white rounded-2xl p-4 shadow-2xs border border-slate-150">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Users size={14} className="text-blue-600" />
                Trip Participants ({users.length})
              </span>
              <button
                onClick={() => {
                  if (users.length >= MAX_PARTICIPANTS) {
                    setFriendLimitError("Maximum limit of 7 friends reached for this trip.");
                  } else {
                    setShowAddFriend(!showAddFriend);
                  }
                }}
                className={`text-xs font-bold flex items-center gap-0.5 transition-colors cursor-pointer ${
                  users.length >= MAX_PARTICIPANTS 
                    ? "text-slate-400" 
                    : "text-blue-600 hover:underline"
                }`}
                id="toggle-add-friend-btn"
              >
                <PlusCircle size={13} />
                <span>Add Friend</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1 mt-2.5">
              {users.map((u) => (
                <span key={u.id} className="text-[10px] bg-slate-50 border border-slate-200/70 rounded-md px-2 py-0.5 font-bold text-slate-700">
                  {u.name}
                </span>
              ))}
            </div>

            {(showAddFriend || users.length >= MAX_PARTICIPANTS) && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddFriend}
                className="mt-3 pt-3 border-t border-slate-100"
              >
                <div 
                  className="flex gap-2 relative"
                  onClickCapture={(e) => {
                    if (users.length >= MAX_PARTICIPANTS) {
                      e.preventDefault();
                      e.stopPropagation();
                      setFriendLimitError("Maximum limit of 7 friends reached for this trip.");
                    }
                  }}
                >
                  <input
                    type="text"
                    required={users.length < MAX_PARTICIPANTS}
                    disabled={users.length >= MAX_PARTICIPANTS}
                    placeholder={users.length >= MAX_PARTICIPANTS ? "Limit reached (7 friends)" : "Friend's Name"}
                    value={newFriendName}
                    onChange={(e) => setNewFriendName(e.target.value)}
                    className={`flex-1 text-xs border rounded-lg px-2.5 py-1.5 focus:outline-hidden transition-all ${
                      users.length >= MAX_PARTICIPANTS 
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed select-none" 
                        : "border-slate-200 focus:border-blue-600 bg-white text-slate-950 placeholder-slate-400"
                    }`}
                    id="friend-input-name"
                  />
                  <button
                    type="submit"
                    disabled={users.length >= MAX_PARTICIPANTS}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                      users.length >= MAX_PARTICIPANTS 
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none" 
                        : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    }`}
                    id="add-friend-submit"
                  >
                    Add
                  </button>
                </div>
              </motion.form>
            )}

            {/* Warning Message Snackbar-like inline message */}
            <AnimatePresence>
              {friendLimitError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="mt-3 p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-700 text-[11px] leading-relaxed overflow-hidden"
                >
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold">{friendLimitError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFriendLimitError(null)}
                    className="text-red-400 hover:text-red-600 font-bold ml-1 text-sm focus:outline-hidden cursor-pointer"
                  >
                    ×
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT COLUMN: KOTLIN IDE SOURCE VIEWER (8 cols on wide screen) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <div className="mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              💻 Complete Kotlin & Jetpack Compose Source Code
            </span>
            <p className="text-xs text-gray-400 mt-1">
              Organized package architecture conforming to Material Design 3 and Android guidelines
            </p>
          </div>

          <div className="bg-[#1e1e1e] rounded-2xl shadow-xl flex-1 flex flex-col overflow-hidden border border-[#2d2d2d] min-h-[500px]">
            {/* Header Tabs */}
            <div className="bg-[#252526] border-b border-[#2d2d2d] flex items-center justify-between px-4 py-1.5 overflow-x-auto gap-2">
              <div className="flex items-center gap-1.5">
                <FileCode className="text-[#3b82f6]" size={16} />
                <span className="text-xs text-gray-400 font-semibold font-mono">TripSplit Architecture</span>
              </div>
              <div className="text-[10px] text-gray-500 font-mono hidden sm:block">
                src/main/java/com/example/tripsplit/
              </div>
            </div>

            {/* Horizontal Tabs List */}
            <div className="bg-[#1e1e1e] border-b border-[#2d2d2d] flex overflow-x-auto shrink-0 scrollbar-thin">
              {KOTLIN_CODE_BLOCKS.map((item, index) => {
                const isActive = activeCodeIdx === index;
                return (
                  <button
                    key={index}
                    onClick={() => setActiveCodeIdx(index)}
                    className={`px-4 py-3 text-xs font-mono border-r border-[#2d2d2d] transition-all flex items-center gap-2 shrink-0 select-none cursor-pointer ${
                      isActive
                        ? "bg-[#1e1e1e] text-white border-t-2 border-t-[#3b82f6] font-bold"
                        : "bg-[#2d2d2d]/30 text-gray-400 hover:bg-[#2d2d2d]/60 hover:text-gray-200"
                    }`}
                    id={`code-tab-${index}`}
                  >
                    <span className="text-[#3b82f6] text-[10px]">&lt;&gt;</span>
                    <span>{item.filename.split("/").pop()}</span>
                  </button>
                );
              })}
            </div>

            {/* File Info and Copy Button */}
            <div className="bg-[#252526] px-4 py-3 flex items-center justify-between gap-4 border-b border-[#2d2d2d] shrink-0 text-xs">
              <div className="text-gray-300">
                <span className="font-semibold text-gray-400 font-mono">
                  {KOTLIN_CODE_BLOCKS[activeCodeIdx].filename}:
                </span>{" "}
                <span className="text-gray-400">
                  {KOTLIN_CODE_BLOCKS[activeCodeIdx].description}
                </span>
              </div>

              <button
                onClick={() =>
                  handleCopyCode(activeCodeIdx, KOTLIN_CODE_BLOCKS[activeCodeIdx].code)
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2d2d2d] text-white rounded-md text-xs font-bold hover:bg-[#3d3d3d] active:scale-95 transition-all select-none cursor-pointer shrink-0"
                id={`copy-btn-${activeCodeIdx}`}
              >
                {copiedMap[activeCodeIdx] ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Content Block */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed text-gray-300 bg-[#1e1e1e]">
              <pre className="whitespace-pre overflow-x-auto text-xs sm:text-sm">
                <code>
                  {KOTLIN_CODE_BLOCKS[activeCodeIdx].code
                    .split("\n")
                    .map((line, idx) => (
                      <div key={idx} className="table-row">
                        <span className="table-cell text-right pr-4 text-gray-600 select-none text-[10px] text-right w-8">
                          {idx + 1}
                        </span>
                        <span className="table-cell">{line || " "}</span>
                      </div>
                    ))}
                </code>
              </pre>
            </div>
          </div>
        </div>

      </main>

      {/* Footer information section */}
      <footer className="bg-white border-t border-gray-200 py-6 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div>
            <p className="font-bold text-gray-700">TripSplit Android Expense Manager Architecture</p>
            <p className="mt-0.5">Designed according to clean MVVM boundaries, state-hoisting, and Material 3 design systems.</p>
          </div>
          <div className="flex items-center gap-4">
            <span>Powered by React 19 & Jetpack Compose 1.6</span>
            <span>•</span>
            <span>Google AI Studio Build</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
