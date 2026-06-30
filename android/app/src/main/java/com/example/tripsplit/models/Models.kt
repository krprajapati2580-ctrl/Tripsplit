package com.example.tripsplit.models

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
)
