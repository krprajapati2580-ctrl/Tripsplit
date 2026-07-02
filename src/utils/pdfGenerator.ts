import { jsPDF } from "jspdf";
import { User, Expense } from "../types";
import { calculateBalances, calculateSimplifiedDebts } from "../utils";

interface GeneratePDFParams {
  tripName: string;
  users: User[];
  expenses: Expense[];
  currencySymbol: string;
  tripBudget: number;
}

// Helper to format currency values safely for PDF generation
function formatPdfCurrency(amount: number, symbol: string): string {
  let safeSymbol = symbol;
  if (symbol === "₹") {
    safeSymbol = "Rs.";
  } else if (symbol === "€") {
    safeSymbol = "EUR";
  } else if (symbol === "£") {
    safeSymbol = "GBP";
  } else if (symbol === "$") {
    safeSymbol = "$";
  }

  let formattedNumber = "";
  try {
    if (symbol === "₹") {
      formattedNumber = amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } else {
      formattedNumber = amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  } catch (e) {
    formattedNumber = amount.toFixed(2);
  }

  if (safeSymbol === "Rs." || safeSymbol === "EUR" || safeSymbol === "GBP") {
    return `${safeSymbol} ${formattedNumber}`;
  }
  return `${safeSymbol}${formattedNumber}`;
}

export function downloadPdfReport({
  tripName,
  users,
  expenses,
  currencySymbol,
  tripBudget
}: GeneratePDFParams) {
  // Create jsPDF instance
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const totalTripExpenses = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);

  // 1. Top Decorative Brand Bar (Light Blue Gradient representation)
  doc.setFillColor(59, 130, 246); // Blue 500
  doc.rect(0, 0, 210, 4, "F");

  // 2. Branding Header
  // Logo Icon shape (Origami split style matching TripSplit)
  // Left Wing (Vibrant Blue/Indigo)
  doc.setFillColor(59, 130, 246); // Blue
  doc.triangle(23, 16.0, 16.7, 27.7, 23, 25.0, "F");

  // Right Wing (Vibrant Cyan)
  doc.setFillColor(6, 182, 212); // Cyan
  doc.triangle(23, 16.0, 23, 25.0, 29.3, 27.7, "F");

  // Center Split Core Divider
  doc.setDrawColor(248, 250, 252); // White-slate
  doc.setLineWidth(0.4);
  doc.line(23, 16.0, 23, 25.0);

  // Decorative Compass Dot (Travel theme)
  doc.setFillColor(99, 102, 241); // Indigo
  doc.circle(23, 14.56, 0.54, "F");
  doc.setFillColor(59, 130, 246); // Blue
  doc.circle(23, 14.56, 0.4, "F");

  // Header Typography
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text("TripSplit", 34, 21);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text("Offline Expense Split & Settlement Ledger", 34, 26);

  // Top-Right Metadata
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(59, 130, 246);
  doc.text(tripName.toUpperCase() + " REPORT", 195, 20, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text("GENERATED: " + new Date().toLocaleDateString(), 195, 25, { align: "right" });

  // Sleek Divider
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.4);
  doc.line(15, 31, 195, 31);

  // 3. Beautiful Highlight summary Cards (Light Blue/Sky theme)
  // Printable width is 180mm (15mm to 195mm). Gaps: 6mm. Card Width: 56mm
  const cardW = 56;
  const cardH = 20;
  const cardY = 36;

  // Background rects
  doc.setFillColor(240, 249, 255); // Sky 50 background
  doc.rect(15, cardY, cardW, cardH, "F");
  doc.rect(77, cardY, cardW, cardH, "F");
  doc.rect(139, cardY, cardW, cardH, "F");

  // Left solid accent lines for cards
  doc.setFillColor(59, 130, 246); // Blue Left Bar
  doc.rect(15, cardY, 1.5, cardH, "F");
  doc.setFillColor(99, 102, 241); // Indigo Left Bar
  doc.rect(77, cardY, 1.5, cardH, "F");
  doc.setFillColor(6, 182, 212); // Cyan Left Bar
  doc.rect(139, cardY, 1.5, cardH, "F");

  // Typography inside Summary Cards
  // Card 1
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL BUDGET", 20, cardY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatPdfCurrency(tripBudget, currencySymbol), 20, cardY + 14);

  // Card 2
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL EXPENSES", 82, cardY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatPdfCurrency(totalTripExpenses, currencySymbol), 82, cardY + 14);

  // Card 3
  const remaining = tripBudget - totalTripExpenses;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(remaining >= 0 ? "REMAINING BALANCE" : "BUDGET OVER LIMIT", 144, cardY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  if (remaining >= 0) {
    doc.setTextColor(15, 23, 42);
  } else {
    doc.setTextColor(239, 68, 68); // Red if over-budget
  }
  doc.text(
    remaining >= 0 
      ? formatPdfCurrency(remaining, currencySymbol) 
      : `-${formatPdfCurrency(Math.abs(remaining), currencySymbol)}`,
    144,
    cardY + 14
  );

  // 4. Standings Column vs Settlements Column
  // Side by Side split: Left Column (15mm - 95mm), Right Column (115mm - 195mm)
  // This creates a generous 20mm center channel to prevent overlapping and provide a highly polished, clean layout
  const columnsY = 64;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("GROUP BALANCES", 15, columnsY);
  doc.text("PAYMENT SETTLEMENT PLAN", 115, columnsY);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(15, columnsY + 2, 95, columnsY + 2);
  doc.line(115, columnsY + 2, 195, columnsY + 2);

  // Draw Standings list
  const balances = calculateBalances(users, expenses);
  let leftY = columnsY + 8;

  users.forEach((u) => {
    const bal = balances[u.id] || 0;
    
    // Member Name
    doc.setFont("helvetica", "medium");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(u.name, 15, leftY);

    // Dynamic color badge representing net balance status (right-aligned to X=95)
    if (bal > 0.01) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129); // Emerald green for positive owed
      doc.text(`Owed +${formatPdfCurrency(bal, currencySymbol)}`, 95, leftY, { align: "right" });
    } else if (bal < -0.01) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(239, 68, 68); // Red for owes
      doc.text(`Owes -${formatPdfCurrency(Math.abs(bal), currencySymbol)}`, 95, leftY, { align: "right" });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // Settled state
      doc.text("Settle Up ✅", 95, leftY, { align: "right" });
    }

    // Row separator
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(15, leftY + 2, 95, leftY + 2);

    leftY += 6.5;
  });

  // Draw Debt Settlements List
  const debts = calculateSimplifiedDebts(users, expenses);
  let rightY = columnsY + 8;

  if (debts.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("All clean! No active debt payments needed. 🎉", 115, rightY);
  } else {
    debts.forEach((debt) => {
      // Payment Flow layout dynamically measured to prevent overlapping text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(debt.fromName, 115, rightY);

      const fromW = doc.getTextWidth(debt.fromName);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(" pays to ", 115 + fromW, rightY);

      const paysW = doc.getTextWidth(" pays to ");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(debt.toName, 115 + fromW + paysW, rightY);

      // Amount on right (aligned right to X=195)
      doc.setFont("helvetica", "bold");
      doc.setTextColor(59, 130, 246); // Blue color for payments
      doc.text(formatPdfCurrency(debt.amount, currencySymbol), 195, rightY, { align: "right" });

      // Row separator
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(115, rightY + 2, 195, rightY + 2);

      rightY += 6.5;
    });
  }

  // 5. Itemized Expense History Section
  let tableSectionY = Math.max(leftY, rightY) + 6;

  // Keep safety space at bottom
  if (tableSectionY > 220) {
    doc.addPage();
    tableSectionY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("ITEMIZED EXPENSES", 15, tableSectionY);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(15, tableSectionY + 2, 195, tableSectionY + 2);

  let expenseY = tableSectionY + 8;

  // Table header background (Light blue/gray background for header)
  doc.setFillColor(240, 249, 255);
  doc.rect(15, expenseY - 4.5, 180, 6.5, "F");

  // Headers
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(59, 130, 246);
  doc.text("DESCRIPTION", 17, expenseY);
  doc.text("PAID BY", 95, expenseY);
  doc.text("SPLIT PARTNERS", 130, expenseY);
  doc.text("AMOUNT", 193, expenseY, { align: "right" });

  expenseY += 6;

  if (expenses.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("No expenses logged yet for this trip.", 17, expenseY);
  } else {
    expenses.forEach((exp) => {
      // Dynamic Page break handler inside iteration to prevent clipping
      if (expenseY > 270) {
        doc.addPage();
        expenseY = 20;

        // Redraw Table Headers on new page
        doc.setFillColor(240, 249, 255);
        doc.rect(15, expenseY - 4.5, 180, 6.5, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(59, 130, 246);
        doc.text("DESCRIPTION", 17, expenseY);
        doc.text("PAID BY", 95, expenseY);
        doc.text("SPLIT PARTNERS", 130, expenseY);
        doc.text("AMOUNT", 193, expenseY, { align: "right" });

        expenseY += 6;
      }

      const payerName = users.find((u) => u.id === exp.payerId)?.name || "Unknown";

      // Split Partners text
      let splitText = "";
      if (exp.items && exp.items.length > 0) {
        splitText = "Itemized Proportional Split";
      } else {
        const involvedNames = exp.involvedUserIds
          .map((id) => users.find((u) => u.id === id)?.name || "")
          .filter(Boolean);
        
        if (involvedNames.length === users.length) {
          splitText = "Everyone";
        } else {
          splitText = involvedNames.join(", ");
        }
      }

      // Truncate strings beautifully to fit column layouts
      let displayDesc = exp.description;
      if (displayDesc.length > 42) {
        displayDesc = displayDesc.substring(0, 39) + "...";
      }
      
      let displaySplit = splitText;
      if (displaySplit.length > 32) {
        displaySplit = displaySplit.substring(0, 29) + "...";
      }

      // Values
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(displayDesc, 17, expenseY);
      doc.text(payerName, 95, expenseY);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(displaySplit, 130, expenseY);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(formatPdfCurrency(exp.totalAmount, currencySymbol), 193, expenseY, { align: "right" });

      // Row separation line
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.15);
      doc.line(15, expenseY + 2, 195, expenseY + 2);

      expenseY += 6;
    });
  }

  // 6. Draw standard footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Top border on top of header on subsequent pages if necessary
    if (i > 1) {
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, 210, 4, "F");
    }

    // Bottom decorative lines
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(15, 282, 195, 282);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("TripSplit • Kotlin Jetpack Compose & React Web Simulator", 15, 287);
    doc.text(`Page ${i} of ${totalPages}`, 195, 287, { align: "right" });
  }

  // Trigger browser download dialog
  const cleanTripName = tripName.toLowerCase().replace(/[^a-z0-9]/gi, "_");
  doc.save(`tripsplit_report_${cleanTripName}.pdf`);
}
