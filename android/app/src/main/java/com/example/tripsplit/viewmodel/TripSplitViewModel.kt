package com.example.tripsplit.viewmodel

import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import com.example.tripsplit.models.DebtTransfer
import com.example.tripsplit.models.Expense
import com.example.tripsplit.models.ItemType
import com.example.tripsplit.models.User
import java.util.UUID
import kotlin.math.abs
import kotlin.math.min

class TripSplitViewModel : ViewModel() {

    companion object {
        const val MAX_PARTICIPANTS = 7
    }

    // Active currency symbol (defaults to Indian Rupee '₹')
    val currencySymbol = mutableStateOf("₹")

    // Initial users on the trip
    val users = mutableStateListOf(
        User("1", "Alice"),
        User("2", "Bob"),
        User("3", "Charlie"),
        User("4", "David")
    )

    /**
     * Adds a new friend/participant to the trip.
     * Enforces the MAX_PARTICIPANTS limit of 7.
     */
    fun addUser(name: String): Boolean {
        if (name.isBlank()) return false
        if (users.size >= MAX_PARTICIPANTS) {
            return false
        }
        val newId = (users.size + 1).toString()
        users.add(User(newId, name.trim()))
        return true
    }

    // Reactive list of expenses
    val expenses = mutableStateListOf(
        Expense(
            id = "e1",
            description = "Gasoline for road trip",
            totalAmount = 60.00,
            payerId = "1", // Alice paid
            involvedUserIds = listOf("1", "2", "3", "4") // Split between all
        ),
        Expense(
            id = "e2",
            description = "Dinner & drinks",
            totalAmount = 120.00,
            payerId = "2", // Bob paid
            involvedUserIds = listOf("1", "2", "3") // David skipped dinner
        )
    )

    /**
     * Adds a new expense to the state list.
     */
    fun addExpense(description: String, totalAmount: Double, payerId: String, involvedUserIds: List<String>) {
        if (description.isBlank() || totalAmount <= 0.0 || payerId.isBlank() || involvedUserIds.isEmpty()) return

        val newExpense = Expense(
            id = UUID.randomUUID().toString(),
            description = description.trim(),
            totalAmount = totalAmount,
            payerId = payerId,
            involvedUserIds = involvedUserIds
        )
        expenses.add(newExpense)
    }

    /**
     * Calculates net balances for all users, with proportional TAX distribution
     * support for expenses that were itemized (e.g. via a future receipt scan).
     */
    fun calculateBalances(): Map<String, Double> {
        val balanceMap = users.associate { it.id to 0.0 }.toMutableMap()

        for (expense in expenses) {
            val amount = expense.totalAmount
            val payerId = expense.payerId

            // Payer gets back totalAmount
            balanceMap[payerId] = (balanceMap[payerId] ?: 0.0) + amount

            if (expense.items.isNotEmpty()) {
                val foodItems = expense.items.filter { it.type == ItemType.FOOD }
                val taxItems = expense.items.filter { it.type == ItemType.TAX }

                val foodSubtotal = foodItems.sumOf { it.price }
                val taxTotal = taxItems.sumOf { it.price }

                val userFoodShares = users.associate { it.id to 0.0 }.toMutableMap()
                for (item in foodItems) {
                    val splitSize = item.splitUserIds.size
                    if (splitSize > 0) {
                        val perPersonCost = item.price / splitSize
                        for (userId in item.splitUserIds) {
                            userFoodShares[userId] = (userFoodShares[userId] ?: 0.0) + perPersonCost
                        }
                    }
                }

                // Distribute proportional tax and food subtotal
                for (user in users) {
                    val foodShare = userFoodShares[user.id] ?: 0.0
                    val percentage = if (foodSubtotal > 0.0) foodShare / foodSubtotal else 0.0
                    val taxShare = percentage * taxTotal
                    val totalShare = foodShare + taxShare

                    balanceMap[user.id] = (balanceMap[user.id] ?: 0.0) - totalShare
                }
            } else {
                // Standard equal split
                val involved = expense.involvedUserIds
                if (involved.isEmpty()) continue
                val splitAmount = amount / involved.size

                for (userId in involved) {
                    balanceMap[userId] = (balanceMap[userId] ?: 0.0) - splitAmount
                }
            }
        }
        return balanceMap
    }

    /**
     * Minimizes debt transfers.
     */
    fun calculateSimplifiedDebts(): List<DebtTransfer> {
        val balances = calculateBalances()
        val debtors = mutableListOf<Pair<User, Double>>()
        val creditors = mutableListOf<Pair<User, Double>>()

        for (user in users) {
            val balance = balances[user.id] ?: 0.0
            if (balance < -0.01) {
                debtors.add(user to abs(balance))
            } else if (balance > 0.01) {
                creditors.add(user to balance)
            }
        }

        val transfers = mutableListOf<DebtTransfer>()
        var i = 0
        var j = 0

        val debtorsList = debtors.toMutableList()
        val creditorsList = creditors.toMutableList()

        while (i < debtorsList.size && j < creditorsList.size) {
            val debtorPair = debtorsList[i]
            val creditorPair = creditorsList[j]

            val debtor = debtorPair.first
            val oweAmount = debtorPair.second

            val creditor = creditorPair.first
            val receiveAmount = creditorPair.second

            val transferAmount = min(oweAmount, receiveAmount)

            if (transferAmount > 0.01) {
                transfers.add(DebtTransfer(debtor, creditor, transferAmount))
            }

            debtorsList[i] = debtor to (oweAmount - transferAmount)
            creditorsList[j] = creditor to (receiveAmount - transferAmount)

            if (debtorsList[i].second < 0.01) i++
            if (creditorsList[j].second < 0.01) j++
        }

        return transfers
    }

    fun formatCurrency(amount: Double): String {
        val symbol = currencySymbol.value
        return if (symbol == "₹") {
            val formatter = java.text.DecimalFormat("##,##,##,##0.00")
            symbol + formatter.format(amount)
        } else {
            String.format(java.util.Locale.US, "%s%,.2f", symbol, amount)
        }
    }
}
