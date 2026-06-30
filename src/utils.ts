import { User, Expense, Debt } from "./types";

/**
 * Calculates net balances for all users.
 * Positive = user is owed money (they paid more than their share).
 * Negative = user owes money (they paid less than their share).
 */
export function calculateBalances(users: User[], expenses: Expense[]): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const u of users) {
    balances[u.id] = 0;
  }

  for (const exp of expenses) {
    const amount = exp.totalAmount;
    const payerId = exp.payerId;

    // Payer is credited the total amount they spent
    balances[payerId] = (balances[payerId] || 0) + amount;

    if (exp.items && exp.items.length > 0) {
      // Advanced itemized proportional tax allocation
      const foodItems = exp.items.filter((item) => item.type === "FOOD");
      const taxItems = exp.items.filter((item) => item.type === "TAX");

      const foodSubtotal = foodItems.reduce((sum, item) => sum + item.price, 0);
      const taxTotal = taxItems.reduce((sum, item) => sum + item.price, 0);

      const userFoodShares: Record<string, number> = {};
      for (const u of users) {
        userFoodShares[u.id] = 0;
      }

      for (const item of foodItems) {
        const splitSize = item.splitUserIds.length;
        if (splitSize > 0) {
          const perPersonCost = item.price / splitSize;
          for (const userId of item.splitUserIds) {
            userFoodShares[userId] = (userFoodShares[userId] || 0) + perPersonCost;
          }
        }
      }

      // Distribute tax proportionally
      for (const u of users) {
        const foodShare = userFoodShares[u.id] || 0;
        const percentage = foodSubtotal > 0 ? (foodShare / foodSubtotal) : 0;
        const taxShare = percentage * taxTotal;
        const totalShare = foodShare + taxShare;

        balances[u.id] = (balances[u.id] || 0) - totalShare;
      }
    } else {
      // Standard equal split
      const involved = exp.involvedUserIds;
      if (involved.length === 0) continue;
      const splitAmount = amount / involved.length;

      // Each involved user owes their split share
      for (const userId of involved) {
        balances[userId] = (balances[userId] || 0) - splitAmount;
      }
    }
  }

  return balances;
}

/**
 * Minimizes debt transfers ("who owes how much to whom").
 * Matches debtors with creditors to settle accounts efficiently.
 */
export function calculateSimplifiedDebts(users: User[], expenses: Expense[]): Debt[] {
  const balances = calculateBalances(users, expenses);
  const debtors: { user: User; oweAmount: number }[] = [];
  const creditors: { user: User; receiveAmount: number }[] = [];

  for (const user of users) {
    const balance = balances[user.id] || 0;
    if (balance < -0.01) {
      debtors.push({ user, oweAmount: Math.abs(balance) });
    } else if (balance > 0.01) {
      creditors.push({ user, receiveAmount: balance });
    }
  }

  const transfers: Debt[] = [];
  let i = 0;
  let j = 0;

  // Make a shallow copy of lists so we can decrement values
  const debtorsList = debtors.map(d => ({ ...d }));
  const creditorsList = creditors.map(c => ({ ...c }));

  while (i < debtorsList.length && j < creditorsList.length) {
    const debtor = debtorsList[i];
    const creditor = creditorsList[j];

    const transferAmount = Math.min(debtor.oweAmount, creditor.receiveAmount);

    if (transferAmount > 0.01) {
      transfers.push({
        fromId: debtor.user.id,
        fromName: debtor.user.name,
        toId: creditor.user.id,
        toName: creditor.user.name,
        amount: Number(transferAmount.toFixed(2))
      });
    }

    debtor.oweAmount -= transferAmount;
    creditor.receiveAmount -= transferAmount;

    if (debtor.oweAmount < 0.01) i++;
    if (creditor.receiveAmount < 0.01) j++;
  }

  return transfers;
}

/**
 * Formats an amount dynamically based on the active currency symbol.
 * If the Rupee symbol ('₹') is active, use the Indian numbering format.
 */
export function formatCurrency(amount: number, symbol: string): string {
  try {
    if (symbol === "₹") {
      return symbol + amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    // Fallback for others like $, €, £
    return symbol + amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch (e) {
    // Basic fallback if toLocaleString fails or isn't supported as expected
    return symbol + amount.toFixed(2);
  }
}

