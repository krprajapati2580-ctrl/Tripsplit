import React, { useState, useRef, useEffect } from "react";
import { User, Expense, Debt } from "../types";
import { calculateBalances, calculateSimplifiedDebts, formatCurrency } from "../utils";
import { Plus, List, ArrowLeft, Users, DollarSign, Check, Trash2, CheckCircle, HelpCircle, Camera, Lock, Pencil, MoreVertical, Upload } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TripSplitLogo } from "./TripSplitLogo";

interface ScreenProps {
  users: User[];
  expenses: Expense[];
  onAddExpense?: (description: string, totalAmount: number, payerId: string, involvedUserIds: string[], id?: string, items?: any[]) => void;
  onDeleteExpense?: (id: string) => void;
  onNavigate?: (screen: "dashboard" | "balances" | "addExpense") => void;
  currencySymbol?: string;
  editingExpense?: Expense | null;
  onStartEdit?: (expense: Expense) => void;
  isOnline?: boolean;
  offlineQueue?: any[];
  onQueueOfflineReceipt?: (metadata: any) => void;
  onRemoveQueuedReceipt?: (id: string) => void;
  isSyncing?: boolean;
  theme?: "light" | "dark";
  onOpenSidebar?: () => void;
  tripName?: string;
  customGeminiApiKey?: string;
}

