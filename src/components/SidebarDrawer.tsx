import React from "react";
import { 
  X, Smartphone, Mail, Award, Sun, Moon, Pencil, Check, Download, Map,
  History, Eye, Trash2, Archive, Calendar, Users, DollarSign, LogOut, Phone, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Expense, PastTrip } from "../types";
import { calculateBalances } from "../utils";

interface SidebarDrawerProps {
  isSidebarOpen: boolean;
  onClose: () => void;
  theme: string;
  setTheme: (theme: "light" | "dark") => void;
  profileName: string;
  setProfileName: (name: string) => void;
  profileEmail: string;
  profileBio: string;
  profileColor: string;
  setProfileColor: (color: string) => void;
  isEditingProfile: boolean;
  setIsEditingProfile: (editing: boolean) => void;
  tripBudget: number;
  setTripBudget: (budget: number) => void;
  isEditingBudget: boolean;
  setIsEditingBudget: (editing: boolean) => void;
  tempBudgetText: string;
  setTempBudgetText: (text: string) => void;
  users: User[];
  expenses: Expense[];
  currencySymbol: string;
  reportCopied: boolean;
  onCopyReport: () => void;
  onStartNewTrip?: () => void;
  pastTrips: PastTrip[];
  onReviewPastTrip: (trip: PastTrip) => void;
  onDeletePastTrip: (tripId: string) => void;
  onSaveCurrentToHistory: () => void;
  profileMobile?: string;
  onLogout?: () => void;
  onOpenSettings?: () => void;
}

