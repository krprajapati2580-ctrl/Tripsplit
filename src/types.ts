export interface User {
  id: string;
  name: string;
}

export interface ReceiptItem {
  name: string;
  price: number;
  type: "FOOD" | "TAX";
  splitUserIds: string[]; // Who splits this item
}

export interface Expense {
  id: string;
  description: string;
  totalAmount: number;
  payerId: string;
  involvedUserIds: string[]; // List of users who split the expense
  items?: ReceiptItem[]; // Optional itemized split list
}

export interface Balance {
  userId: string;
  userName: string;
  amount: number; // Positive means they are owed, negative means they owe money
}

export interface Debt {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export interface PastTrip {
  id: string;
  name: string;
  budget: number;
  currency: string;
  users: User[];
  expenses: Expense[];
  createdAt: string;
}

