import React, { useState } from "react";
import { Search, X, Users, Check, Phone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface Contact {
  name: string;
  phone: string;
  email: string;
}

// Simulated list of high-quality realistic contacts
const MOCK_CONTACTS: Contact[] = [
  { name: "Alice Cooper", phone: "+91 98234-56789", email: "alice@example.com" },
  { name: "Bob Dylan", phone: "+91 91234-56789", email: "bob@example.com" },
  { name: "Charlie Puth", phone: "+91 95432-10987", email: "charlie@example.com" },
  { name: "David Beckham", phone: "+91 98765-43210", email: "david@example.com" },
  { name: "Emma Watson", phone: "+91 99887-76655", email: "emma@example.com" },
  { name: "Frank Sinatra", phone: "+91 91122-33445", email: "frank@example.com" },
  { name: "Grace Hopper", phone: "+91 90000-11111", email: "grace@example.com" },
  { name: "Henry Cavill", phone: "+91 92222-33333", email: "henry@example.com" },
  { name: "Isabella Ross", phone: "+91 93333-44444", email: "isabella@example.com" },
  { name: "John Doe", phone: "+91 94444-55555", email: "john@example.com" },
  { name: "Karan Johar", phone: "+91 95555-66666", email: "karan@example.com" },
  { name: "Lata Mangeshkar", phone: "+91 96666-77777", email: "lata@example.com" },
  { name: "Michael Jackson", phone: "+91 97777-88888", email: "michael@example.com" },
  { name: "Neha Kakkar", phone: "+91 98888-99999", email: "neha@example.com" },
  { name: "Oscar Wilde", phone: "+91 99999-00000", email: "oscar@example.com" }
];

interface ContactPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contact: Contact) => void;
  theme: "light" | "dark";
}

export function ContactPickerModal({ isOpen, onClose, onSelect, theme }: ContactPickerModalProps) {
  const isDark = theme === "dark";
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = MOCK_CONTACTS.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs z-50 rounded-[32px] cursor-pointer"
          />

          {/* Drawer sheet sliding from bottom inside simulator screen */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 225 }}
            className={`absolute bottom-0 left-0 right-0 max-h-[85%] rounded-t-[28px] shadow-2xl z-50 flex flex-col overflow-hidden transition-colors duration-300 border-t ${
              isDark 
                ? "bg-slate-900 border-slate-800 text-white" 
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Handle Bar */}
            <div className="w-12 h-1.5 rounded-full mx-auto my-3 bg-slate-400/30 shrink-0" />

            {/* Header */}
            <div className="px-5 pb-3 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-tight">Import from Contacts</h3>
                  <p className="text-[9px] text-slate-400 font-bold">Select a friend to import</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                }`}
              >
                <X size={14} />
              </button>
            </div>

            {/* Search Input */}
            <div className="px-4 pb-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:ring-1 focus:outline-hidden font-medium transition-all ${
                    isDark
                      ? "bg-slate-950 border-slate-800 focus:border-blue-500 text-slate-100 placeholder-slate-650"
                      : "bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
              {filteredContacts.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[10px] text-slate-500 italic font-medium">No matching contacts found.</p>
                </div>
              ) : (
                filteredContacts.map((contact, idx) => {
                  const colors = [
                    "bg-orange-500/10 border-orange-500/20 text-orange-500",
                    "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
                    "bg-blue-500/10 border-blue-500/20 text-blue-500",
                    "bg-purple-500/10 border-purple-500/20 text-purple-500",
                    "bg-rose-500/10 border-rose-500/20 text-rose-500",
                  ];
                  const cIdx = contact.name.charCodeAt(0) % colors.length;
                  const colorSet = colors[cIdx];

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        onSelect(contact);
                        onClose();
                      }}
                      className={`p-2.5 rounded-xl border flex justify-between items-center text-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] select-none ${
                        isDark
                          ? "bg-slate-950 border-slate-850 hover:bg-slate-850 hover:border-slate-800"
                          : "bg-white border-slate-150 hover:border-slate-200 hover:shadow-3xs"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {/* Circle badge */}
                        <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-black text-[10px] shrink-0 ${colorSet}`}>
                          {contact.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className={`font-bold block truncate text-[11px] ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                            {contact.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono block truncate flex items-center gap-1 mt-0.5">
                            <Phone size={8} />
                            <span>{contact.phone}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 uppercase tracking-wide shrink-0">
                        Import
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