export function SidebarDrawer({
  isSidebarOpen,
  onClose,
  theme,
  setTheme,
  profileName,
  setProfileName,
  profileEmail,
  profileBio,
  profileColor,
  setProfileColor,
  isEditingProfile,
  setIsEditingProfile,
  tripBudget,
  setTripBudget,
  isEditingBudget,
  setIsEditingBudget,
  tempBudgetText,
  setTempBudgetText,
  users,
  expenses,
  currencySymbol,
  reportCopied,
  onCopyReport,
  onStartNewTrip,
  pastTrips,
  onReviewPastTrip,
  onDeletePastTrip,
  onSaveCurrentToHistory,
  profileMobile = "9876543210",
  onLogout,
  onOpenSettings
}: SidebarDrawerProps) {
  const totalTripExpenses = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
  const spentPercentage = Math.min(100, Math.round((totalTripExpenses / tripBudget) * 100));

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Backdrop Overlay inside mobile phone */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs z-50 cursor-pointer rounded-[32px]"
            id="sidebar-backdrop"
          />

          {/* Sidebar Slide-Out Panel inside mobile phone */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className={`absolute top-0 left-0 bottom-0 w-[275px] max-w-[85%] h-full shadow-2xl z-50 flex flex-col overflow-hidden rounded-l-[32px] transition-colors duration-300 ${
              theme === "dark" 
                ? "bg-slate-900 text-white border-r border-slate-800" 
                : "bg-white text-slate-900 border-r border-slate-200"
            }`}
            id="sidebar-panel"
          >
            {/* Header block with close button */}
            <div className={`px-4 py-3.5 border-b flex justify-between items-center ${
              theme === "dark" ? "border-slate-800 bg-slate-950/30" : "border-slate-100 bg-slate-50/50"
            }`}>
              <div className="flex items-center gap-1.5">
                <Smartphone size={14} className="text-blue-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">TripSplit Profile</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  theme === "dark" ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                }`}
                id="sidebar-close-btn"
              >
                <X size={14} />
              </button>
            </div>

            {/* Scrollable sidebar body */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
              
              {/* 1. Profile Card */}
              <div className={`rounded-xl p-3 border relative overflow-hidden flex flex-col items-center text-center transition-all ${
                theme === "dark" 
                  ? "bg-slate-950 border-slate-800/80" 
                  : "bg-slate-50/60 border-slate-200/60 shadow-3xs"
              }`}>
                {/* Decorative Profile Color Banner Background */}
                <div className={`absolute top-0 left-0 right-0 h-12 bg-gradient-to-r ${profileColor} opacity-90`} />

                {/* Profile Initials Bubble */}
                <div className="relative mt-2">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${profileColor} text-white font-extrabold text-xl flex items-center justify-center border-2 shadow-md transition-all duration-300 ${
                    theme === "dark" ? "border-slate-950" : "border-white"
                  }`}>
                    {profileName ? profileName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "ME"}
                  </div>
                </div>

                {/* Profile Color Chooser */}
                <div className="mt-2.5 flex items-center gap-2 z-10 bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-500/10">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Color:</span>
                  <div className="flex gap-1">
                    {[
                      { color: "from-blue-600 to-indigo-700", label: "Blue" },
                      { color: "from-rose-500 to-pink-600", label: "Pink" },
                      { color: "from-emerald-500 to-teal-600", label: "Green" },
                      { color: "from-amber-500 to-orange-600", label: "Orange" },
                      { color: "from-purple-600 to-violet-800", label: "Purple" }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProfileColor(item.color)}
                        className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${item.color} transition-transform duration-200 cursor-pointer ${
                          profileColor === item.color ? "scale-120 ring-1 ring-offset-1 " + (theme === "dark" ? "ring-offset-slate-900 ring-white" : "ring-offset-white ring-slate-400") : "hover:scale-110"
                        }`}
                        title={item.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Profile Name Header Editing Block */}
                <div className="mt-3 w-full z-10">
                  {isEditingProfile ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setIsEditingProfile(false);
                      }}
                      className="flex items-center gap-1 justify-center w-full"
                    >
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className={`px-2 py-0.5 text-xs font-bold text-center rounded-md border focus:ring-1 focus:outline-hidden w-full ${
                          theme === "dark" 
                            ? "bg-slate-900 border-slate-800 text-white focus:ring-blue-600 focus:border-blue-600" 
                            : "bg-white border-slate-200 text-slate-900 focus:ring-blue-600 focus:border-blue-600"
                        }`}
                        placeholder="Type your name..."
                        autoFocus
                        required
                      />
                      <button
                        type="submit"
                        className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                        title="Save Name"
                      >
                        <Check size={10} />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-center gap-1 px-2 group">
                      <h4 className={`text-xs font-bold tracking-tight ${
                        theme === "dark" ? "text-slate-100" : "text-slate-900"
                      }`}>
                        {profileName}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className={`p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-500/10 text-slate-400 transition-all cursor-pointer`}
                        title="Edit Name"
                      >
                        <Pencil size={10} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Email & Mobile Block */}
                <div className="flex flex-col gap-0.5 items-center mt-1 z-10 select-all justify-center">
                  <div className="flex items-center gap-1 text-[10px] text-slate-450">
                    <Mail size={10} className="text-slate-500" />
                    <span>{profileEmail}</span>
                  </div>
                  {profileMobile && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-450">
                      <Phone size={10} className="text-slate-500" />
                      <span>{profileMobile}</span>
                    </div>
                  )}
                </div>

                {/* Bio & Member Badge */}
                <p className="text-[9px] text-slate-500 italic mt-1.5 px-1 max-w-xs z-10">
                  {profileBio}
                </p>

                <div className="mt-2.5 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-3xs">
                  <Award size={9} className="animate-pulse" />
                  <span>TripSplit Pro+ Member</span>
                </div>
              </div>

              {/* 1.5. Past Trip History Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <h5 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <History size={10} className="text-blue-500 animate-pulse" />
                    <span>Past Trip History</span>
                  </h5>
                  {expenses.length > 0 && (
                    <button
                      type="button"
                      onClick={onSaveCurrentToHistory}
                      className="text-[9px] font-black text-blue-600 hover:text-blue-700 bg-blue-500/10 px-1.5 py-0.5 rounded-md border border-blue-500/15 cursor-pointer flex items-center gap-0.5"
                      title="Save the current active trip state to history list"
                    >
                      <Archive size={8} />
                      <span>Archive Active</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {pastTrips.length === 0 ? (
                    <div className={`p-3 rounded-xl border border-dashed text-center ${
                      theme === "dark" ? "bg-slate-950/20 border-slate-850 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}>
                      <p className="text-[9px] italic">No past trips archived yet.</p>
                      <p className="text-[8px] text-slate-500 mt-0.5">They're saved here automatically when you start new trips or reset.</p>
                    </div>
                  ) : (
                    pastTrips.map((trip) => {
                      const totalSpent = trip.expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
                      const dateStr = new Date(trip.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      });
                      return (
                        <div
                          key={trip.id}
                          onClick={() => {
                            onReviewPastTrip(trip);
                            onClose();
                          }}
                          className={`p-2 rounded-xl border relative transition-all cursor-pointer hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] select-none ${
                            theme === "dark" 
                              ? "bg-slate-950 border-slate-850 hover:border-slate-800" 
                              : "bg-slate-50 border-slate-150 hover:border-slate-200 hover:shadow-3xs"
                          }`}
                          title="Click to review trip details & splits"
                        >
                          <div className="flex justify-between items-start gap-1">
                            <div className="min-w-0 flex-1">
                              <h6 className={`text-[10px] font-extrabold tracking-tight truncate ${
                                theme === "dark" ? "text-slate-200" : "text-slate-800"
                              }`}>
                                {trip.name}
                              </h6>
                              <div className="flex items-center gap-1 text-[8px] text-slate-400 font-mono mt-0.5">
                                <Calendar size={8} />
                                <span>{dateStr}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReviewPastTrip(trip);
                                  onClose();
                                }}
                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                  theme === "dark" 
                                    ? "bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-blue-300" 
                                    : "bg-white hover:bg-slate-100 text-blue-600 hover:text-blue-700 shadow-3xs border border-slate-200"
                                }`}
                                title="Review Trip details & splits"
                              >
                                <Eye size={10} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeletePastTrip(trip.id);
                                }}
                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                  theme === "dark" 
                                    ? "bg-slate-900 hover:bg-slate-800 text-red-400 hover:text-red-300" 
                                    : "bg-white hover:bg-slate-100 text-red-500 hover:text-red-600 shadow-3xs border border-slate-200"
                                }`}
                                title="Delete Trip"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>

                          <div className="mt-1.5 space-y-1">
                            <div className="flex justify-between text-[8px] font-bold text-slate-500">
                              <span>Spent: {trip.currency}{totalSpent.toLocaleString()}</span>
                              <span>Limit: {trip.currency}{trip.budget.toLocaleString()}</span>
                            </div>
                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  totalSpent > trip.budget 
                                    ? "bg-red-500" 
                                    : totalSpent > trip.budget * 0.85 
                                      ? "bg-amber-500" 
                                      : "bg-blue-500"
                                }`}
                                style={{ width: `${Math.min(100, (totalSpent / trip.budget) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 2. Custom Change Theme Option Widget */}
              <div className="space-y-1.5">
                <h5 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 px-1">
                  Theme Preference
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  {/* Light theme option card */}
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                      theme === "light"
                        ? "bg-blue-50/45 border-blue-600 text-blue-600 ring-1 ring-blue-500/20"
                        : "bg-slate-50/30 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <Sun size={14} className={theme === "light" ? "text-amber-500" : ""} />
                    <div className="text-[9px] font-extrabold tracking-tight">Light Mode</div>
                    {theme === "light" && (
                      <span className="w-1 h-1 rounded-full bg-blue-600" />
                    )}
                  </button>

                  {/* Dark theme option card */}
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                      theme === "dark"
                        ? "bg-slate-950 border-blue-600 text-blue-400 ring-1 ring-blue-500/20"
                        : "bg-slate-50/30 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <Moon size={14} className={theme === "dark" ? "text-indigo-400" : ""} />
                    <div className="text-[9px] font-extrabold tracking-tight">Dark Mode</div>
                    {theme === "dark" && (
                      <span className="w-1 h-1 rounded-full bg-blue-500" />
                    )}
                  </button>
                </div>
              </div>



              {/* 3. Interactive Budget Planner */}
              <div className={`p-3 rounded-xl border ${
                theme === "dark" ? "bg-slate-950/40 border-slate-800" : "bg-slate-50/50 border-slate-200/50"
              }`}>
                <div className="flex justify-between items-center mb-1.5">
                  <h5 className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    Trip Budget Tracker
                  </h5>
                  
                  {isEditingBudget ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={tempBudgetText}
                        onChange={(e) => setTempBudgetText(e.target.value)}
                        className={`w-14 px-1 py-0.5 text-[9px] font-bold rounded border ${
                          theme === "dark" ? "bg-slate-900 border-slate-750 text-white" : "bg-white border-slate-200 text-slate-800"
                        }`}
                        placeholder="Limit"
                        autoFocus
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseFloat(tempBudgetText);
                          if (!isNaN(val) && val > 0) {
                            setTripBudget(val);
                          }
                          setIsEditingBudget(false);
                        }}
                        className="p-1 bg-blue-600 text-white rounded text-[8px] flex items-center justify-center cursor-pointer"
                      >
                        <Check size={8} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTempBudgetText(tripBudget.toString());
                        setIsEditingBudget(true);
                      }}
                      className="text-[8px] font-bold text-blue-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Pencil size={8} />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] text-slate-400 font-medium">Spent so far:</span>
                  <span className="text-[10px] font-black">
                    {currencySymbol}{totalTripExpenses.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    <span className="text-[9px] text-slate-400 font-medium font-bold"> / {currencySymbol}{tripBudget.toLocaleString()}</span>
                  </span>
                </div>

                {/* Spending Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-1.5">
                  <div
                    style={{ width: `${spentPercentage}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      spentPercentage < 70 
                        ? "bg-emerald-500" 
                        : spentPercentage < 90 
                          ? "bg-amber-500" 
                          : "bg-red-500"
                    }`}
                  />
                </div>
                
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-[8px] text-slate-400 font-mono">
                    Budget Guard Active
                  </span>
                  <span className={`text-[9px] font-bold ${
                    spentPercentage < 70 
                      ? "text-emerald-500" 
                      : spentPercentage < 90 
                        ? "text-amber-500" 
                        : "text-red-500"
                  }`}>
                    {spentPercentage}% Spent
                  </span>
                </div>
              </div>

              {/* 4. Standings Summary Snapshot inside Sidebar */}
              <div className="space-y-1.5">
                <h5 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 px-1">
                  Group Quick Standings
                </h5>
                <div className={`rounded-xl p-2.5 border space-y-1.5 text-[10px] transition-colors ${
                  theme === "dark" ? "bg-slate-950/20 border-slate-800" : "bg-slate-50/30 border-slate-200/50"
                }`}>
                  {(() => {
                    const balances = calculateBalances(users, expenses);
                    return users.map(user => {
                      const bal = balances[user.id] || 0;
                      return (
                        <div key={user.id} className="flex justify-between items-center text-[10px]">
                          <span className="font-medium text-slate-400">{user.name}</span>
                          {bal > 0.01 ? (
                            <span className="text-[10px] text-emerald-500 font-mono font-bold">Owed {currencySymbol}{bal.toFixed(1)}</span>
                          ) : bal < -0.01 ? (
                            <span className="text-[10px] text-red-400 font-mono font-bold">Owes {currencySymbol}{Math.abs(bal).toFixed(1)}</span>
                          ) : (
                            <span className="text-[9px] text-slate-500 font-mono">Settled</span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* 5. Quick Export Option */}
              <div className="space-y-1.5">
                <h5 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 px-1">
                  Export & Share
                </h5>
                <button
                  type="button"
                  onClick={onCopyReport}
                  className={`w-full py-2 px-3 text-[10px] font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    theme === "dark"
                      ? "bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-900 hover:text-white"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-3xs"
                  }`}
                >
                  {reportCopied ? (
                    <>
                      <Check size={12} className="text-emerald-500" />
                      <span className="text-emerald-500 font-extrabold">Report Copied!</span>
                    </>
                  ) : (
                    <>
                      <Download size={12} className="text-blue-500" />
                      <span>Copy ASCII-Split Report</span>
                    </>
                  )}
                </button>
              </div>

              {/* 6. Adventure Launcher Option */}
              {onStartNewTrip && (
                <div className="space-y-1.5 pt-1">
                  <h5 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 px-1">
                    Trip Planner
                  </h5>
                  <button
                    type="button"
                    onClick={() => {
                      onStartNewTrip();
                      onClose();
                    }}
                    className="w-full py-2 px-3 text-[10px] font-black rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Map size={12} />
                    <span>Start New Trip 🗺️</span>
                  </button>
                </div>
              )}

              {/* 6.5. Settings Option */}
              {onOpenSettings && (
                <div className="space-y-1.5 pt-1">
                  <h5 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 px-1">
                    App Preferences
                  </h5>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSettings();
                      onClose();
                    }}
                    className={`w-full py-2 px-3 text-[10px] font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      theme === "dark"
                        ? "bg-slate-950 border-slate-850 text-slate-200 hover:bg-slate-900 hover:text-white"
                        : "bg-white border-slate-200 text-slate-750 hover:bg-slate-50 hover:text-slate-900 shadow-3xs"
                    }`}
                  >
                    <Settings size={12} className="text-blue-500" />
                    <span>App Settings & Sync</span>
                  </button>
                </div>
              )}

              {/* 7. Logout Option */}
              {onLogout && (
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="w-full py-2 px-3 text-[10px] font-bold rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <LogOut size={12} />
                    <span>Log Out Account</span>
                  </button>
                </div>
              )}

            </div>

            {/* Sidebar footer segment */}
            <div className={`px-4 py-3 border-t text-center text-[9px] font-bold tracking-tight text-slate-500 ${
              theme === "dark" ? "border-slate-800 bg-slate-950/30" : "border-slate-100 bg-slate-50/50"
            }`}>
              TripSplit Sim v1.6 • Built with Love
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
