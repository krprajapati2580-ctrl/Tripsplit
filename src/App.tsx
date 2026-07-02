import React, { useState, useEffect } from "react";
import { User, Expense, PastTrip } from "./types";
import { calculateBalances } from "./utils";
import { KOTLIN_CODE_BLOCKS } from "./kotlinCode";
import { DashboardScreen, BalancesScreen, AddExpenseScreen } from "./components/Screens";
import { SidebarDrawer } from "./components/SidebarDrawer";
import { SetupWizardScreen } from "./components/SetupWizardScreen";
import { AuthScreen } from "./components/AuthScreen";
import { ContactPickerModal } from "./components/ContactPickerModal";
import { SettingsScreen } from "./components/SettingsScreen";
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
  AlertCircle,
  Sun,
  Moon,
  MoreVertical,
  Mail,
  X,
  Pencil,
  Save,
  DollarSign,
  Download,
  Map,
  Settings
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
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("tripsplit_users");
    try {
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch (e) {
      return INITIAL_USERS;
    }
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem("tripsplit_expenses");
    try {
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch (e) {
      return INITIAL_EXPENSES;
    }
  });
  const [tripName, setTripName] = useState(() => {
    return localStorage.getItem("tripsplit_tripName") || "Goa Adventure";
  });
  const [simScreen, setSimScreen] = useState<"dashboard" | "balances" | "addExpense" | "setupWizard" | "settings">("dashboard");
  const [theme, setTheme] = useState<"light" | "dark">((() => {
    return (localStorage.getItem("tripsplit_theme") as "light" | "dark") || "light";
  }) as any);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [newFriendName, setNewFriendName] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState(() => {
    return localStorage.getItem("tripsplit_currency") || "₹";
  });
  const [friendLimitError, setFriendLimitError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Authentication State
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("tripsplit_is_auth") === "true";
  });
  const [profileMobile, setProfileMobile] = useState(() => {
    return localStorage.getItem("tripsplit_profileMobile") || "9876543210";
  });
  const [isMainContactPickerOpen, setIsMainContactPickerOpen] = useState(false);
  const [googleSheetsWebhookUrl, setGoogleSheetsWebhookUrl] = useState(() => {
    return localStorage.getItem("tripsplit_sheets_webhook_url") || "";
  });

  // Sidebar and Custom Profile State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileName, setProfileName] = useState(() => {
    return localStorage.getItem("tripsplit_profileName") || "K.R. Prajapati";
  });
  const [profileEmail, setProfileEmail] = useState(() => {
    return localStorage.getItem("tripsplit_profileEmail") || "krprajapati.2580@gmail.com";
  });
  const [profileBio, setProfileBio] = useState(() => {
    return localStorage.getItem("tripsplit_profileBio") || "✈️ Splitting travel memories, not friendships.";
  });
  const [profileColor, setProfileColor] = useState(() => {
    return localStorage.getItem("tripsplit_profileColor") || "from-blue-600 to-indigo-700";
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tripBudget, setTripBudget] = useState(() => {
    const saved = localStorage.getItem("tripsplit_tripBudget");
    return saved ? Number(saved) : 35000;
  });
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudgetText, setTempBudgetText] = useState(() => {
    const saved = localStorage.getItem("tripsplit_tripBudget");
    return saved || "35000";
  });
  const [reportCopied, setReportCopied] = useState(false);

  // Past History States
  const [pastTrips, setPastTrips] = useState<PastTrip[]>(() => {
    const saved = localStorage.getItem("tripsplit_past_trips");
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [reviewedPastTrip, setReviewedPastTrip] = useState<PastTrip | null>(null);

  const [customGeminiApiKey, setCustomGeminiApiKey] = useState(() => {
    return localStorage.getItem("tripsplit_custom_gemini_api_key") || "";
  });

  // Sync state changes back to localStorage
  useEffect(() => {
    localStorage.setItem("tripsplit_custom_gemini_api_key", customGeminiApiKey);
  }, [customGeminiApiKey]);

  useEffect(() => {
    localStorage.setItem("tripsplit_past_trips", JSON.stringify(pastTrips));
  }, [pastTrips]);

  useEffect(() => {
    localStorage.setItem("tripsplit_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("tripsplit_expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("tripsplit_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("tripsplit_currency", currencySymbol);
  }, [currencySymbol]);

  useEffect(() => {
    localStorage.setItem("tripsplit_profileName", profileName);
  }, [profileName]);

  useEffect(() => {
    localStorage.setItem("tripsplit_profileEmail", profileEmail);
  }, [profileEmail]);

  useEffect(() => {
    localStorage.setItem("tripsplit_profileBio", profileBio);
  }, [profileBio]);

  useEffect(() => {
    localStorage.setItem("tripsplit_profileColor", profileColor);
  }, [profileColor]);

  useEffect(() => {
    localStorage.setItem("tripsplit_tripBudget", tripBudget.toString());
  }, [tripBudget]);

  useEffect(() => {
    localStorage.setItem("tripsplit_tripName", tripName);
  }, [tripName]);

  useEffect(() => {
    localStorage.setItem("tripsplit_is_auth", isUserAuthenticated.toString());
  }, [isUserAuthenticated]);

  useEffect(() => {
    localStorage.setItem("tripsplit_profileMobile", profileMobile);
  }, [profileMobile]);

  useEffect(() => {
    localStorage.setItem("tripsplit_sheets_webhook_url", googleSheetsWebhookUrl);
  }, [googleSheetsWebhookUrl]);

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

  // Helper for copying text reliably across devices and iframe setups
  const copyToClipboard = (text: string): Promise<void> => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
      return Promise.resolve();
    }
  };

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
      setFriendLimitError("This friend is already added to the trip!");
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

  const handleImportContact = (contactName: string) => {
    if (users.length >= MAX_PARTICIPANTS) {
      setFriendLimitError("Maximum limit of 7 friends reached for this trip.");
      return;
    }
    const name = contactName.trim().charAt(0).toUpperCase() + contactName.trim().slice(1);
    if (users.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
      setFriendLimitError("This friend is already added to the trip!");
      return;
    }
    const newUser: User = {
      id: String(Date.now()),
      name: name,
    };
    setUsers([...users, newUser]);
  };

  const logUserToGoogleSheet = async (name: string, email: string, mobile: string) => {
    try {
      await fetch("/api/log-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          mobile,
          customWebhookUrl: googleSheetsWebhookUrl,
        }),
      });
    } catch (error) {
      console.error("Failed to log user to Google Sheet:", error);
    }
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

  // Save current active trip to history list
  const handleSaveCurrentToHistory = () => {
    const newHistoryTrip: PastTrip = {
      id: `trip_${Date.now()}`,
      name: tripName || "Unnamed Trip",
      budget: tripBudget,
      currency: currencySymbol,
      users: users,
      expenses: expenses,
      createdAt: new Date().toISOString()
    };
    setPastTrips(prev => [newHistoryTrip, ...prev]);
  };

  // Archive automatically before replacing state
  const autoArchiveCurrentTrip = () => {
    if (expenses.length > 0 || (users.length > 0 && tripName !== "Goa Adventure")) {
      const activeArchive: PastTrip = {
        id: `trip_auto_${Date.now()}`,
        name: tripName || "Previous Trip",
        budget: tripBudget,
        currency: currencySymbol,
        users: users,
        expenses: expenses,
        createdAt: new Date().toISOString()
      };
      setPastTrips(prev => {
        if (prev.some(t => t.name === activeArchive.name && t.expenses.length === activeArchive.expenses.length && Math.abs(t.budget - activeArchive.budget) < 1)) {
          return prev;
        }
        return [activeArchive, ...prev];
      });
    }
  };

  // Load a past trip as active
  const handleLoadPastTrip = (trip: PastTrip) => {
    autoArchiveCurrentTrip();
    setUsers(trip.users);
    setExpenses(trip.expenses);
    setTripName(trip.name);
    setTripBudget(trip.budget);
    setTempBudgetText(trip.budget.toString());
    setCurrencySymbol(trip.currency);
    setSimScreen("dashboard");
    setReviewedPastTrip(null);
  };

  // Delete a past trip from history
  const handleDeletePastTrip = (id: string) => {
    setPastTrips(prev => prev.filter(t => t.id !== id));
    if (reviewedPastTrip?.id === id) {
      setReviewedPastTrip(null);
    }
  };

  // Setup Wizard Completion Handler
  const handleSetupComplete = (newTripName: string, budget: number, currency: string, friendNames: string[]) => {
    autoArchiveCurrentTrip(); // Save active trip first
    const newUsers: User[] = friendNames.map((name, idx) => ({
      id: (idx + 1).toString(),
      name: name
    }));
    
    setUsers(newUsers);
    setExpenses([]); // Clear demo expenses for a clean new trip experience
    setTripName(newTripName);
    setTripBudget(budget);
    setTempBudgetText(budget.toString());
    setCurrencySymbol(currency);
    setSimScreen("dashboard");
  };

  // Reset simulator to mock state
  const handleResetSimulator = () => {
    setShowResetConfirm(true);
  };

  // Confirm Reset Execution
  const executeResetSimulator = () => {
    autoArchiveCurrentTrip(); // Save active trip first
    setUsers(INITIAL_USERS);
    setExpenses(INITIAL_EXPENSES);
    setTripName("Goa Adventure");
    setTripBudget(35000);
    setTempBudgetText("35000");
    setCurrencySymbol("₹");
    setSimScreen("dashboard");
    setShowResetConfirm(false);
  };

  // Handle code copy to clipboard
  const handleCopyCode = (index: number, code: string) => {
    copyToClipboard(code).then(() => {
      setCopiedMap((prev) => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setCopiedMap((prev) => ({ ...prev, [index]: false }));
      }, 2000);
    });
  };

  // Budget stats & Report generator
  const totalTripExpenses = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
  const spentPercentage = Math.min(100, Math.round((totalTripExpenses / tripBudget) * 100));

  const generateTripReport = () => {
    let report = `=== TRIPSPLIT TRAVEL EXPENSE REPORT ===\n`;
    report += `Generated: ${new Date().toLocaleDateString()}\n`;
    report += `Total Trip Budget: ${currencySymbol}${tripBudget.toLocaleString()}\n`;
    report += `Total Expenses Logged: ${currencySymbol}${totalTripExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    report += `Number of Friends: ${users.length}\n\n`;
    report += `--- INDIVIDUAL STANDINGS ---\n`;
    const balances = calculateBalances(users, expenses);
    users.forEach(u => {
      const b = balances[u.id] || 0;
      if (b > 0.01) {
        report += `- ${u.name}: Owed ${currencySymbol}${b.toFixed(2)}\n`;
      } else if (b < -0.01) {
        report += `- ${u.name}: Owes ${currencySymbol}${Math.abs(b).toFixed(2)}\n`;
      } else {
        report += `- ${u.name}: Settled up\n`;
      }
    });
    report += `\nThank you for using TripSplit!`;
    return report;
  };

  const handleCopyReport = () => {
    const reportText = generateTripReport();
    copyToClipboard(reportText).then(() => {
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 2000);
    });
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-300 ${
      theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-[#f8fafc] text-slate-900"
    }`}>
      {/* Top Header Bar */}
      <header className={`border-b px-6 py-4 shadow-2xs sticky top-0 z-50 transition-colors duration-300 hidden lg:block ${
        theme === "dark" ? "bg-slate-900/90 border-slate-800/80 backdrop-blur-md" : "bg-white border-slate-200/80"
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Top-Left Three-Dot Menu Button to open sidebar */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                theme === "dark" 
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white" 
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="Open User Profile & Settings"
              id="top-left-three-dot-menu"
            >
              <MoreVertical size={18} />
            </button>

            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xs">
              <Smartphone className="animate-pulse" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-lg font-bold tracking-tight transition-colors ${theme === "dark" ? "text-white" : "text-slate-900"}`}>TripSplit</h1>
                <span className={`text-[10px] border px-2.5 py-0.5 rounded-full font-bold transition-colors ${
                  theme === "dark" ? "bg-blue-950/40 border-blue-900/50 text-blue-400" : "bg-blue-50 border-blue-100 text-blue-600"
                }`}>
                  Android Native Code + Web Sim
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 transition-colors ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                Full-stack Jetpack Compose + Material 3 Architecture & Split Engine Prototype
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Theme Picker */}
            <div className={`flex items-center gap-1 p-1 rounded-xl border transition-colors ${
              theme === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200/50"
            }`}>
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-white text-amber-500 shadow-2xs font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Light Theme"
              >
                <Sun size={14} />
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  theme === "dark"
                    ? "bg-slate-800 text-blue-400 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                title="Dark Theme"
              >
                <Moon size={14} />
              </button>
            </div>

            {/* Currency Dropdown */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${
              theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-350" : "bg-slate-50 border-slate-200/50 text-slate-500"
            }`}>
              <label htmlFor="currency-select" className="text-xs font-semibold">Currency:</label>
              <select
                id="currency-select"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className={`text-xs font-bold bg-transparent focus:outline-hidden cursor-pointer ${
                  theme === "dark" ? "text-slate-200" : "text-slate-700"
                }`}
              >
                <option value="₹" className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-950"}>INR (₹)</option>
                <option value="$" className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-950"}>USD ($)</option>
                <option value="€" className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-950"}>EUR (€)</option>
                <option value="£" className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-950"}>GBP (£)</option>
              </select>
            </div>

            <button
              onClick={() => setSimScreen("setupWizard")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              title="Start a fresh new trip"
              id="header-start-new-trip-btn"
            >
              <PlusCircle size={12} />
              <span>Start New Trip</span>
            </button>

            <button
              onClick={handleResetSimulator}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                theme === "dark" ? "text-slate-300 bg-slate-800 hover:bg-slate-700 border-slate-700" : "text-slate-600 bg-slate-100 hover:bg-slate-200/80 hover:text-slate-900 border-slate-200/40"
              }`}
              title="Reset data back to demo state"
            >
              <RotateCcw size={12} />
              <span>Reset Data</span>
            </button>

            <a
              href="https://developer.android.com/compose"
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                theme === "dark" ? "text-blue-400 bg-blue-950/30 border-blue-900/40 hover:bg-blue-950/50" : "text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100/70"
              }`}
            >
              <BookOpen size={12} />
              <span>Android Docs</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Split Interface */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-0 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6 items-stretch">
        
        {/* LEFT COLUMN: THE PHONE EMULATOR (4 cols on wide screen) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center justify-start w-full h-[100dvh] lg:h-auto">
          <div className="w-full text-center mb-3 hidden lg:block">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              📱 Live Android App Simulator
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Fully interactive! Test calculations in real-time
            </p>
          </div>

          {/* Interactive Connectivity Controller Widget */}
          <div className={`w-full max-w-[340px] mb-4 rounded-2xl p-3 border shadow-xs flex items-center justify-between transition-colors duration-300 hidden lg:flex ${
            theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-900"
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold">Device Connectivity</span>
                <span className={`text-[10px] font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
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
          <div className="relative w-full lg:max-w-[340px] h-[100dvh] lg:h-auto lg:aspect-[9/18.5] bg-slate-950 rounded-none lg:rounded-[48px] p-0 lg:p-3.5 shadow-none lg:shadow-2xl border-0 lg:border-4 border-slate-900 flex flex-col overflow-hidden">
            {/* Phone Speaker Cutout */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-center gap-2 hidden lg:flex">
              <div className="w-12 h-1 bg-slate-800 rounded-full" />
              <div className="w-2.5 h-2.5 bg-slate-950 rounded-full" />
            </div>

            {/* Simulated Phone Screen Container */}
            <div className={`relative flex-1 rounded-none lg:rounded-[32px] overflow-hidden flex flex-col shadow-none lg:shadow-inner select-none z-20 transition-colors duration-300 ${
              theme === "dark" ? "bg-slate-950" : "bg-white"
            }`}>
              
              {/* Live Simulated Screens Wrapper */}
              <div className="flex-1 overflow-hidden relative">
                {!isUserAuthenticated ? (
                  <AuthScreen
                    theme={theme}
                    onAuthenticate={(name, email, mobile) => {
                      setProfileName(name);
                      setProfileEmail(email);
                      setProfileMobile(mobile);
                      setIsUserAuthenticated(true);
                      setSimScreen("dashboard");
                      logUserToGoogleSheet(name, email, mobile);
                    }}
                  />
                ) : (
                  <>
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
                        theme={theme}
                        onOpenSidebar={() => setIsSidebarOpen(true)}
                        tripName={tripName}
                      />
                    )}

                    {simScreen === "balances" && (
                      <BalancesScreen
                        users={users}
                        expenses={expenses}
                        onNavigate={setSimScreen}
                        currencySymbol={currencySymbol}
                        theme={theme}
                        onOpenSidebar={() => setIsSidebarOpen(true)}
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
                        theme={theme}
                        customGeminiApiKey={customGeminiApiKey}
                      />
                    )}

                     {simScreen === "setupWizard" && (
                      <SetupWizardScreen
                        theme={theme}
                        onComplete={handleSetupComplete}
                        onCancel={() => setSimScreen("dashboard")}
                        canCancel={users.length > 0}
                      />
                    )}

                    {simScreen === "settings" && (
                      <SettingsScreen
                        theme={theme}
                        setTheme={setTheme}
                        onOpenSidebar={() => setIsSidebarOpen(true)}
                        customGeminiApiKey={customGeminiApiKey}
                        onCustomGeminiApiKeyChange={setCustomGeminiApiKey}
                        googleSheetsWebhookUrl={googleSheetsWebhookUrl}
                        onGoogleSheetsWebhookUrlChange={setGoogleSheetsWebhookUrl}
                        tripBudget={tripBudget}
                        setTripBudget={setTripBudget}
                        currencySymbol={currencySymbol}
                      />
                    )}
                  </>
                )}

                {/* 1.6. Reviewed Past Trip Overlay Details Modal */}
                <AnimatePresence>
                  {reviewedPastTrip && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex flex-col justify-end rounded-[32px]"
                    >
                      <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 220 }}
                        className={`w-full max-h-[90%] rounded-t-[24px] border-t flex flex-col overflow-hidden transition-colors duration-300 ${
                          theme === "dark" 
                            ? "bg-slate-900 border-slate-800 text-white" 
                            : "bg-white border-slate-200 text-slate-900"
                        }`}
                        id="reviewed-past-trip-modal"
                      >
                        {/* Header */}
                        <div className={`px-4 py-3 border-b flex justify-between items-center ${
                          theme === "dark" ? "border-slate-800 bg-slate-950/25" : "border-slate-100 bg-slate-50/50"
                        }`}>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] font-black uppercase tracking-widest text-blue-500">Review Past Trip 🗺️</span>
                            <h3 className="text-xs font-black truncate">{reviewedPastTrip.name}</h3>
                          </div>
                          <button
                            onClick={() => setReviewedPastTrip(null)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              theme === "dark" ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                            }`}
                          >
                            <X size={12} />
                          </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-left">
                          {/* Overview card */}
                          <div className={`p-3 rounded-xl border ${
                            theme === "dark" ? "bg-slate-950/40 border-slate-800" : "bg-slate-50/80 border-slate-200/60"
                          }`}>
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Trip Summary</span>
                              <span className="text-[8px] text-slate-400">
                                {new Date(reviewedPastTrip.createdAt).toLocaleDateString(undefined, {
                                  month: "short", day: "numeric", year: "numeric"
                                })}
                              </span>
                            </div>
                            
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <span className="text-[8px] text-slate-500 font-bold block">Budget Limit</span>
                                <span className="text-[11px] font-extrabold">{reviewedPastTrip.currency}{reviewedPastTrip.budget.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-500 font-bold block">Total Expenses</span>
                                <span className="text-[11px] font-extrabold">
                                  {reviewedPastTrip.currency}
                                  {reviewedPastTrip.expenses.reduce((sum, e) => sum + e.totalAmount, 0).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            {(() => {
                              const totalSpent = reviewedPastTrip.expenses.reduce((sum, e) => sum + e.totalAmount, 0);
                              const pct = Math.min(100, Math.round((totalSpent / reviewedPastTrip.budget) * 100));
                              return (
                                <div className="mt-2.5 space-y-1">
                                  <div className="flex justify-between text-[7.5px] font-bold text-slate-500">
                                    <span>Spent: {pct}%</span>
                                    <span>Remaining: {reviewedPastTrip.currency}{(reviewedPastTrip.budget - totalSpent).toLocaleString()}</span>
                                  </div>
                                  <div className="w-full h-1 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        totalSpent > reviewedPastTrip.budget ? "bg-red-500" : "bg-blue-500"
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Friends / Participants list */}
                          <div>
                            <h4 className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                              <Users size={10} className="text-blue-500" />
                              <span>Participants ({reviewedPastTrip.users.length})</span>
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {reviewedPastTrip.users.map((u) => (
                                <span 
                                  key={u.id}
                                  className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full border ${
                                    theme === "dark" 
                                      ? "bg-slate-950 border-slate-800 text-slate-300" 
                                      : "bg-slate-100 border-slate-200 text-slate-700"
                                  }`}
                                >
                                  {u.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Balances list */}
                          <div>
                            <h4 className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                              <DollarSign size={10} className="text-blue-500" />
                              <span>Settlement & Balances</span>
                            </h4>
                            {reviewedPastTrip.expenses.length === 0 ? (
                              <p className="text-[8.5px] italic text-slate-500 pl-1">No expenses recorded for this trip.</p>
                            ) : (
                              <div className={`p-2 rounded-xl border space-y-1 ${
                                theme === "dark" ? "bg-slate-950/20 border-slate-800" : "bg-slate-50/50 border-slate-200/50"
                              }`}>
                                {(() => {
                                  const balancesMap = calculateBalances(reviewedPastTrip.users, reviewedPastTrip.expenses);
                                  return reviewedPastTrip.users.map((u) => {
                                    const amount = balancesMap[u.id] || 0;
                                    return (
                                      <div key={u.id} className="flex justify-between items-center text-[8.5px]">
                                        <span className="font-extrabold text-slate-600 dark:text-slate-300">{u.name}</span>
                                        <span className={`font-mono font-bold ${
                                          amount > 0 
                                            ? "text-emerald-500" 
                                            : amount < 0 
                                              ? "text-rose-500" 
                                              : "text-slate-500"
                                        }`}>
                                          {amount > 0 ? "+" : ""}
                                          {reviewedPastTrip.currency}
                                          {amount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                        </span>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            )}
                          </div>

                          {/* Expenses list */}
                          <div>
                            <h4 className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                              <List size={10} className="text-blue-500" />
                              <span>Expenses Logged ({reviewedPastTrip.expenses.length})</span>
                            </h4>
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
                              {reviewedPastTrip.expenses.length === 0 ? (
                                <p className="text-[8.5px] italic text-slate-400 pl-1">No expenses logged.</p>
                              ) : (
                                reviewedPastTrip.expenses.map((e) => {
                                  const payer = reviewedPastTrip.users.find(u => u.id === e.payerId)?.name || "Unknown";
                                  return (
                                    <div 
                                      key={e.id}
                                      className={`p-1.5 rounded-lg border flex justify-between items-center text-[8px] ${
                                        theme === "dark" ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-150 shadow-3xs"
                                      }`}
                                    >
                                      <div className="min-w-0 flex-1 pr-2">
                                        <p className="font-extrabold truncate text-slate-700 dark:text-slate-200">{e.description}</p>
                                        <p className="text-[7.5px] text-slate-400">Paid by <span className="font-bold">{payer}</span></p>
                                      </div>
                                      <span className="font-bold font-mono shrink-0">
                                        {reviewedPastTrip.currency}{e.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                                      </span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Footer */}
                        <div className={`p-3 border-t flex gap-1.5 ${
                          theme === "dark" ? "border-slate-800 bg-slate-950/20" : "border-slate-150 bg-slate-50/50"
                        }`}>
                          <button
                            type="button"
                            onClick={() => handleLoadPastTrip(reviewedPastTrip)}
                            className="flex-1 py-1.5 text-[10px] font-black rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                          >
                            <Map size={10} />
                            <span>Restore Active</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewedPastTrip(null)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-colors cursor-pointer ${
                              theme === "dark" 
                                ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" 
                                : "bg-white border-slate-200 hover:bg-slate-100 text-slate-600"
                            }`}
                          >
                            Close
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Simulated FAB (Floating Action Button) */}
                {simScreen !== "addExpense" && simScreen !== "setupWizard" && simScreen !== "settings" && (
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
              {simScreen !== "addExpense" && simScreen !== "setupWizard" && (
                <div className={`border-t py-2.5 px-4 flex justify-around items-center text-xs z-40 transition-colors duration-300 ${
                  theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-100 text-slate-500"
                }`}>
                  <button
                    onClick={() => {
                      setEditingExpense(null);
                      setSimScreen("dashboard");
                    }}
                    className={`flex flex-col items-center gap-1 flex-1 py-1 relative cursor-pointer ${
                      simScreen === "dashboard" ? "text-blue-500 font-bold" : (theme === "dark" ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")
                    }`}
                    id="nav-btn-dashboard"
                  >
                    <AnimatePresence>
                      {simScreen === "dashboard" && (
                        <motion.span
                          layoutId="activeBottomNav"
                          className={`absolute inset-x-4 -top-1 bottom-0 rounded-full -z-10 border transition-colors ${
                            theme === "dark" ? "bg-blue-950/40 border-blue-900/40" : "bg-blue-50/75 border-blue-100/50"
                          }`}
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
                      simScreen === "balances" ? "text-blue-500 font-bold" : (theme === "dark" ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")
                    }`}
                    id="nav-btn-balances"
                  >
                    <AnimatePresence>
                      {simScreen === "balances" && (
                        <motion.span
                          layoutId="activeBottomNav"
                          className={`absolute inset-x-4 -top-1 bottom-0 rounded-full -z-10 border transition-colors ${
                            theme === "dark" ? "bg-blue-950/40 border-blue-900/40" : "bg-blue-50/75 border-blue-100/50"
                          }`}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                    <Users size={16} />
                    <span className="text-[10px] font-bold">Balances</span>
                  </button>
                </div>
              )}

              {/* Sidebar Navigation Drawer (Simulated internally to phone) */}
              <SidebarDrawer
                isSidebarOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                theme={theme}
                setTheme={setTheme}
                profileName={profileName}
                setProfileName={setProfileName}
                profileEmail={profileEmail}
                profileBio={profileBio}
                profileColor={profileColor}
                setProfileColor={setProfileColor}
                isEditingProfile={isEditingProfile}
                setIsEditingProfile={setIsEditingProfile}
                tripBudget={tripBudget}
                setTripBudget={setTripBudget}
                isEditingBudget={isEditingBudget}
                setIsEditingBudget={setIsEditingBudget}
                tempBudgetText={tempBudgetText}
                setTempBudgetText={setTempBudgetText}
                users={users}
                expenses={expenses}
                currencySymbol={currencySymbol}
                reportCopied={reportCopied}
                onCopyReport={handleCopyReport}
                onStartNewTrip={() => setSimScreen("setupWizard")}
                pastTrips={pastTrips}
                onReviewPastTrip={setReviewedPastTrip}
                onDeletePastTrip={handleDeletePastTrip}
                onSaveCurrentToHistory={handleSaveCurrentToHistory}
                profileMobile={profileMobile}
                onLogout={() => setIsUserAuthenticated(false)}
                onOpenSettings={() => setSimScreen("settings")}
              />

              {/* Physical gesture indicator pill at the bottom */}
              <div className={`pb-2.5 pt-1.5 flex justify-center items-center z-40 transition-colors duration-300 ${
                theme === "dark" ? "bg-slate-900" : "bg-white"
              }`}>
                <div className={`w-20 h-1 rounded-full ${theme === "dark" ? "bg-slate-800" : "bg-slate-200"}`} />
              </div>
            </div>
          </div>

          {/* Quick Friend Addition Tool panel (Below phone) */}
          <div className={`w-full max-w-[340px] mt-4 rounded-2xl p-4 shadow-2xs border transition-colors duration-300 hidden lg:block ${
            theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-150 text-slate-900"
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold flex items-center gap-1">
                <Users size={14} className="text-blue-500" />
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
                    ? "text-slate-500 cursor-not-allowed" 
                    : "text-blue-500 hover:underline"
                }`}
                id="toggle-add-friend-btn"
              >
                <PlusCircle size={13} />
                <span>Add Friend</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1 mt-2.5">
              {users.map((u) => (
                <span key={u.id} className={`text-[10px] border rounded-md px-2 py-0.5 font-bold transition-colors ${
                  theme === "dark" ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200/70 text-slate-700"
                }`}>
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
                className="mt-3 pt-3 border-t border-slate-100/10 space-y-2"
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
                        ? (theme === "dark" ? "bg-slate-850 border-slate-800 text-slate-600 cursor-not-allowed select-none" : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed select-none")
                        : (theme === "dark" ? "border-slate-800 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder-slate-600" : "border-slate-200 focus:border-blue-600 bg-white text-slate-950 placeholder-slate-400")
                    }`}
                    id="friend-input-name"
                  />
                  <button
                    type="submit"
                    disabled={users.length >= MAX_PARTICIPANTS}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                      users.length >= MAX_PARTICIPANTS 
                        ? (theme === "dark" ? "bg-slate-800 text-slate-600 border border-slate-750 cursor-not-allowed select-none" : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none")
                        : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    }`}
                    id="add-friend-submit"
                  >
                    Add
                  </button>
                </div>

                {users.length < MAX_PARTICIPANTS && (
                  <button
                    type="button"
                    onClick={() => setIsMainContactPickerOpen(true)}
                    className="w-full py-1.5 border border-dashed rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-blue-500/30 text-blue-500 hover:bg-blue-500/5 select-none"
                  >
                    <span>Import from contacts 📱</span>
                  </button>
                )}
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
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col hidden lg:flex">
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
      <footer className={`border-t py-6 px-6 mt-12 transition-colors duration-300 hidden lg:block ${
        theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-gray-200 text-gray-500"
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div>
            <p className={`font-bold transition-colors ${theme === "dark" ? "text-slate-300" : "text-gray-700"}`}>TripSplit - Smart Expense Splitter</p>
            <p className="mt-0.5">A modern offline-first utility to easily track and split travel group expenses.</p>
          </div>
          <div className={`flex items-center gap-4 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
            <span>Powered by React 18 & Vite</span>
            <span>•</span>
            <span>Google AI Studio Build</span>
          </div>
        </div>
      </footer>

      {/* Reset Confirmation Overlay Dialog */}
      <AnimatePresence>
        {showResetConfirm && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] select-none"
            id="reset-confirm-modal"
          >
            <div
              className={`rounded-3xl p-6 shadow-2xl border max-w-sm w-full transition-colors ${
                theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-900"
              }`}
            >
              <h3 className="font-extrabold text-base tracking-tight mb-2">Reset Trip Data?</h3>
              <p className={`text-xs leading-relaxed mb-5 ${theme === "dark" ? "text-slate-400" : "text-slate-550"}`}>
                This will revert all travel splits, members, budgets, and scanned receipts back to initial demo values. This action cannot be undone.
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    theme === "dark"
                      ? "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeResetSimulator}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Contact Picker Modal */}
      <ContactPickerModal
        isOpen={isMainContactPickerOpen}
        onClose={() => setIsMainContactPickerOpen(false)}
        onSelect={(contact) => {
          handleImportContact(contact.name);
          setIsMainContactPickerOpen(false);
        }}
        theme={theme}
      />
    </div>
  );
}
