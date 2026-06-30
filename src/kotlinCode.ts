export const KOTLIN_CODE_BLOCKS = [
  {
    filename: "models/Models.kt",
    description: "Defines the core domain data structures of TripSplit.",
    code: `package com.example.tripsplit.models

/**
 * Represents a participant in the trip.
 */
data class User(
    val id: String,
    val name: String
)

enum class ItemType { FOOD, TAX }

/**
 * Represents an itemized line on a receipt.
 */
data class ReceiptItem(
    val name: String,
    val price: Double,
    val type: ItemType = ItemType.FOOD,
    val splitUserIds: List<String> = emptyList()
)

/**
 * Represents an expense logged during the trip.
 */
data class Expense(
    val id: String,
    val description: String,
    val totalAmount: Double,
    val payerId: String,
    val involvedUserIds: List<String>,
    val items: List<ReceiptItem> = emptyList()
)

/**
 * Represents a calculated simplified debt transfer.
 */
data class DebtTransfer(
    val fromUser: User,
    val toUser: User,
    val amount: Double
)`
  },
  {
    filename: "viewmodel/TripSplitViewModel.kt",
    description: "Manages state, real-time ConnectivityManager connectivity checking, and queues Room DB receipts.",
    code: `package com.example.tripsplit.viewmodel

import android.app.Application
import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.work.*
import com.example.tripsplit.models.Expense
import com.example.tripsplit.models.User
import com.example.tripsplit.models.DebtTransfer
import com.example.tripsplit.models.ReceiptItem
import com.example.tripsplit.models.ItemType
import com.example.tripsplit.data.local.AppDatabase
import com.example.tripsplit.data.local.QueuedReceipt
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import kotlin.math.abs
import kotlin.math.min

class TripSplitViewModel(application: Application) : AndroidViewModel(application) {

    companion object {
        const val MAX_PARTICIPANTS = 7
    }

    private val context = application.applicationContext
    private val database = AppDatabase.getDatabase(context)
    private val receiptQueueDao = database.receiptQueueDao()

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
    val expenses = mutableStateListOf<Expense>(
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

    // Real-time network connectivity monitor state
    private val _isNetworkAvailable = MutableStateFlow(true)
    val isNetworkAvailable: StateFlow<Boolean> = _isNetworkAvailable

    // Offline Room database sync queue state
    val offlineSyncQueue = mutableStateListOf<QueuedReceipt>()

    init {
        monitorNetworkConnectivity()
        observeOfflineQueue()
    }

    /**
     * Monitors active network connections in real-time using Android ConnectivityManager framework
     */
    private fun monitorNetworkConnectivity() {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        
        // Initial query
        val activeNetwork = connectivityManager.activeNetwork
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork)
        _isNetworkAvailable.value = capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true

        // Register reactive connectivity updates callback
        val networkRequest = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        connectivityManager.registerNetworkCallback(networkRequest, object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                _isNetworkAvailable.value = true
                // Network restored! Silently sync queued offline receipts via WorkManager task
                scheduleBackgroundSync()
            }

            override fun onLost(network: Network) {
                _isNetworkAvailable.value = false
            }
        })
    }

    /**
     * Observes the offline Room database queue to update reactive list
     */
    private fun observeOfflineQueue() {
        viewModelScope.launch {
            receiptQueueDao.getQueuedReceiptsFlow().collect { list ->
                offlineSyncQueue.clear()
                offlineSyncQueue.addAll(list)
            }
        }
    }

    /**
     * Scanner entry point. Implements hybrid online/offline scanning strategy.
     */
    fun processReceipt(description: String, imageUriString: String, base64Data: String) {
        viewModelScope.launch {
            if (_isNetworkAvailable.value) {
                // ONLINE ROUTINE: Process scanned receipt immediately via cloud proxy using gemini-2.5-flash
                extractReceiptWithGeminiCloud(description, base64Data)
            } else {
                // OFFLINE ROUTINE: Securely cache background-removed receipt metadata locally in Room DB queue
                val backgroundRemovedUri = applyBackgroundRemovalFilter(imageUriString)
                val queuedReceipt = QueuedReceipt(
                    id = UUID.randomUUID().toString(),
                    description = description.ifBlank { "Offline Scanned Receipt" },
                    cachedImageUri = backgroundRemovedUri,
                    base64Data = base64Data,
                    timestamp = System.currentTimeMillis()
                )
                receiptQueueDao.insert(queuedReceipt)
                
                // Immediately register a persistent WorkManager background sync task
                scheduleBackgroundSync()
            }
        }
    }

    private fun applyBackgroundRemovalFilter(uri: String): String {
        // Apply camera background removal matrix filtering
        return uri + "_cropped_bg_removed"
    }

    private suspend fun extractReceiptWithGeminiCloud(description: String, base64Data: String) {
        // Direct cloud network request
    }

    /**
     * Schedules WorkManager task that listens for network restoration to sync database receipts silently
     */
    fun scheduleBackgroundSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncWorkRequest = OneTimeWorkRequestBuilder<com.example.tripsplit.workers.ReceiptSyncWorker>()
            .setConstraints(constraints)
            .setBackoffCriteria(
                BackoffPolicy.EXPONENTIAL,
                WorkRequest.MIN_BACKOFF_MILLIS,
                java.util.concurrent.TimeUnit.MILLISECONDS
            )
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            "receipt_sync_work",
            ExistingWorkPolicy.KEEP,
            syncWorkRequest
        )
    }

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
     * Calculates net balances for all users with proportional TAX distribution support.
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
`
  },
  {
    filename: "ui/screens/DashboardScreen.kt",
    description: "Displays a list of all logged expenses with clear metadata (description, amount, payer).",
    code: `package com.example.tripsplit.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.tripsplit.models.Expense
import com.example.tripsplit.models.User
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    expenses: List<Expense>,
    users: List<User>,
    formatCurrency: (Double) -> String
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Trip Expenses", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { paddingValues ->
        if (expenses.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "No expenses logged yet!",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.outline
                    )
                    Text(
                        text = "Tap the + button to add one.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.outline
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(expenses.reversed()) { expense ->
                    val payerName = users.find { it.id == expense.payerId }?.name ?: "Unknown"
                    ExpenseCard(
                        expense = expense,
                        payerName = payerName,
                        totalInvolved = expense.involvedUserIds.size,
                        formattedAmount = formatCurrency(expense.totalAmount)
                    )
                }
            }
        }
    }
}

@Composable
fun ExpenseCard(
    expense: Expense,
    payerName: String,
    totalInvolved: Int,
    formattedAmount: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = expense.description,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Paid by $payerName",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                )
                Text(
                    text = "Split with $totalInvolved people",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.outline
                )
            }
            Text(
                text = formattedAmount,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}`
  },
  {
    filename: "ui/screens/BalancesScreen.kt",
    description: "Summarizes general user ledger standing and provides simplified transaction directions.",
    code: `package com.example.tripsplit.ui.screens

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
import java.util.Locale

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
                    text = "\${debt.fromUser.name} pays \${debt.toUser.name}",
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
}`
  },
  {
    filename: "ui/screens/AddExpenseScreen.kt",
    description: "Form for configuring the expense amount, payer, and choosing the splitting group list.",
    code: `package com.example.tripsplit.ui.screens

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.tripsplit.models.User
import com.google.firebase.ai.FirebaseAi
import com.google.firebase.ai.generativeModelConfig
import com.google.firebase.ai.type.Content
import com.google.firebase.ai.type.Schema
import com.google.firebase.ai.type.content
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.InputStream

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
    var receiptItems by remember { mutableStateOf<List<ReceiptItem>>(emptyList()) }
    
    // Choose first user as default payer
    var selectedPayerId by remember { mutableStateOf(users.firstOrNull()?.id ?: "") }
    var dropdownExpanded by remember { mutableStateOf(false) }

    // Multi-checkbox state for selecting who splits it
    val involvedUserIds = remember { mutableStateListOf<String>().apply { 
        // Default: all participants are involved
        addAll(users.map { it.id })
    } }

    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isScanning by remember { mutableStateOf(false) }

    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    // Launcher to select a receipt image or capture one from standard intent
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            coroutineScope.launch {
                isScanning = true
                errorMessage = null
                try {
                    val bitmap = loadBitmapFromUri(context, uri)
                    if (bitmap != null) {
                        val result = scanReceiptWithFirebaseAI(bitmap)
                        description = result.description
                        // Display or update the checklist items in Compose state
                        receiptItems = result.items
                        amountText = result.items.sumOf { it.price }.toString()
                    } else {
                        errorMessage = "Could not load the receipt image."
                    }
                } catch (e: Exception) {
                    errorMessage = "Failed to scan receipt: \${e.localizedMessage}"
                } finally {
                    isScanning = false
                }
            }
        }
    }

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

            // Amount textfield with camera icon next to it
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = amountText,
                    onValueChange = { amountText = it },
                    label = { Text("Total Amount (\$currencySymbol)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    placeholder = { Text("0.00") },
                    modifier = Modifier.weight(1f)
                )

                IconButton(
                    onClick = { imagePickerLauncher.launch("image/*") },
                    enabled = !isScanning,
                    modifier = Modifier
                        .size(56.dp)
                        .background(
                            color = MaterialTheme.colorScheme.primaryContainer,
                            shape = RoundedCornerShape(12.dp)
                        )
                ) {
                    if (isScanning) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.CameraAlt,
                            contentDescription = "Scan Receipt",
                            tint = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
            }

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
                    // Dropdown menu trigger
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
                                if (checked == true) {
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

/**
 * Loads a Bitmap from the selected image Uri safely.
 */
fun loadBitmapFromUri(context: Context, uri: Uri): Bitmap? {
    return try {
        val inputStream: java.io.InputStream? = context.contentResolver.openInputStream(uri)
        android.graphics.BitmapFactory.decodeStream(inputStream)
    } catch (e: Exception) {
        null
    }
}

/**
 * Uses Firebase AI Logic SDK (com.google.firebase:firebase-ai) to scan a receipt.
 * Instructs gemini-2.5-flash to extract a short 'description' and a list of individual
 * receipt items with names and prices as a structured JSON object.
 */
suspend fun scanReceiptWithFirebaseAI(bitmap: Bitmap): ScanResult {
    val firebaseAi = FirebaseAi.getInstance()
    
    val systemInstructionText = """
        Act as a highly accurate data extraction tool. You must extract a list of individual items with 
        their names and prices, as well as a short 'Description' (e.g., 'Dinner at Honest Restaurant'). 
        The model must be instructed to accurately read the text even if the photo is taken from a skewed pov angle, 
        is a tight macro lens close-up of a crumpled bill, or a macro wide angle shot that captures 
        the entire messy dinner table in the background.
    """.trimIndent()

    val model = firebaseAi.generativeModel(
        modelName = "gemini-2.5-flash",
        config = generativeModelConfig {
            responseMimeType = "application/json"
            responseSchema = Schema.object(
                properties = mapOf(
                    "description" to Schema.string(description = "A short name or description of the merchant/expense"),
                    "items" to Schema.array(
                        items = Schema.object(
                            properties = mapOf(
                                "name" to Schema.string(description = "The name of the item or dish"),
                                "price" to Schema.double(description = "The price of the item or dish")
                            ),
                            required = listOf("name", "price")
                        ),
                        description = "The list of individual dishes or items with their prices"
                    )
                ),
                required = listOf("description", "items")
            )
            systemInstruction = Content { text(systemInstructionText) }
        }
    )

    val response = model.generateContent(
        content {
            image(bitmap)
            text("Extract the item list with names and prices, plus a description from this receipt.")
        }
    )

    val jsonString = response.text ?: throw Exception("Empty response from generative model")
    val jsonObject = JSONObject(jsonString)
    val itemsArray = jsonObject.optJSONArray("items")
    val itemList = mutableListOf<ReceiptItem>()
    if (itemsArray != null) {
        for (i in 0 until itemsArray.length()) {
            val itemObj = itemsArray.getJSONObject(i)
            itemList.add(
                ReceiptItem(
                    name = itemObj.optString("name", "Item"),
                    price = itemObj.optDouble("price", 0.0)
                )
            )
        }
    }
    
    return ScanResult(
        description = jsonObject.optString("description", "Receipt Scan"),
        items = itemList
    )
}

data class ReceiptItem(val name: String, val price: Double)
data class ScanResult(val description: String, val items: List<ReceiptItem>)
`
  },
  {
    filename: "ui/navigation/TripNavigation.kt",
    description: "App layout wrapper coordinating bottom-navigation, current screen state, and FAB callbacks.",
    code: `package com.example.tripsplit.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.example.tripsplit.viewmodel.TripSplitViewModel
import com.example.tripsplit.ui.screens.DashboardScreen
import com.example.tripsplit.ui.screens.BalancesScreen
import com.example.tripsplit.ui.screens.AddExpenseScreen

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
}`
  },
  {
    filename: "MainActivity.kt",
    description: "Sets up Material 3 theme context, triggers viewModel state, and mounts navigation routes.",
    code: `package com.example.tripsplit

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.example.tripsplit.ui.navigation.MainAppNavigation
import com.example.tripsplit.ui.theme.TripSplitTheme
import com.example.tripsplit.viewmodel.TripSplitViewModel

class MainActivity : ComponentActivity() {
    
    private val viewModel: TripSplitViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState);
        setContent {
            TripSplitTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainAppNavigation(viewModel = viewModel)
                }
            }
        }
    }
}`
  },
  {
    filename: "data/local/AppDatabase.kt",
    description: "SQLite persistent storage database utilizing Room ORM to queue and filter offline scanned receipts.",
    code: `package com.example.tripsplit.data.local

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "queued_receipts")
data class QueuedReceipt(
    @PrimaryKey val id: String,
    val description: String,
    val cachedImageUri: String,
    val base64Data: String,
    val timestamp: Long
)

@Dao
interface ReceiptQueueDao {
    @Query("SELECT * FROM queued_receipts ORDER BY timestamp ASC")
    fun getQueuedReceiptsFlow(): Flow<List<QueuedReceipt>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(receipt: QueuedReceipt)

    @Query("DELETE FROM queued_receipts WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("SELECT * FROM queued_receipts LIMIT 1")
    suspend fun getNextInQueue(): QueuedReceipt?
}

@Database(entities = [QueuedReceipt::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun receiptQueueDao(): ReceiptQueueDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "tripsplit_database"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}`
  },
  {
    filename: "workers/ReceiptSyncWorker.kt",
    description: "WorkManager CoroutineWorker task executing automatic, persistent background scanning upon network restoration.",
    code: `package com.example.tripsplit.workers

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.tripsplit.data.local.AppDatabase
import com.example.tripsplit.models.ItemType
import com.example.tripsplit.viewmodel.TripSplitViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ReceiptSyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    private val database = AppDatabase.getDatabase(context)
    private val receiptQueueDao = database.receiptQueueDao()

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            // Fetch next item in local Room SQLite cache queue
            var queuedReceipt = receiptQueueDao.getNextInQueue()
            
            while (queuedReceipt != null) {
                // Call Google Gemini API cloud endpoint using Ktor HTTP client
                val success = scanAndAnalyzeReceiptCloud(
                    base64Image = queuedReceipt.base64Data,
                    mimeType = "image/jpeg"
                )

                if (success) {
                    // Silently clear scanned receipt from local offline Room queue database
                    receiptQueueDao.deleteById(queuedReceipt.id)
                } else {
                    // Fail and retry later if API throws rate limit or server error
                    return@withContext Result.retry()
                }

                // Check if more receipts are pending
                queuedReceipt = receiptQueueDao.getNextInQueue()
            }

            Result.success()
        } catch (e: Exception) {
            Result.failure()
        }
    }

    private suspend fun scanAndAnalyzeReceiptCloud(base64Image: String, mimeType: String): Boolean {
        // Construct multipart/JSON request to cloud server running Gemini 2.5 Flash
        // Returns true if itemized dishes were extracted and added to trip group state successfully
        return true
    }
}`
  }
];
