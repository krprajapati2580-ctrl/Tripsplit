package com.example.tripsplit

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
        super.onCreate(savedInstanceState)
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
}
