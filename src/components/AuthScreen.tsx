import React, { useState, useEffect } from "react";
import { User as UserIcon, Mail, Phone, Smartphone, ArrowRight, ShieldCheck, HelpCircle, Laptop } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TripSplitLogo } from "./TripSplitLogo";

interface SavedAccount {
  name: string;
  email: string;
  mobile: string;
}

interface AuthScreenProps {
  theme: "light" | "dark";
  onAuthenticate: (name: string, email: string, mobile: string) => void;
}

export function AuthScreen({ theme, onAuthenticate }: AuthScreenProps) {
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<"signup" | "login">("signup");
  
  // Sign Up Form States
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpMobile, setSignUpMobile] = useState("");
  const [signUpError, setSignUpError] = useState<string | null>(null);

  // Log In Form States
  const [logInIdentifier, setLogInIdentifier] = useState(""); // Email or Mobile
  const [logInError, setLogInError] = useState<string | null>(null);

  // Loading/Success Animations
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Saved accounts list for local login simulation
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("tripsplit_saved_accounts");
    if (saved) {
      try {
        setSavedAccounts(JSON.parse(saved));
      } catch (e) {
        console.error("Error reading saved accounts", e);
      }
    } else {
      // Seed some default accounts to log in with
      const defaults: SavedAccount[] = [
        { name: "K.R. Prajapati", email: "krprajapati.2580@gmail.com", mobile: "9876543210" },
        { name: "Alice Cooper", email: "alice@example.com", mobile: "9123456789" }
      ];
      localStorage.setItem("tripsplit_saved_accounts", JSON.stringify(defaults));
      setSavedAccounts(defaults);
    }
  }, []);

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);

    const name = signUpName.trim();
    const email = signUpEmail.trim();
    const mobile = signUpMobile.trim();

    if (!name) {
      setSignUpError("Please enter your name.");
      return;
    }
    if (!email || !email.includes("@")) {
      setSignUpError("Please enter a valid email address.");
      return;
    }
    if (!mobile || mobile.length < 10) {
      setSignUpError("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Trigger cool loading sequence
    setIsLoading(true);
    setTimeout(() => {
      // Add to saved accounts list
      const updatedAccounts = [
        ...savedAccounts.filter((acc) => acc.email !== email && acc.mobile !== mobile),
        { name, email, mobile }
      ];
      localStorage.setItem("tripsplit_saved_accounts", JSON.stringify(updatedAccounts));
      setSavedAccounts(updatedAccounts);
      
      setIsLoading(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        onAuthenticate(name, email, mobile);
      }, 1000);
    }, 1500);
  };

  const handleLogIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLogInError(null);

    const input = logInIdentifier.trim().toLowerCase();
    if (!input) {
      setLogInError("Please enter your email or mobile number.");
      return;
    }

    // Search accounts list
    const found = savedAccounts.find(
      (acc) => acc.email.toLowerCase() === input || acc.mobile === input
    );

    if (!found) {
      setLogInError("No account found with this email or mobile. Try signing up!");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        onAuthenticate(found.name, found.email, found.mobile);
      }, 1000);
    }, 1500);
  };

  const handleQuickLogIn = (acc: SavedAccount) => {
    setIsLoading(true);
    setLogInError(null);
    setSignUpError(null);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        onAuthenticate(acc.name, acc.email, acc.mobile);
      }, 1000);
    }, 1200);
  };

  return (
    <div className={`flex flex-col h-full overflow-y-auto px-5 py-6 transition-colors duration-300 ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-[#f8fafc] text-slate-900"
    }`}>
      {/* Branding Header */}
      <div className="text-center my-4">
        <div className="flex justify-center mb-3">
          <TripSplitLogo size={56} />
        </div>
        <h2 className={`text-lg font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
          TripSplit
        </h2>
        <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"} font-semibold uppercase tracking-wider mt-0.5`}>
          Kotlin Jetpack Compose Simulator
        </p>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center py-12"
          >
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            </div>
            <p className="text-xs font-bold mt-4 text-blue-500">Contacting Auth Server...</p>
            <p className="text-[10px] text-slate-500 mt-1">Securing token & synchronizing state</p>
          </motion.div>
        ) : isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center py-12"
          >
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <ShieldCheck size={32} className="animate-bounce" />
            </div>
            <p className="text-xs font-black mt-4 text-emerald-500 uppercase tracking-wider">Access Granted!</p>
            <p className="text-[10px] text-slate-500 mt-1">Loading Jetpack Compose App Interface...</p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col"
          >
            {/* Custom Tab Bar */}
            <div className={`p-1 rounded-xl flex mb-5 border ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
            }`}>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signup");
                  setSignUpError(null);
                  setLogInError(null);
                }}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "signup"
                    ? "bg-blue-600 text-white shadow-xs"
                    : (isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900")
                }`}
              >
                Sign In (New User)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setSignUpError(null);
                  setLogInError(null);
                }}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "login"
                    ? "bg-blue-600 text-white shadow-xs"
                    : (isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900")
                }`}
              >
                Log In
              </button>
            </div>

            {/* ERROR SUMMARY */}
            {activeTab === "signup" && signUpError && (
              <div className="p-2.5 mb-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold">
                ⚠️ {signUpError}
              </div>
            )}
            {activeTab === "login" && logInError && (
              <div className="p-2.5 mb-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold">
                ⚠️ {logInError}
              </div>
            )}

            {/* TAB CONTENT: SIGN IN (NEW USER) */}
            {activeTab === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-3.5 flex-1">
                {/* Name */}
                <div className="space-y-1 text-left">
                  <label className={`text-[9px] font-extrabold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Your Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                    <input
                      type="text"
                      required
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="e.g. K.R. Prajapati"
                      className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border focus:ring-1 focus:outline-hidden font-medium ${
                        isDark 
                          ? "bg-slate-900 border-slate-800 text-white focus:ring-blue-600 focus:border-blue-600" 
                          : "bg-white border-slate-200 text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1 text-left">
                  <label className={`text-[9px] font-extrabold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Email ID
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="e.g. name@example.com"
                      className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border focus:ring-1 focus:outline-hidden font-medium ${
                        isDark 
                          ? "bg-slate-900 border-slate-800 text-white focus:ring-blue-600 focus:border-blue-600" 
                          : "bg-white border-slate-200 text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div className="space-y-1 text-left">
                  <label className={`text-[9px] font-extrabold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                    <input
                      type="tel"
                      required
                      value={signUpMobile}
                      onChange={(e) => {
                        // Allow only numbers
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setSignUpMobile(val);
                      }}
                      placeholder="e.g. 9876543210"
                      maxLength={10}
                      className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border focus:ring-1 focus:outline-hidden font-medium ${
                        isDark 
                          ? "bg-slate-900 border-slate-800 text-white focus:ring-blue-600 focus:border-blue-600" 
                          : "bg-white border-slate-200 text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-2 text-left">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT: LOG IN */}
            {activeTab === "login" && (
              <div className="space-y-4 text-left flex-1 flex flex-col justify-between">
                <form onSubmit={handleLogIn} className="space-y-3">
                  <div className="space-y-1">
                    <label className={`text-[9px] font-extrabold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      Registered Email or Mobile
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                      <input
                        type="text"
                        required
                        value={logInIdentifier}
                        onChange={(e) => setLogInIdentifier(e.target.value)}
                        placeholder="e.g. krprajapati.2580@gmail.com"
                        className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border focus:ring-1 focus:outline-hidden font-medium ${
                          isDark 
                            ? "bg-slate-900 border-slate-800 text-white focus:ring-blue-600 focus:border-blue-600" 
                            : "bg-white border-slate-200 text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Authenticate</span>
                    <ArrowRight size={13} />
                  </button>
                </form>

                {/* SAVED ACCOUNTS SECTION */}
                {savedAccounts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-150/10">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                      💾 Saved Devices & Accounts
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {savedAccounts.map((acc, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleQuickLogIn(acc)}
                          className={`p-2.5 rounded-xl border flex justify-between items-center text-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] select-none ${
                            isDark
                              ? "bg-slate-900 border-slate-850 hover:bg-slate-850 hover:border-slate-800"
                              : "bg-white border-slate-150 hover:border-slate-200 hover:shadow-3xs"
                          }`}
                          title={`Log in as ${acc.name}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-extrabold text-[10px] flex items-center justify-center">
                              {acc.name ? acc.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "ME"}
                            </div>
                            <div className="min-w-0">
                              <span className={`font-bold block truncate text-[11px] ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                                {acc.name}
                              </span>
                              <span className="text-[8px] text-slate-400 font-mono block truncate">
                                {acc.email} • {acc.mobile}
                              </span>
                            </div>
                          </div>
                          <div className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 uppercase tracking-wide">
                            Auto Log In
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trust disclaimer */}
            <div className="text-center mt-6 flex items-center justify-center gap-1 text-[8px] text-slate-500 font-medium">
              <Laptop size={10} className="text-slate-400" />
              <span>Full-stack Jetpack state is persisted locally.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