// ---------------------------------------------------------
// DASHBOARD SCREEN
// ---------------------------------------------------------
export function DashboardScreen({
  expenses,
  users,
  onDeleteExpense,
  onNavigate,
  currencySymbol = "₹",
  onStartEdit,
  isOnline,
  offlineQueue,
  onRemoveQueuedReceipt,
  isSyncing,
  theme = "light",
  onOpenSidebar,
  tripName,
}: ScreenProps) {
  const isDark = theme === "dark";

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${isDark ? "bg-slate-950 text-slate-100" : "bg-[#f8fafc] text-slate-900"}`}>
      {/* Android Top Header bar */}
      <div className={`px-3 pt-3.5 pb-3.5 rounded-b-2xl shadow-2xs border-b flex items-center justify-between transition-colors duration-300 ${
        isDark ? "bg-slate-900 text-white border-slate-800" : "bg-slate-50 text-slate-900 border-slate-200/60"
      }`}>
        <div className="flex items-center gap-2">
          {onOpenSidebar && (
            <button
              type="button"
              onClick={onOpenSidebar}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-150 text-slate-700"
              }`}
              title="Open Profile Drawer"
              id="phone-header-sidebar-trigger"
            >
              <MoreVertical size={18} />
            </button>
          )}
          <TripSplitLogo size={24} className="shrink-0" />
          <div>
            <h1 className={`text-sm font-black font-sans tracking-tight truncate max-w-[120px] ${isDark ? "text-white" : "text-slate-900"}`}>
              {tripName || "Trip Expenses"}
            </h1>
            <p className={`text-[9px] font-sans mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {expenses.length} expense{expenses.length !== 1 && "s"} total
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
          isDark 
            ? "bg-blue-950/55 border border-blue-900 text-blue-400" 
            : "bg-blue-50 border border-blue-100 text-blue-600"
        }`}>
          <Users size={12} />
          <span>{users.length} Friends</span>
        </div>
      </div>

      {/* Expense List container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {/* Offline Room Cache Queue (WorkManager simulation) */}
        {offlineQueue && offlineQueue.length > 0 && (
          <div className={`rounded-2xl p-4 space-y-3 mb-2 shadow-2xs border transition-colors duration-300 ${
            isDark ? "bg-amber-950/25 border-amber-900/30 text-amber-200" : "bg-amber-50/70 border-amber-200/60"
          }`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-1.5 font-bold text-xs ${isDark ? "text-amber-300" : "text-amber-800"}`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>Room DB Queue ({offlineQueue.length})</span>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                isDark ? "bg-amber-900/40 text-amber-300" : "bg-amber-100 text-amber-700"
              }`}>
                WorkManager Sync
              </span>
            </div>
            
            <p className={`text-[10px] leading-relaxed font-medium ${isDark ? "text-amber-200/80" : "text-amber-700/80"}`}>
              {isOnline 
                ? "⚡ Network restored! WorkManager background task is silently syncing queued items..." 
                : "⏳ Device is offline. Receipts are securely cached in local Room DB and will sync silently on connection."}
            </p>
            
            <div className="space-y-2">
              {offlineQueue.map((item) => (
                <div key={item.id} className={`border rounded-xl p-3 flex justify-between items-center text-xs shadow-3xs transition-colors duration-300 ${
                  isDark ? "bg-slate-900 border-amber-950/30 text-slate-200" : "bg-white border-amber-100"
                }`}>
                  <div className="min-w-0 flex-1 pr-2">
                    <div className={`font-bold text-[11px] ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                      <span className="truncate">{item.fileName}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-[9px] font-mono mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      <span>Saved at {item.timestamp}</span>
                      <span>•</span>
                      <span>{item.description}</span>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex items-center gap-2">
                    {isOnline ? (
                      <div className="flex items-center gap-1 text-blue-500 text-[9px] font-bold">
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span>Syncing...</span>
                      </div>
                    ) : (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                      }`}>
                        Cached
                      </span>
                    )}
                    
                    {onRemoveQueuedReceipt && (
                      <button
                        onClick={() => onRemoveQueuedReceipt(item.id)}
                        className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                          isDark ? "text-slate-600 hover:text-red-400 hover:bg-slate-800" : "text-slate-300 hover:text-red-500 hover:bg-red-50/50"
                        }`}
                        title="Remove from queue"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 px-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
              isDark ? "bg-slate-900 text-slate-600" : "bg-slate-100 text-slate-400"
            }`}>
              <DollarSign size={24} />
            </div>
            <h3 className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-800"}`}>No expenses logged yet!</h3>
            <p className={`text-xs mt-1 max-w-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              Tap the floating <span className="font-semibold text-blue-600">+</span> button below to split your first travel bill!
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {[...expenses].reverse().map((expense, idx) => {
              const payer = users.find((u) => u.id === expense.payerId);
              const payerName = payer ? payer.name : "Unknown";
              const totalInvolved = expense.involvedUserIds.length;

              // Generate a stable color pattern for user initials
              const colors = [
                { bg: "bg-orange-50 text-orange-600", border: "border-orange-100" },
                { bg: "bg-emerald-50 text-emerald-600", border: "border-emerald-100" },
                { bg: "bg-blue-50 text-blue-600", border: "border-blue-100" },
                { bg: "bg-purple-50 text-purple-600", border: "border-purple-100" },
              ];
              const cIdx = (payer ? parseInt(payer.id) || 0 : idx) % colors.length;
              const colorSet = colors[cIdx];

              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  style={{ willChange: "transform, opacity" }}
                  className={`rounded-2xl p-4 shadow-2xs border flex justify-between items-center relative group ${
                    isDark 
                      ? "bg-slate-900 border-slate-800/80 hover:border-blue-900" 
                      : "bg-white border-slate-100 hover:border-blue-200"
                  }`}
                  id={`expense-card-${expense.id}`}
                >
                  <div className="flex-1 pr-4 min-w-0">
                    <h4 className={`font-bold text-sm leading-snug ${isDark ? "text-slate-100" : "text-slate-950"}`}>{expense.description}</h4>
                    <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <span>Paid by <strong className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{payerName}</strong></span>
                      <span className={`w-1 h-1 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-300"}`} />
                      <span>Split among {totalInvolved}</span>
                    </div>

                    {/* Involved circles/badges list */}
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      {expense.involvedUserIds.map((uid) => {
                        const u = users.find((usr) => usr.id === uid);
                        if (!u) return null;
                        const isPayer = uid === expense.payerId;
                        return (
                          <span
                            key={uid}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-medium border transition-colors ${
                              isPayer
                                ? (isDark ? "bg-blue-950/40 text-blue-400 border-blue-900/50" : "bg-blue-50 text-blue-600 border-blue-100")
                                : (isDark ? "bg-slate-800/40 text-slate-300 border-slate-750" : "bg-slate-50 text-slate-600 border-slate-200/60")
                            }`}
                          >
                            {u.name}
                          </span>
                        );
                      })}
                    </div>

                    {/* Receipt itemized preview */}
                    {expense.items && expense.items.length > 0 && (
                      <div className={`mt-2 text-[10px] p-1.5 rounded-lg border max-w-sm transition-colors ${
                        isDark 
                          ? "text-slate-400 bg-slate-950/45 border-slate-800/50" 
                          : "text-slate-500 bg-slate-100/50 border-slate-200/50"
                      }`}>
                        <div className={`font-bold mb-0.5 flex items-center gap-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          <span className={`text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider ${
                            isDark ? "bg-blue-950 text-blue-400 border border-blue-900/30" : "bg-blue-100 text-blue-700"
                          }`}>
                            Itemized Receipt
                          </span>
                        </div>
                        <div className={`space-y-0.5 text-[9px] ${isDark ? "text-slate-450" : "text-slate-500"}`}>
                          {expense.items.filter(i => i.type === "FOOD").slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between gap-4">
                              <span className="truncate">• {item.name}</span>
                              <span className={`font-mono font-bold shrink-0 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{formatCurrency(item.price, currencySymbol)}</span>
                            </div>
                          ))}
                          {expense.items.filter(i => i.type === "FOOD").length > 3 && (
                            <div className={`text-[8px] italic mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                              + {expense.items.filter(i => i.type === "FOOD").length - 3} more items
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0 text-right max-w-[45%] pr-3 md:pr-5">
                    <span className={`text-xs sm:text-sm md:text-base font-extrabold font-mono break-all leading-tight ${
                      isDark ? "text-slate-50" : "text-slate-900"
                    }`}>
                      {formatCurrency(expense.totalAmount, currencySymbol)}
                    </span>
                    
                    <div className={`flex items-center gap-1 rounded-lg p-0.5 shadow-3xs transition-colors ${
                      isDark ? "bg-slate-950 border border-slate-800/80" : "bg-slate-50 border border-slate-100"
                    }`}>
                      {onStartEdit && (
                        <button
                          id={`edit-btn-${expense.id}`}
                          onClick={() => onStartEdit(expense)}
                          className={`p-1 rounded-md transition-all ${
                            isDark ? "text-slate-500 hover:text-blue-400 hover:bg-slate-900" : "text-slate-400 hover:text-blue-600 hover:bg-white"
                          }`}
                          title="Edit expense"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                      {onDeleteExpense && (
                        <button
                          id={`delete-btn-${expense.id}`}
                          onClick={() => onDeleteExpense(expense.id)}
                          className={`p-1 rounded-md transition-all ${
                            isDark ? "text-slate-500 hover:text-red-400 hover:bg-slate-900" : "text-slate-400 hover:text-red-600 hover:bg-white"
                          }`}
                          title="Delete expense"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// BALANCES SCREEN
// ---------------------------------------------------------
export function BalancesScreen({ expenses, users, currencySymbol = "₹", theme = "light", onOpenSidebar }: ScreenProps) {
  const balances = calculateBalances(users, expenses);
  const debts = calculateSimplifiedDebts(users, expenses);
  const isDark = theme === "dark";

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${isDark ? "bg-slate-950 text-slate-100" : "bg-[#f8fafc] text-slate-900"}`}>
      {/* Android Top Header bar */}
      <div className={`px-3 pt-3.5 pb-3.5 rounded-b-2xl shadow-2xs border-b flex items-center justify-between transition-colors duration-300 ${
        isDark ? "bg-slate-900 text-white border-slate-800" : "bg-slate-50 text-slate-900 border-slate-200/60"
      }`}>
        <div className="flex items-center gap-2">
          {onOpenSidebar && (
            <button
              type="button"
              onClick={onOpenSidebar}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-150 text-slate-700"
              }`}
              title="Open Profile Drawer"
              id="balances-header-sidebar-trigger"
            >
              <MoreVertical size={18} />
            </button>
          )}
          <div>
            <h1 className={`text-base font-bold font-sans tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Trip Balances</h1>
            <p className={`text-[9px] font-sans mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Who owes what and who is owed money
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-24">
        {/* Section 1: Individual Standings */}
        <div>
          <h3 className={`text-[10px] font-bold uppercase tracking-[0.15em] px-1 mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            Individual Standings
          </h3>
          <div className="space-y-2">
            {users.map((user) => {
              const balance = balances[user.id] || 0;
              const hasPositive = balance > 0.01;
              const hasNegative = balance < -0.01;

              return (
                <div
                  key={user.id}
                  className={`rounded-2xl p-4 shadow-2xs border flex justify-between items-center transition-colors duration-300 ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                  }`}
                  id={`balance-row-${user.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center border transition-colors duration-300 ${
                      isDark ? "bg-slate-950 text-slate-300 border-slate-800" : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}>
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className={`font-semibold text-sm ${isDark ? "text-slate-200" : "text-slate-900"}`}>{user.name}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    {hasPositive ? (
                      <div className="text-emerald-500 font-semibold text-xs">
                        Owed <span className="font-mono text-sm font-bold">{formatCurrency(balance, currencySymbol)}</span>
                      </div>
                    ) : hasNegative ? (
                      <div className="text-red-400 font-semibold text-xs">
                        Owes <span className="font-mono text-sm font-bold">{formatCurrency(Math.abs(balance), currencySymbol)}</span>
                      </div>
                    ) : (
                      <div className={`font-medium text-[11px] ${isDark ? "text-slate-650" : "text-slate-400"}`}>
                        All settled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Simplified Settlements (Who pays whom) */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Simplified Settlements
            </h3>
            <span className={`text-[9px] border px-1.5 py-0.5 rounded font-bold transition-colors duration-300 ${
              isDark ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-600 border-slate-200/60"
            }`}>
              Minimized
            </span>
          </div>

          {debts.length === 0 ? (
            <div className={`rounded-2xl p-6 border border-dashed flex flex-col items-center text-center transition-colors duration-300 ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${
                isDark ? "bg-emerald-950/40 text-emerald-400" : "bg-emerald-50 text-emerald-500"
              }`}>
                <CheckCircle size={18} />
              </div>
              <p className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>All settled up!</p>
              <p className={`text-[10px] ${isDark ? "text-slate-550" : "text-slate-400"} mt-0.5`}>No transfers are required right now.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {debts.map((debt, idx) => {
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4 border flex justify-between items-center transition-colors duration-300 ${
                      isDark ? "bg-slate-900 border-slate-800/80 hover:border-blue-900" : "bg-white border-slate-200/80 hover:border-blue-200"
                    }`}
                    id={`debt-card-${idx}`}
                  >
                    <div>
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                        <span>{debt.fromName}</span>
                        <span className={`text-[10px] font-normal ${isDark ? "text-slate-550" : "text-slate-400"}`}>pays</span>
                        <span>{debt.toName}</span>
                      </div>
                      <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-450"} mt-0.5`}>Settle shared balance</p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-blue-500 font-mono">
                        {formatCurrency(debt.amount, currencySymbol)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// ADD EXPENSE SCREEN
// ---------------------------------------------------------
export function AddExpenseScreen({
  users,
  onAddExpense,
  onNavigate,
  currencySymbol = "₹",
  editingExpense,
  isOnline,
  onQueueOfflineReceipt,
  theme = "light",
  customGeminiApiKey,
}: ScreenProps) {
  const isDark = theme === "dark";
  const [description, setDescription] = useState(editingExpense ? editingExpense.description : "");
  const [amountText, setAmountText] = useState(editingExpense ? String(editingExpense.totalAmount) : "");
  const [payerId, setPayerId] = useState(editingExpense ? editingExpense.payerId : (users[0]?.id || ""));
  const [involvedUserIds, setInvolvedUserIds] = useState<string[]>(
    editingExpense ? editingExpense.involvedUserIds : users.map((u) => u.id)
  );

  const [receiptItems, setReceiptItems] = useState<Array<{ name: string; price: number; type: "FOOD" | "TAX" }>>([]);
  const [itemSplits, setItemSplits] = useState<{ [key: number]: string[] }>({});
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description);
      setAmountText(String(editingExpense.totalAmount));
      setPayerId(editingExpense.payerId);
      setInvolvedUserIds(editingExpense.involvedUserIds);
      
      if (editingExpense.items && editingExpense.items.length > 0) {
        setReceiptItems(editingExpense.items);
        const initialSplits: { [key: number]: string[] } = {};
        const initialChecked: { [key: number]: boolean } = {};
        editingExpense.items.forEach((item: any, idx: number) => {
          initialSplits[idx] = item.splitUserIds || [];
          initialChecked[idx] = true;
        });
        setItemSplits(initialSplits);
        setCheckedItems(initialChecked);
      } else {
        setReceiptItems([]);
      }
    } else {
      setDescription("");
      setAmountText("");
      setPayerId(users[0]?.id || "");
      setInvolvedUserIds(users.map((u) => u.id));
      setReceiptItems([]);
    }
  }, [editingExpense, users]);

  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Calculations for live item splits supporting proportional TAX distribution
  const activeFoodItems = receiptItems.filter((item, idx) => item.type === "FOOD" && checkedItems[idx] !== false);
  const taxItems = receiptItems.filter((item) => item.type === "TAX");
  
  const foodSubtotal = activeFoodItems.reduce((sum, item) => sum + item.price, 0);
  const taxTotal = taxItems.reduce((sum, item) => sum + item.price, 0);
  const calculatedSum = foodSubtotal + taxTotal;

  // First, calculate each user's exact share of the FOOD subtotal
  const userFoodShares: { [userId: string]: number } = {};
  users.forEach((u) => {
    userFoodShares[u.id] = 0;
  });

  activeFoodItems.forEach((item) => {
    const origIndex = receiptItems.indexOf(item);
    const splitUserIds = itemSplits[origIndex] || [];
    if (splitUserIds.length === 0) return;

    const perPersonCost = item.price / splitUserIds.length;
    splitUserIds.forEach((userId) => {
      if (userFoodShares[userId] !== undefined) {
        userFoodShares[userId] += perPersonCost;
      }
    });
  });

  // Then, automatically distribute the TAX total among the users using those exact same food percentages
  const calculatedShares: { [userId: string]: number } = {};
  users.forEach((u) => {
    const foodShare = userFoodShares[u.id] || 0;
    const percentage = foodSubtotal > 0 ? (foodShare / foodSubtotal) : 0;
    const taxShare = percentage * taxTotal;
    calculatedShares[u.id] = foodShare + taxShare;
  });

  // Keep amountText synced with calculated sum of checked items
  useEffect(() => {
    if (receiptItems.length > 0) {
      setAmountText(calculatedSum.toFixed(2));
    }
  }, [calculatedSum, receiptItems.length]);

  const handleScanReceiptClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const reader = new FileReader();
    reader.onloadstart = () => {
      setIsScanning(true);
      setError(null);
    };
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(",")[1];
        const mimeType = file.type;

        if (isOnline === false) {
          // OFFLINE ROUTINE: Cache background-removed receipt offline in Room DB queue
          setTimeout(() => {
            if (onQueueOfflineReceipt) {
              onQueueOfflineReceipt({
                id: `offline_${Date.now()}`,
                fileName: file.name,
                mimeType: mimeType,
                imageBase64: base64String,
                description: description.trim() || "Offline Scanned Receipt",
                timestamp: new Date().toLocaleTimeString(),
              });
            }
            setIsScanning(false);
            if (onNavigate) {
              onNavigate("dashboard");
            }
          }, 2000); // 2 second delay to simulate filtering & Room storage
          return;
        }

        let data;
        if (customGeminiApiKey) {
          // Direct client-side fetch to Gemini API
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${customGeminiApiKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: mimeType || "image/jpeg",
                        data: base64String,
                      },
                    },
                    {
                      text: "Act as a highly accurate data extraction tool. Extract the 'Total Amount' and a short 'Description' of the expense from this receipt. Extract the amount as a number and the description as a brief string (e.g., 'Lunch at Honest Restaurant'). Also extract itemized list of all items.",
                    },
                  ],
                },
              ],
              systemInstruction: {
                parts: [
                  {
                    text: "Instruct the model to act as a highly accurate data extraction tool. It must extract a list of items with their names, prices, and classifications, as well as a short 'Description' for the overall bill (e.g., 'Dinner at Honest Restaurant'). Classify each item as either 'FOOD' (for standard dishes, meals, beverages, or individual grocery/food items) or 'TAX' (for VAT, GST, service charge, tips, surcharge, packaging fee, or discount).",
                  },
                ],
              },
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: "OBJECT",
                  properties: {
                    description: {
                      type: "STRING",
                      description: "A short descriptive name of the expense or merchant.",
                    },
                    items: {
                      type: "ARRAY",
                      description: "The list of individual dishes, items, and tax entries with their prices.",
                      items: {
                        type: "OBJECT",
                        properties: {
                          name: {
                            type: "STRING",
                            description: "The name of the item or tax entry.",
                          },
                          price: {
                            type: "NUMBER",
                            description: "The price of the item or tax entry.",
                          },
                          type: {
                            type: "STRING",
                            enum: ["FOOD", "TAX"],
                            description: "The type of the item. FOOD for dishes, TAX for taxes/fees.",
                          },
                        },
                        required: ["name", "price", "type"],
                      },
                    },
                  },
                  required: ["description", "items"],
                },
              },
            }),
          });

          const resJson = await response.json();
          if (!response.ok) {
            throw new Error(resJson.error?.message || "Failed to scan receipt directly via Gemini client API.");
          }

          const textResult = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!textResult) {
            throw new Error("No response text returned from Gemini API.");
          }

          const parsed = JSON.parse(textResult);
          data = {
            success: true,
            description: parsed.description,
            items: parsed.items || [],
          };
        } else {
          // ONLINE ROUTINE: Cloud proxy route via gemini-2.5-flash
          const response = await fetch("/api/scan-receipt", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageBase64: base64String,
              mimeType: mimeType,
            }),
          });

          data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to scan receipt with Gemini.");
          }
        }

        if (data.success) {
          setDescription(data.description || "");
          const rawItems = data.items || [];
          const mappedItems = rawItems.map((item: any) => ({
            name: item.name || "Item",
            price: Number(item.price) || 0,
            type: (item.type === "TAX" ? "TAX" : "FOOD") as "FOOD" | "TAX"
          }));
          setReceiptItems(mappedItems);

          // Pre-fill splits to include all currently involved friends by default for FOOD items
          const initialSplits: { [key: number]: string[] } = {};
          const initialChecked: { [key: number]: boolean } = {};
          mappedItems.forEach((item: any, idx: number) => {
            initialSplits[idx] = item.type === "FOOD" ? [...involvedUserIds] : [];
            initialChecked[idx] = true;
          });
          setItemSplits(initialSplits);
          setCheckedItems(initialChecked);
        } else {
          throw new Error("Could not extract data from the receipt.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred while scanning the receipt.");
      } finally {
        if (isOnline !== false) {
          setIsScanning(false);
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
      setError("Failed to read the selected file.");
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (receiptItems.length > 0) {
      if (activeFoodItems.length === 0) {
        setError("Please check at least one Food item or clear the scan.");
        return;
      }

      // Ensure at least one friend is assigned to each active food item
      let missingAssignment = false;
      const finalItems = receiptItems.map((item, index) => {
        const isChecked = checkedItems[index] !== false;
        const splits = isChecked ? (itemSplits[index] || []) : [];
        if (item.type === "FOOD" && isChecked && splits.length === 0) {
          missingAssignment = true;
        }
        return {
          name: item.name,
          price: item.price,
          type: item.type,
          splitUserIds: splits
        };
      });

      if (missingAssignment) {
        setError("Please select at least one friend to share each checked food item.");
        return;
      }

      // Collect all involved users across all selected food items
      const involved = Array.from(new Set(
        finalItems
          .filter(item => item.type === "FOOD")
          .flatMap(item => item.splitUserIds)
      )) as string[];

      if (onAddExpense) {
        onAddExpense(
          description.trim() || "Receipt",
          calculatedSum,
          payerId,
          involved.length > 0 ? involved : users.map(u => u.id),
          editingExpense?.id,
          finalItems
        );
      }

      if (onNavigate) {
        onNavigate("dashboard");
      }
    } else {
      const amount = parseFloat(amountText);
      if (!description.trim()) {
        setError("Please enter what the expense was for");
        return;
      }
      if (isNaN(amount) || amount <= 0) {
        setError(`Please enter a valid amount greater than ${currencySymbol}0.00`);
        return;
      }
      if (involvedUserIds.length === 0) {
        setError("Please select at least one friend to split with");
        return;
      }

      if (onAddExpense) {
        onAddExpense(description.trim(), amount, payerId, involvedUserIds, editingExpense?.id);
      }
      if (onNavigate) {
        onNavigate("dashboard");
      }
    }
  };

  const handleCheckboxChange = (userId: string) => {
    if (involvedUserIds.includes(userId)) {
      // Prevent unselecting all involved
      if (involvedUserIds.length > 1) {
        setInvolvedUserIds(involvedUserIds.filter((id) => id !== userId));
      } else {
        setError("At least one person must split the expense!");
      }
    } else {
      setInvolvedUserIds([...involvedUserIds, userId]);
      setError(null);
    }
  };

  const selectAll = () => {
    setInvolvedUserIds(users.map((u) => u.id));
    setError(null);
  };

  const selectNone = () => {
    // Keep first user to prevent empty
    setInvolvedUserIds([users[0]?.id || ""]);
  };

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 relative ${isDark ? "bg-slate-950 text-slate-100" : "bg-[#f8fafc] text-slate-900"}`}>
      {isScanning && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-center z-50 p-6 select-none animate-fade-in">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-2 bg-blue-500/20 rounded-full animate-ping" />
            <Camera className="absolute inset-0 m-auto text-blue-400" size={24} />
          </div>
          
          {isOnline === false ? (
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-extrabold bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/30">
                Offline Mode (Room Cache)
              </span>
              <h3 className="text-sm font-bold text-white mt-2">Caching Receipt Offline...</h3>
              <p className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
                Applying background-removal filters and securely storing the scanned image in the local Room database queue.
              </p>
              <div className="text-[10px] font-mono text-slate-400 pt-2 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                <span>Safely queued in offline Room DB</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-extrabold bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/30">
                Cloud Proxy Active
              </span>
              <h3 className="text-sm font-bold text-white mt-2">Analyzing with Gemini-2.5-Flash...</h3>
              <p className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
                Extracting itemized food dishes, prices, and classifications.
              </p>
              <div className="text-[10px] font-mono text-slate-400 pt-2 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                <span>Processing online extract</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Android Top Header bar */}
      <div className={`px-3 pt-4 pb-4 rounded-b-2xl shadow-2xs border-b flex items-center gap-3 transition-colors duration-300 ${
        isDark ? "bg-slate-900 text-white border-slate-800" : "bg-slate-50 text-slate-900 border-slate-200/60"
      }`}>
        <button
          id="back-btn"
          type="button"
          onClick={() => onNavigate && onNavigate("dashboard")}
          className={`p-1 rounded-full transition-colors ${
            isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"
          }`}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className={`text-base font-bold font-sans tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            {editingExpense ? "Edit Expense" : "Add New Expense"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {error && (
          <div className={`text-xs p-3 rounded-xl border font-medium ${
            isDark ? "bg-red-950/40 text-red-400 border-red-900/50" : "bg-red-50 text-red-600 border-red-200/60"
          }`}>
            {error}
          </div>
        )}

        {/* Description Field */}
        <div>
          <label className={`block text-[10px] font-bold uppercase tracking-[0.12em] mb-1 px-1 ${
            isDark ? "text-slate-500" : "text-slate-400"
          }`}>
            What was this for?
          </label>
          <input
            id="input-description"
            type="text"
            required
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Fuel, Cabin Rental, Dinner"
            className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all ${
              isDark 
                ? "bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500" 
                : "bg-white border border-slate-200 text-slate-900 placeholder-slate-400"
            }`}
          />
        </div>

        {/* Amount Field */}
        <div>
          <label className={`block text-[10px] font-bold uppercase tracking-[0.12em] mb-1 px-1 ${
            isDark ? "text-slate-500" : "text-slate-400"
          }`}>
            Total Amount ({currencySymbol})
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">{currencySymbol}</span>
              <input
                id="input-amount"
                type="number"
                step="0.01"
                required
                min="0.01"
                value={amountText}
                onChange={(e) => {
                  setAmountText(e.target.value);
                  setError(null);
                }}
                placeholder="0.00"
                className={`w-full rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono transition-all ${
                  isDark 
                    ? "bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500" 
                    : "bg-white border border-slate-200 text-slate-900 placeholder-slate-400"
                }`}
              />
            </div>
            {/* Action buttons: Camera capture vs Gallery upload */}
            <div className="flex gap-1.5 shrink-0">
              <button
                type="button"
                id="scan-receipt-btn"
                onClick={handleScanReceiptClick}
                disabled={isScanning}
                className={`flex items-center justify-center p-3 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] ${
                  isDark 
                    ? "bg-blue-950/40 text-blue-400 border border-blue-900/40 hover:bg-blue-900/40 active:bg-blue-900/50" 
                    : "bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 active:bg-blue-200"
                }`}
                title="Capture receipt photo using camera"
              >
                {isScanning ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={18} />
                )}
              </button>

              <button
                type="button"
                id="upload-receipt-btn"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isScanning}
                className={`flex items-center justify-center p-3 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] ${
                  isDark 
                    ? "bg-indigo-950/40 text-indigo-400 border border-indigo-900/40 hover:bg-indigo-900/40 active:bg-indigo-900/50" 
                    : "bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 active:bg-indigo-200"
                }`}
                title="Upload receipt image from gallery"
              >
                {isScanning ? (
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
              </button>
            </div>
          </div>
          {/* File Inputs (Camera capture vs Gallery upload) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
          <input
            type="file"
            ref={galleryInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
        {/* Scanned Receipt Items Section */}
        {receiptItems.length > 0 && (
          <div className={`border rounded-xl p-3 space-y-3 shadow-2xs transition-colors duration-300 ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100/10">
              <div className="flex items-center gap-1.5">
                <h3 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Scanned Receipt Items</h3>
                <span className={`text-[9px] px-1 py-0.5 rounded-sm font-semibold ${
                  isDark ? "bg-blue-950 text-blue-400 border border-blue-900/50" : "bg-blue-50 text-blue-600"
                }`}>
                  Proportional Tax
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setReceiptItems([])} 
                className="text-[10px] text-red-400 font-bold hover:underline"
              >
                Clear Scan
              </button>
            </div>
            
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {/* FOOD Items */}
              {receiptItems.filter(item => item.type === "FOOD").map((item) => {
                const index = receiptItems.indexOf(item);
                const isItemChecked = checkedItems[index] !== false;
                const currentItemSplit = itemSplits[index] || [];
                const isEveryoneChecked = users.every(user => currentItemSplit.includes(user.id));
                
                return (
                  <div key={index} className={`p-2 rounded-lg border transition-all ${
                    isItemChecked 
                      ? (isDark ? "border-slate-850 bg-slate-950/40" : "border-slate-100 bg-slate-50/50") 
                      : (isDark ? "border-slate-850 bg-slate-900/10 opacity-40" : "border-slate-100/50 opacity-60 bg-slate-100/20")
                  }`}>
                    {/* Item Title & Price */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={isItemChecked}
                          onChange={() => {
                            setCheckedItems({
                              ...checkedItems,
                              [index]: !isItemChecked
                            });
                          }}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-600 cursor-pointer"
                        />
                        <span className={`font-bold text-xs truncate max-w-[120px] ${isDark ? "text-slate-200" : "text-slate-800"}`}>{item.name}</span>
                        <span className={`text-[8px] px-1 py-0.5 rounded-sm font-semibold uppercase ${
                          isDark ? "bg-emerald-950/55 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                        }`}>Food</span>
                      </label>
                      <span className={`font-mono text-xs font-bold ${isDark ? "text-slate-350" : "text-slate-600"}`}>
                        {formatCurrency(item.price, currencySymbol)}
                      </span>
                    </div>
                    
                    {/* Friend Checkboxes for this item */}
                    {isItemChecked && (
                      <div className="mt-2 pl-6">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Shared by:</p>
                          <label className={`flex items-center gap-1 cursor-pointer select-none px-1.5 py-0.5 rounded border transition-all ${
                            isDark 
                              ? "bg-blue-950/30 hover:bg-blue-900/40 border-blue-900/40" 
                              : "bg-blue-50/50 hover:bg-blue-100/50 border-blue-100"
                          }`}>
                            <input
                              type="checkbox"
                              checked={isEveryoneChecked}
                              onChange={() => {
                                if (isEveryoneChecked) {
                                  // Clear all
                                  setItemSplits({
                                    ...itemSplits,
                                    [index]: []
                                  });
                                } else {
                                  // Select all
                                  setItemSplits({
                                    ...itemSplits,
                                    [index]: users.map(u => u.id)
                                  });
                                }
                              }}
                              className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wide">Everyone</span>
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {users.map((user) => {
                            const isUserChecked = currentItemSplit.includes(user.id);
                            return (
                              <button
                                type="button"
                                key={user.id}
                                onClick={() => {
                                  const nextSplit = isUserChecked 
                                    ? currentItemSplit.filter(id => id !== user.id)
                                    : [...currentItemSplit, user.id];
                                  setItemSplits({
                                    ...itemSplits,
                                    [index]: nextSplit
                                  });
                                }}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all cursor-pointer ${
                                  isUserChecked 
                                    ? (isDark ? "bg-blue-950 text-blue-400 border border-blue-900" : "bg-blue-100 text-blue-700 border border-blue-200 font-semibold") 
                                    : (isDark ? "bg-slate-800 text-slate-400 border border-slate-750 hover:bg-slate-700" : "bg-slate-100 text-slate-500 border border-slate-200/50 hover:bg-slate-200/50")
                                }`}
                              >
                                {user.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* TAX Items */}
              {receiptItems.filter(item => item.type === "TAX").map((item) => {
                const index = receiptItems.indexOf(item);
                return (
                  <div key={index} className={`p-2 rounded-lg border flex items-center justify-between select-none opacity-80 ${
                    isDark ? "border-slate-800 bg-slate-900/60 text-slate-400" : "border-slate-200 bg-slate-100/60 text-slate-500"
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <Lock className={`w-3 h-3 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
                      <span className={`font-bold text-xs truncate max-w-[130px] ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item.name}</span>
                      <span className={`text-[8px] px-1 py-0.5 rounded-sm font-semibold uppercase ${
                        isDark ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-600"
                      }`}>Tax</span>
                    </div>
                    <span className="font-mono text-xs font-bold">
                      {formatCurrency(item.price, currencySymbol)}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Dynamic Sum & calculated splits */}
            <div className="pt-2 border-t border-slate-100/10 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className={`font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>Calculated Sum:</span>
                <span className="font-mono font-bold text-blue-500 text-sm">
                  {formatCurrency(calculatedSum, currencySymbol)}
                </span>
              </div>
              
              <div className={`rounded-lg p-2.5 space-y-1 border ${
                isDark ? "bg-blue-950/20 border-blue-900/30" : "bg-blue-50/50 border-blue-100/50"
              }`}>
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Calculated Shares (Proportional Tax Included):</p>
                <div className="space-y-0.5">
                  {users.map(user => {
                    const share = calculatedShares[user.id] || 0;
                    return (
                      <div key={user.id} className="flex justify-between items-center text-[10px]">
                        <span className={`font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>{user.name}:</span>
                        <span className={`font-mono font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                          {formatCurrency(share, currencySymbol)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <p className={`text-[9px] italic text-center ${isDark ? "text-slate-550" : "text-slate-400"}`}>
                Saving will add food items as individual expenses with taxes proportionally allocated.
              </p>
            </div>
          </div>
        )}

        {/* Payer Selection */}
        <div>
          <label className={`block text-[10px] font-bold uppercase tracking-[0.12em] mb-1 px-1 ${
            isDark ? "text-slate-500" : "text-slate-400"
          }`}>
            Who Paid?
          </label>
          <select
            id="select-payer"
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all cursor-pointer ${
              isDark 
                ? "bg-slate-900 border border-slate-800 text-slate-100" 
                : "bg-white border border-slate-200 text-slate-900"
            }`}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id} className={isDark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Split checkboxes - Only show when not scanning receipt itemized list */}
        {receiptItems.length === 0 && (
          <div>
            <div className="flex justify-between items-center mb-1 px-1">
              <label className={`block text-[10px] font-bold uppercase tracking-[0.12em] ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}>
                Split with whom?
              </label>
              <div className="space-x-2 text-[9px] text-blue-500 font-bold">
                <button type="button" onClick={selectAll} className="hover:underline">Select All</button>
                <span>|</span>
                <button type="button" onClick={selectNone} className="hover:underline">Clear</button>
              </div>
            </div>

            <div className={`border rounded-xl p-2 space-y-1 shadow-2xs transition-colors duration-300 ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
            }`}>
              {users.map((user) => {
                const isChecked = involvedUserIds.includes(user.id);
                return (
                  <label
                    key={user.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all text-xs ${
                      isDark ? "hover:bg-slate-800" : "hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCheckboxChange(user.id)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-600 cursor-pointer"
                    />
                    <span className={`font-semibold ${
                      isChecked 
                        ? (isDark ? "text-slate-100" : "text-slate-900") 
                        : (isDark ? "text-slate-500" : "text-slate-400")
                    }`}>
                      {user.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <button
          id="submit-expense-btn"
          type="submit"
          className="w-full bg-blue-600 text-white py-3.5 px-4 rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-xs flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
        >
          <Check size={16} />
          <span>{editingExpense ? "Save Changes" : "Save Expense"}</span>
        </button>
      </form>
    </div>
  );
}
