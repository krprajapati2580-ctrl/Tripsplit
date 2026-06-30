package com.example.tripsplit.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.tripsplit.models.User

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddExpenseScreen(
    users: List<User>,
    currencySymbol: String = "₹",
    onNavigateBack: () -> Unit,
    onExpenseSaved: (description: String, amount: Double, payerId: String, involvedUserIds: List<String>) -> Unit
) {
    var description by remember { mutableStateOf("") }
    var amountText by remember { mutableStateOf("") }

    // Choose first user as default payer
    var selectedPayerId by remember { mutableStateOf(users.firstOrNull()?.id ?: "") }
    var dropdownExpanded by remember { mutableStateOf(false) }

    // Multi-checkbox state for selecting who splits it
    val involvedUserIds = remember {
        mutableStateListOf<String>().apply {
            // Default: all participants are involved
            addAll(users.map { it.id })
        }
    }

    var errorMessage by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Add New Expense", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Error/Status banner
            if (errorMessage != null) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                ) {
                    Text(
                        text = errorMessage ?: "",
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            // Description textfield
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("What was this for?") },
                placeholder = { Text("e.g., Grocery shopping, Gas") },
                modifier = Modifier.fillMaxWidth()
            )

            // Amount textfield
            OutlinedTextField(
                value = amountText,
                onValueChange = { amountText = it },
                label = { Text("Total Amount ($currencySymbol)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                placeholder = { Text("0.00") },
                modifier = Modifier.fillMaxWidth()
            )

            // Payer selection dropdown
            Column {
                Text(
                    text = "Who paid?",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))

                val payerName = users.find { it.id == selectedPayerId }?.name ?: "Select Payer"

                Box {
                    OutlinedTextField(
                        value = payerName,
                        onValueChange = {},
                        readOnly = true,
                        modifier = Modifier.fillMaxWidth(),
                        trailingIcon = {
                            IconButton(onClick = { dropdownExpanded = !dropdownExpanded }) {
                                Icon(Icons.Default.ArrowDropDown, contentDescription = "Select payer")
                            }
                        }
                    )
                    DropdownMenu(
                        expanded = dropdownExpanded,
                        onDismissRequest = { dropdownExpanded = false },
                        modifier = Modifier.fillMaxWidth(0.9f)
                    ) {
                        users.forEach { user ->
                            DropdownMenuItem(
                                text = { Text(user.name) },
                                onClick = {
                                    selectedPayerId = user.id
                                    dropdownExpanded = false
                                }
                            )
                        }
                    }
                }
            }

            // Split Selection checkboxes
            Column {
                Text(
                    text = "Split with whom?",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))

                users.forEach { user ->
                    val isChecked = involvedUserIds.contains(user.id)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (isChecked) {
                                    if (involvedUserIds.size > 1) {
                                        involvedUserIds.remove(user.id)
                                    }
                                } else {
                                    involvedUserIds.add(user.id)
                                }
                            }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = isChecked,
                            onCheckedChange = { checked ->
                                if (checked) {
                                    involvedUserIds.add(user.id)
                                } else {
                                    if (involvedUserIds.size > 1) {
                                        involvedUserIds.remove(user.id)
                                    }
                                }
                            }
                        )
                        Text(
                            text = user.name,
                            style = MaterialTheme.typography.bodyLarge,
                            modifier = Modifier.padding(start = 8.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Save button
            Button(
                onClick = {
                    val amount = amountText.toDoubleOrNull()
                    if (description.isBlank()) {
                        errorMessage = "Please enter a description"
                    } else if (amount == null || amount <= 0.0) {
                        errorMessage = "Please enter a valid amount greater than zero"
                    } else if (involvedUserIds.isEmpty()) {
                        errorMessage = "Please select at least one person to split with"
                    } else {
                        onExpenseSaved(description, amount, selectedPayerId, involvedUserIds.toList())
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("Save Expense", fontWeight = FontWeight.Bold)
            }
        }
    }
}
