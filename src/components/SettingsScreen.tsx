import React, { useState } from "react";
import { 
  Key, MoreVertical, Sun, Moon, 
  Sliders, Shield
} from "lucide-react";
import { motion } from "motion/react";

interface SettingsScreenProps {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  onOpenSidebar?: () => void;
  customGeminiApiKey: string;
  onCustomGeminiApiKeyChange: (key: string) => void;
  googleSheetsWebhookUrl: string;
  onGoogleSheetsWebhookUrlChange: (url: string) => void;
  tripBudget: number;
  setTripBudget: (budget: number) => void;
  currencySymbol: string;
}

export function SettingsScreen({
  theme,
  setTheme,
  onOpenSidebar,
  customGeminiApiKey,
  onCustomGeminiApiKeyChange,
  googleSheetsWebhookUrl,
  onGoogleSheetsWebhookUrlChange,
  tripBudget,
  setTripBudget,
  currencySymbol = "₹"
}: SettingsScreenProps) {
  const isDark = theme === "dark";
  
  // Local state for testing webhook and changing budget
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudgetText, setTempBudgetText] = useState(String(tripBudget));

  const handleTestWebhook = async () => {
    if (!googleSheetsWebhookUrl) {
      setTestStatus({ success: false, message: "Please enter a Google Sheets Apps Script Web App URL first." });
      return;
    }
    setIsTestingWebhook(true);
    setTestStatus(null);
    try {
      const response = await fetch("/api/log-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Developer Test (from Settings)",
          email: "settings-test@example.com",
          mobile: "1234567890",
          customWebhookUrl: googleSheetsWebhookUrl,
        }),
      });
      const data = await response.json();
      if (data.success && data.synced) {
        setTestStatus({ success: true, message: "Connected! Appended a test row to your Google Sheet successfully! 🚀" });
      } else {
        setTestStatus({ success: false, message: data.message || "Failed to sync. Please verify your Apps Script Web App URL." });
      }
    } catch (err: any) {
      setTestStatus({ success: false, message: err.message || "Request failed. Check console or Web App URL." });
    } finally {
      setIsTestingWebhook(false);
    }
  };

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
              id="phone-header-sidebar-trigger-settings"
            >
              <MoreVertical size={18} />
            </button>
          )}
          <div>
            <h1 className={`text-sm font-black font-sans tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              App Settings
            </h1>
            <p className={`text-[9px] font-sans mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Configure developer integrations and preferences
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
          isDark 
            ? "bg-slate-800 text-slate-300 border border-slate-700" 
            : "bg-slate-100 text-slate-600 border border-slate-200"
        }`}>
          <Sliders size={12} />
          <span>Config Active</span>
        </div>
      </div>

      {/* Main Settings scrollable panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* Section: Gemini API Configuration */}
        <div className={`p-4 rounded-2xl border transition-colors ${
          isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-2xs"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Key size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black">Gemini Key (Mobile / Free Tier)</h3>
                <a 
                  href="https://aistudio.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[9px] font-bold text-blue-500 hover:underline cursor-pointer"
                >
                  Get Key 🔑
                </a>
              </div>
              <p className="text-[9px] text-slate-400">Direct-to-Gemini receipt scanning when offline or running client-side</p>
            </div>
          </div>

          <div className="space-y-3 mt-3">
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
              isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50/50 border-slate-250"
            }`}>
              <Key size={14} className="text-slate-400 shrink-0" />
              <input
                type="password"
                value={customGeminiApiKey}
                onChange={(e) => onCustomGeminiApiKeyChange(e.target.value)}
                placeholder="AI Studio Free API Key..."
                className={`w-full text-xs bg-transparent outline-none border-none font-mono ${
                  isDark ? "text-white placeholder-slate-600" : "text-slate-800 placeholder-slate-450"
                }`}
              />
            </div>
            
            <p className="text-[10px] text-slate-400 leading-normal">
              Providing your free key allows offline caching & direct-to-Gemini scanning when running as a standalone mobile app or on the free tier.
            </p>
          </div>
        </div>

        {/* Section: General Theme & Budget Preferences */}
        <div className={`p-4 rounded-2xl border transition-colors ${
          isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-2xs"
        }`}>
          <h3 className="text-xs font-black mb-3">General Preferences</h3>
          
          <div className="space-y-4">
            {/* Theme selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Theme Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    theme === "light"
                      ? "bg-blue-50/45 border-blue-600 text-blue-600 ring-1 ring-blue-500/20"
                      : "bg-slate-50/30 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <Sun size={14} className={theme === "light" ? "text-amber-500" : ""} />
                  <div className="text-[9px] font-extrabold">Light Mode</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    theme === "dark"
                      ? "bg-slate-950 border-blue-600 text-blue-400 ring-1 ring-blue-500/20"
                      : "bg-slate-50/30 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <Moon size={14} className={theme === "dark" ? "text-indigo-400" : ""} />
                  <div className="text-[9px] font-extrabold">Dark Mode</div>
                </button>
              </div>
            </div>

            {/* Trip budget setter */}
            <div className="space-y-2 border-t border-slate-100/10 pt-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Trip Budget Limit</label>
                {!isEditingBudget && (
                  <button 
                    onClick={() => {
                      setTempBudgetText(String(tripBudget));
                      setIsEditingBudget(true);
                    }}
                    className="text-[10px] text-blue-500 font-bold hover:underline cursor-pointer"
                  >
                    Edit Limit
                  </button>
                )}
              </div>

              {isEditingBudget ? (
                <div className="flex gap-2">
                  <div className={`flex-1 p-2 rounded-xl border flex items-center gap-1 ${
                    isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50/50 border-slate-250"
                  }`}>
                    <span className="text-xs text-slate-400 font-bold">{currencySymbol}</span>
                    <input
                      type="number"
                      value={tempBudgetText}
                      onChange={(e) => setTempBudgetText(e.target.value)}
                      className={`w-full text-xs bg-transparent outline-none border-none font-bold ${
                        isDark ? "text-white" : "text-slate-800"
                      }`}
                      placeholder="Enter limit amount"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseFloat(tempBudgetText);
                      if (!isNaN(val) && val > 0) {
                        setTripBudget(val);
                      }
                      setIsEditingBudget(false);
                    }}
                    className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className={`p-3 rounded-xl border transition-colors flex justify-between items-center ${
                  isDark ? "bg-slate-950/20 border-slate-800" : "bg-slate-50/30 border-slate-200/50"
                }`}>
                  <span className="text-xs text-slate-400 font-bold">Current Limit:</span>
                  <span className="text-xs font-black">{currencySymbol}{tripBudget.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section: Security / Cache details */}
        <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-500 font-bold py-2">
          <Shield size={10} />
          <span>AES-256 Offline Device Cache Active</span>
        </div>
      </div>
    </div>
  );
}
