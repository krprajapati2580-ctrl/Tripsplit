import React, { useState } from "react";
import { 
  Sparkles, 
  Users, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Check, 
  DollarSign, 
  Compass, 
  Coins 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";

interface SetupWizardScreenProps {
  theme: "light" | "dark";
  onComplete: (tripName: string, budget: number, currency: string, friends: string[]) => void;
  onCancel?: () => void;
  canCancel?: boolean;
}

export function SetupWizardScreen({
  theme,
  onComplete,
  onCancel,
  canCancel = true
}: SetupWizardScreenProps) {
  const isDark = theme === "dark";

  // Wizard Steps:
  // 0: General Info (Name, Budget, Currency)
  // 1: Add Friends
  // 2: Final Preview & Confirm
  const [step, setStep] = useState(0);

  // Form State
  const [tripName, setTripName] = useState("");
  const [tripBudget, setTripBudget] = useState("35000");
  const [currency, setCurrency] = useState("₹");
  const [friendInput, setFriendInput] = useState("");
  const [friends, setFriends] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add friend to the wizard list
  const handleAddFriend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = friendInput.trim();
    if (!trimmed) return;

    if (friends.some(f => f.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg("This name is already added.");
      return;
    }

    if (friends.length >= 7) {
      setErrorMsg("Maximum 7 participants allowed in simulation.");
      return;
    }

    setFriends([...friends, trimmed]);
    setFriendInput("");
    setErrorMsg(null);
  };

  // Remove friend
  const handleRemoveFriend = (indexToRemove: number) => {
    setFriends(friends.filter((_, idx) => idx !== indexToRemove));
  };

  // Move to step 1 (Friends)
  const validateAndGoToFriends = () => {
    if (!tripName.trim()) {
      setErrorMsg("Please enter a destination or trip name.");
      return;
    }
    const budgetNum = parseFloat(tripBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      setErrorMsg("Please enter a valid trip budget limit.");
      return;
    }
    setErrorMsg(null);
    setStep(1);
  };

  // Move to step 2 (Confirm)
  const validateAndGoToConfirm = () => {
    if (friends.length < 2) {
      setErrorMsg("Add at least 2 friends to split with!");
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  // Submit and start the trip
  const handleLaunchTrip = () => {
    const budgetNum = parseFloat(tripBudget) || 35000;
    onComplete(tripName.trim(), budgetNum, currency, friends);
  };

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-[#f8fafc] text-slate-900"
    }`}>
      {/* Setup Wizard Header */}
      <div className={`px-4 pt-3.5 pb-3 border-b flex items-center justify-between ${
        isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200/60 text-slate-900"
      }`}>
        <div className="flex items-center gap-2">
          <Compass size={16} className="text-blue-500 animate-spin" style={{ animationDuration: "12s" }} />
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-blue-500">Trip Planner</h2>
            <p className="text-[9px] text-slate-400 font-bold">New Adventure Setup</p>
          </div>
        </div>
        {canCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors cursor-pointer ${
              isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white" : "bg-slate-200/50 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
            }`}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Step Progress Bar */}
      <div className={`px-4 py-2.5 flex items-center justify-between border-b text-[9px] font-bold transition-colors ${
        isDark ? "bg-slate-900/50 border-slate-800 text-slate-400" : "bg-slate-50/50 border-slate-200/40 text-slate-500"
      }`}>
        <div className="flex items-center gap-1.5">
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
            step >= 0 ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
          }`}>1</span>
          <span className={step === 0 ? "text-blue-500 font-black" : ""}>Info</span>
        </div>
        <div className="flex-1 h-0.5 mx-2 bg-slate-200 dark:bg-slate-800" />
        <div className="flex items-center gap-1.5">
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
            step >= 1 ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-400"
          }`}>2</span>
          <span className={step === 1 ? "text-blue-500 font-black" : ""}>Friends</span>
        </div>
        <div className="flex-1 h-0.5 mx-2 bg-slate-200 dark:bg-slate-800" />
        <div className="flex items-center gap-1.5">
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
            step >= 2 ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-400"
          }`}>3</span>
          <span className={step === 2 ? "text-blue-500 font-black" : ""}>Review</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2 text-[10px] rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 font-bold flex items-center gap-1.5"
          >
            <span>⚠️ {errorMsg}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 0: GENERAL TRIP DETAILS */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              <div className="text-center py-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center mb-1 text-blue-500">
                  <Compass size={20} className="animate-pulse" />
                </div>
                <h3 className="text-xs font-black tracking-tight">Where are you going?</h3>
                <p className="text-[10px] text-slate-500">Set up your budget limits and base currency.</p>
              </div>

              {/* Trip Name Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Trip Title / Destination
                </label>
                <input
                  type="text"
                  value={tripName}
                  onChange={(e) => {
                    setTripName(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="e.g. Goa Roadtrip 🏖️, EuroTour 2026"
                  maxLength={30}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-1 focus:outline-hidden font-medium ${
                    isDark 
                      ? "bg-slate-900 border-slate-850 text-white focus:ring-blue-600 focus:border-blue-600" 
                      : "bg-white border-slate-200 text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                />
              </div>

              {/* Currency Selector Row */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Select Base Currency
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { symbol: "₹", desc: "INR" },
                    { symbol: "$", desc: "USD" },
                    { symbol: "€", desc: "EUR" },
                    { symbol: "£", desc: "GBP" }
                  ].map((cur) => (
                    <button
                      key={cur.symbol}
                      type="button"
                      onClick={() => setCurrency(cur.symbol)}
                      className={`py-1.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        currency === cur.symbol
                          ? "bg-blue-600 border-blue-600 text-white ring-2 ring-blue-500/10 font-bold"
                          : isDark
                            ? "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-3xs"
                      }`}
                    >
                      <span className="text-xs font-black">{cur.symbol}</span>
                      <span className="text-[8px] opacity-75 font-mono">{cur.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trip Budget Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Maximum Trip Budget Limit ({currency})
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400 text-xs font-bold font-mono">
                    {currency}
                  </div>
                  <input
                    type="number"
                    value={tripBudget}
                    onChange={(e) => {
                      setTripBudget(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="e.g. 50000"
                    min="1"
                    className={`w-full pl-7 pr-3 py-2 text-xs rounded-xl border focus:ring-1 focus:outline-hidden font-bold ${
                      isDark 
                        ? "bg-slate-900 border-slate-850 text-white focus:ring-blue-600 focus:border-blue-600" 
                        : "bg-white border-slate-200 text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  />
                </div>
                <span className="text-[9px] text-slate-500 block leading-tight">
                  Budget guard will alert you inside the simulated phone drawer when expenses cross this limit!
                </span>
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={validateAndGoToFriends}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer mt-3"
              >
                <span>Continue to Friends</span>
                <ArrowRight size={13} />
              </button>
            </motion.div>
          )}

          {/* STEP 1: ADD FRIENDS */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              <div className="text-center py-1">
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center mb-1 text-blue-500">
                  <Users size={18} />
                </div>
                <h3 className="text-xs font-black tracking-tight">Who's joining the trip?</h3>
                <p className="text-[10px] text-slate-500">Add at least 2 friends (Max 7) to start splitting.</p>
              </div>

              {/* Friend Add Input Block */}
              <form onSubmit={handleAddFriend} className="flex gap-1.5">
                <input
                  type="text"
                  value={friendInput}
                  onChange={(e) => {
                    setFriendInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Friend's Name (e.g. Alice)"
                  maxLength={15}
                  className={`flex-1 px-3 py-2 text-xs rounded-xl border focus:ring-1 focus:outline-hidden font-medium ${
                    isDark 
                      ? "bg-slate-900 border-slate-850 text-white focus:ring-blue-600 focus:border-blue-600" 
                      : "bg-white border-slate-200 text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                />
                <button
                  type="submit"
                  className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  <span className="ml-0.5">Add</span>
                </button>
              </form>

              {/* Friends list container */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span>Participants ({friends.length}/7)</span>
                  {friends.length < 2 && (
                    <span className="text-amber-500">Add {2 - friends.length} more</span>
                  )}
                </div>

                {friends.length === 0 ? (
                  <div className={`p-4 rounded-2xl border border-dashed text-center ${
                    isDark ? "bg-slate-950/20 border-slate-850 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}>
                    <p className="text-[10px] italic">No friends added yet. Type a name and click Add!</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {friends.map((friend, idx) => (
                      <motion.div
                        key={idx}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`px-3 py-2 rounded-xl border flex justify-between items-center text-xs transition-colors ${
                          isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-150 shadow-3xs"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-500 text-white font-extrabold text-[9px] flex items-center justify-center shadow-3xs">
                            {friend[0].toUpperCase()}
                          </div>
                          <span className="font-bold">{friend}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(idx)}
                          className="p-1 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setStep(0);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    isDark
                      ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={validateAndGoToConfirm}
                  disabled={friends.length < 2}
                  className={`col-span-2 py-2 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    friends.length >= 2
                      ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10"
                      : "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-550 cursor-not-allowed"
                  }`}
                >
                  <span>Review Trip</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SUMMARY & START */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="space-y-4 text-center"
            >
              <div className="py-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-1 text-emerald-500">
                  <Sparkles size={24} className="animate-bounce" />
                </div>
                <h3 className="text-xs font-black tracking-tight text-emerald-500">Almost ready!</h3>
                <p className="text-[10px] text-slate-500">Here's a snapshot of your new trip settings.</p>
              </div>

              {/* Trip Summary Card */}
              <div className={`p-4 rounded-2xl border text-left space-y-3 ${
                isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200/50 shadow-3xs"
              }`}>
                <div>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Destination</span>
                  <h4 className="text-xs font-extrabold text-blue-500 mt-0.5">{tripName}</h4>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-200 dark:border-slate-800 pt-2">
                  <div>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Budget Limit</span>
                    <p className="text-xs font-black mt-0.5">{currency}{parseFloat(tripBudget).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Currency</span>
                    <p className="text-xs font-black mt-0.5 uppercase">{currency} ({currency === "₹" ? "INR" : currency === "$" ? "USD" : currency === "€" ? "EUR" : "GBP"})</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-2">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Friends Splitting ({friends.length})</span>
                  <div className="flex flex-wrap gap-1">
                    {friends.map((friend, idx) => (
                      <span
                        key={idx}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                          isDark 
                            ? "bg-slate-950 border-slate-850 text-slate-300" 
                            : "bg-white border-slate-150 text-slate-700 shadow-3xs"
                        }`}
                      >
                        {friend}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setStep(1);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    isDark
                      ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleLaunchTrip}
                  className="col-span-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} />
                  <span>Launch TripSplit!</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic footer decoration */}
      <div className={`px-4 py-2 border-t text-center text-[8px] font-bold text-slate-500 transition-colors ${
        isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-100 bg-slate-50/40"
      }`}>
        ⚡ All set up inputs will compile and run on simulated device locally
      </div>
    </div>
  );
}
