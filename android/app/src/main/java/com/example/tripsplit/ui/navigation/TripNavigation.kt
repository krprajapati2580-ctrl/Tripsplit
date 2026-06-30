package com.example.tripsplit.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.example.tripsplit.ui.screens.AddExpenseScreen
import com.example.tripsplit.ui.screens.BalancesScreen
import com.example.tripsplit.ui.screens.DashboardScreen
import com.example.tripsplit.viewmodel.TripSplitViewModel

/**
 * Screen destinations.
 */
enum class Screen {
    Dashboard,
    Balances,
    AddExpense
}

@Composable
fun MainAppNavigation(
    viewModel: TripSplitViewModel
) {
    var currentScreen by remember { mutableStateOf(Screen.Dashboard) }

    Scaffold(
        bottomBar = {
            // Hide bottom bar when on full-screen AddExpense form
            if (currentScreen != Screen.AddExpense) {
                NavigationBar {
                    NavigationBarItem(
                        selected = currentScreen == Screen.Dashboard,
                        onClick = { currentScreen = Screen.Dashboard },
                        label = { Text("Dashboard") },
                        icon = { Icon(Icons.Default.List, contentDescription = "Dashboard") }
                    )
                    NavigationBarItem(
                        selected = currentScreen == Screen.Balances,
                        onClick = { currentScreen = Screen.Balances },
                        label = { Text("Balances") },
                        icon = { Icon(Icons.Default.Star, contentDescription = "Balances") }
                    )
                }
            }
        },
        floatingActionButton = {
            // Show FAB on Dashboard or Balances screen to trigger add-expense transition
            if (currentScreen != Screen.AddExpense) {
                FloatingActionButton(
                    onClick = { currentScreen = Screen.AddExpense },
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Expense")
                }
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues)) {
            when (currentScreen) {
                Screen.Dashboard -> {
                    DashboardScreen(
                        expenses = viewModel.expenses,
                        users = viewModel.users,
                        formatCurrency = { viewModel.formatCurrency(it) }
                    )
                }
                Screen.Balances -> {
                    val balances = viewModel.calculateBalances()
                    val debts = viewModel.calculateSimplifiedDebts()
                    BalancesScreen(
                        users = viewModel.users,
                        balances = balances,
                        debts = debts,
                        formatCurrency = { viewModel.formatCurrency(it) }
                    )
                }
                Screen.AddExpense -> {
                    AddExpenseScreen(
                        users = viewModel.users,
                        currencySymbol = viewModel.currencySymbol.value,
                        onNavigateBack = { currentScreen = Screen.Dashboard },
                        onExpenseSaved = { desc, amt, payerId, involved ->
                            viewModel.addExpense(desc, amt, payerId, involved)
                            currentScreen = Screen.Dashboard
                        }
                    )
                }
            }
        }
    }
}
