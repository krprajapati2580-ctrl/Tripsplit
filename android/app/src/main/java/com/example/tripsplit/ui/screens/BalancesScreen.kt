package com.example.tripsplit.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.tripsplit.models.DebtTransfer
import com.example.tripsplit.models.User
import kotlin.math.abs

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BalancesScreen(
    users: List<User>,
    balances: Map<String, Double>,
    debts: List<DebtTransfer>,
    formatCurrency: (Double) -> String
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Trip Balances", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.secondaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onSecondaryContainer
                )
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Section 1: User Ledger Status
            item {
                Text(
                    text = "Individual Standings",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }

            items(users) { user ->
                val balance = balances[user.id] ?: 0.0
                UserBalanceItem(user = user, balance = balance, formatCurrency = formatCurrency)
            }

            // Divider Section
            item {
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                Text(
                    text = "Simplified Settlements",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }

            // Section 2: Recommended Debt Settlements
            if (debts.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceContainerHigh
                        )
                    ) {
                        Box(
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Text(
                                text = "All settled up! No transfers needed.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.outline
                            )
                        }
                    }
                }
            } else {
                items(debts) { debt ->
                    DebtSettlementCard(debt = debt, formatCurrency = formatCurrency)
                }
            }
        }
    }
}

@Composable
fun UserBalanceItem(user: User, balance: Double, formatCurrency: (Double) -> String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainerLow
        )
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = user.name,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold
            )

            val text = when {
                balance > 0.01 -> "Is owed " + formatCurrency(balance)
                balance < -0.01 -> "Owes " + formatCurrency(abs(balance))
                else -> "All settled"
            }

            val color = when {
                balance > 0.01 -> MaterialTheme.colorScheme.primary
                balance < -0.01 -> MaterialTheme.colorScheme.error
                else -> MaterialTheme.colorScheme.outline
            }

            Text(
                text = text,
                style = MaterialTheme.typography.bodyLarge,
                color = color,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun DebtSettlementCard(debt: DebtTransfer, formatCurrency: (Double) -> String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.tertiaryContainer
        )
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = "${debt.fromUser.name} pays ${debt.toUser.name}",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onTertiaryContainer
                )
                Text(
                    text = "Settle split balance",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onTertiaryContainer.copy(alpha = 0.7f)
                )
            }

            Text(
                text = formatCurrency(debt.amount),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onTertiaryContainer
            )
        }
    }
}
