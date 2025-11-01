# Migration Guide: React App → KMP Web App
## Step-by-Step Implementation Guide

**Date**: 2025-11-01
**Version**: 1.0
**Audience**: Development team
**Estimated Timeline**: 7-10 weeks

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Week 1: Project Setup](#week-1-project-setup)
3. [Week 2: Shared Models & Domain Layer](#week-2-shared-models--domain-layer)
4. [Week 3: Firebase Integration](#week-3-firebase-integration)
5. [Week 4: Data Layer (Repositories)](#week-4-data-layer-repositories)
6. [Week 5-6: UI Layer Migration](#week-5-6-ui-layer-migration)
7. [Week 7: Testing & Bug Fixes](#week-7-testing--bug-fixes)
8. [Week 8-10: Deployment & Polish](#week-8-10-deployment--polish)
9. [Rollback Plan](#rollback-plan)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Development Environment

```bash
# Required Software
- Android Studio Ladybug (2024.1+)
- JDK 17
- Node.js 18+
- Git

# Clone the Android repository
git clone https://github.com/Aria-Orienteering/android-app.git
cd android-app

# Create feature branch
git checkout -b feature/kmp-web-integration

# Verify Android PR #3 is merged or coordinate with that branch
git fetch origin
git log origin/master --oneline -10
```

### Firebase Setup

1. Access Firebase Console: https://console.firebase.google.com
2. Select your project
3. Generate Web credentials (if not already available)
4. Download `google-services.json` for Android
5. Note down Web config values

---

## Week 1: Project Setup

### Step 1.1: Create Shared Module

```bash
# Create directory structure
mkdir -p shared/src/commonMain/kotlin
mkdir -p shared/src/androidMain/kotlin
mkdir -p shared/src/jsMain/kotlin
```

**File**: `shared/build.gradle.kts`

```kotlin
plugins {
    kotlin("multiplatform") version "2.0.21"
    kotlin("plugin.serialization") version "2.0.21"
    id("com.android.library")
}

group = "com.ariaorienteering"
version = "1.0.0"

kotlin {
    androidTarget {
        compilations.all {
            kotlinOptions {
                jvmTarget = "17"
            }
        }
    }

    js(IR) {
        browser {
            commonWebpackConfig {
                cssSupport {
                    enabled.set(true)
                }
            }
        }
        binaries.executable()
    }

    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
                implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.6.1")
            }
        }

        val androidMain by getting {
            dependencies {
                implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
                implementation("com.google.firebase:firebase-auth-ktx")
                implementation("com.google.firebase:firebase-database-ktx")
            }
        }

        val jsMain by getting {
            dependencies {
                implementation(npm("firebase", "10.14.0"))
            }
        }

        val commonTest by getting {
            dependencies {
                implementation(kotlin("test"))
            }
        }
    }
}

android {
    namespace = "com.ariaorienteering.shared"
    compileSdk = 35

    defaultConfig {
        minSdk = 24
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
```

### Step 1.2: Update Root Settings

**File**: `settings.gradle.kts`

```kotlin
// Add to includes
include(":shared")
include(":webApp")  // Will create in Step 1.3
```

### Step 1.3: Create Web Module

```bash
mkdir -p webApp/src/jsMain/kotlin/ui
mkdir -p webApp/src/jsMain/resources
```

**File**: `webApp/build.gradle.kts`

```kotlin
plugins {
    kotlin("multiplatform") version "2.0.21"
    id("org.jetbrains.compose") version "1.7.1"
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.21"
}

kotlin {
    js(IR) {
        browser {
            commonWebpackConfig {
                outputFileName = "orienteering-web.js"
            }
        }
        binaries.executable()
    }

    sourceSets {
        val jsMain by getting {
            dependencies {
                implementation(project(":shared"))
                implementation(compose.html.core)
                implementation(compose.runtime)
                implementation(npm("@googlemaps/js-api-loader", "1.16.8"))
            }
        }
    }
}
```

### Step 1.4: Verify Build

```bash
# Build shared module
./gradlew :shared:build

# Expected output: BUILD SUCCESSFUL
```

**Checkpoint**: ✅ Project compiles, modules recognized

---

## Week 2: Shared Models & Domain Layer

### Step 2.1: Create Data Models

**File**: `shared/src/commonMain/kotlin/com/ariaorienteering/shared/domain/model/User.kt`

```kotlin
package com.ariaorienteering.shared.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class User(
    val uid: String = "",
    val firstName: String = "",
    val lat: Double = 0.0,
    val lon: Double = 0.0,
    val active: Boolean = false,
    val courseObject: Course? = null,
    val homeMarker: Marker? = null
)
```

**File**: `shared/src/commonMain/kotlin/com/ariaorienteering/shared/domain/model/Course.kt`

```kotlin
package com.ariaorienteering.shared.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class Course(
    val id: String = "",
    val name: String = "",
    val markers: List<Marker> = emptyList()
)
```

**File**: `shared/src/commonMain/kotlin/com/ariaorienteering/shared/domain/model/Marker.kt`

```kotlin
package com.ariaorienteering.shared.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class Marker(
    val lat: Double = 0.0,
    val lon: Double = 0.0,
    val status: MarkerStatus = MarkerStatus.NOT_FOUND
)

@Serializable
enum class MarkerStatus {
    NOT_FOUND,
    TARGET,
    FOUND
}
```

**File**: `shared/src/commonMain/kotlin/com/ariaorienteering/shared/domain/model/Result.kt`

```kotlin
package com.ariaorienteering.shared.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class Result(
    val uid: String = "",
    val name: String = "",
    val course: String = "",
    val time: String = "",
    val timestamp: Long = 0L
) {
    fun formattedMessage(): String =
        "$name completed course $course in $time"
}
```

**File**: `shared/src/commonMain/kotlin/com/ariaorienteering/shared/util/LatLng.kt`

```kotlin
package com.ariaorienteering.shared.util

data class LatLng(
    val lat: Double,
    val lng: Double
) {
    companion object {
        val ARIA_VILLAGE = LatLng(-38.560926, 174.983468)
    }
}
```

### Step 2.2: Create Use Cases

**File**: `shared/src/commonMain/kotlin/com/ariaorienteering/shared/domain/usecase/GetActiveUsersUseCase.kt`

```kotlin
package com.ariaorienteering.shared.domain.usecase

import com.ariaorienteering.shared.data.repository.UserRepository
import com.ariaorienteering.shared.domain.model.User
import kotlinx.coroutines.flow.Flow

class GetActiveUsersUseCase(
    private val userRepository: UserRepository
) {
    operator fun invoke(): Flow<List<User>> =
        userRepository.observeActiveUsers()
}
```

**File**: `shared/src/commonMain/kotlin/com/ariaorienteering/shared/domain/usecase/GetMapMarkersUseCase.kt`

```kotlin
package com.ariaorienteering.shared.domain.usecase

import com.ariaorienteering.shared.domain.model.*
import com.ariaorienteering.shared.util.LatLng

class GetMapMarkersUseCase {
    operator fun invoke(user: User?): List<MapMarker> {
        if (user == null) return emptyList()

        val markers = mutableListOf<MapMarker>()

        // User marker
        markers.add(
            MapMarker(
                position = LatLng(user.lat, user.lon),
                title = user.firstName,
                type = MarkerType.USER
            )
        )

        // Course markers
        user.courseObject?.let { course ->
            course.markers.forEach { marker ->
                markers.add(
                    MapMarker(
                        position = LatLng(marker.lat, marker.lon),
                        title = "",
                        type = when (marker.status) {
                            MarkerStatus.NOT_FOUND -> MarkerType.COURSE_NOT_FOUND
                            MarkerStatus.TARGET -> MarkerType.COURSE_TARGET
                            MarkerStatus.FOUND -> MarkerType.COURSE_FOUND
                        }
                    )
                )
            }

            // Home marker if all found
            if (allMarkersFound(course)) {
                user.homeMarker?.let { home ->
                    markers.add(
                        MapMarker(
                            position = LatLng(home.lat, home.lon),
                            title = "Home",
                            type = MarkerType.HOME
                        )
                    )
                }
            }
        }

        return markers
    }

    private fun allMarkersFound(course: Course): Boolean =
        course.markers.all { it.status == MarkerStatus.FOUND }
}

data class MapMarker(
    val position: LatLng,
    val title: String,
    val type: MarkerType
)

enum class MarkerType {
    USER,
    COURSE_NOT_FOUND,
    COURSE_TARGET,
    COURSE_FOUND,
    HOME
}
```

### Step 2.3: Test Models

```bash
./gradlew :shared:build

# Should compile successfully
```

**Checkpoint**: ✅ All models compile, serialization works

---

## Week 3: Firebase Integration

### Step 3.1: Define Common Interface

**File**: `shared/src/commonMain/kotlin/com/ariaorienteering/shared/data/firebase/FirebaseClient.kt`

```kotlin
package com.ariaorienteering.shared.data.firebase

import com.ariaorienteering.shared.domain.model.User
import com.ariaorienteering.shared.domain.model.Result
import kotlinx.coroutines.flow.Flow

expect class FirebaseClient() {
    fun signInWithGoogle(): Flow<AuthResult>
    suspend fun signOut()
    fun observeAuthState(): Flow<User?>
    fun observeUsers(): Flow<List<User>>
    fun observeResults(): Flow<List<Result>>
}

sealed class AuthResult {
    data class Success(val user: User) : AuthResult()
    data class Error(val message: String) : AuthResult()
}
```

### Step 3.2: Implement Android Version

**File**: `shared/src/androidMain/kotlin/com/ariaorienteering/shared/data/firebase/FirebaseClient.kt`

```kotlin
package com.ariaorienteering.shared.data.firebase

import com.ariaorienteering.shared.domain.model.User
import com.ariaorienteering.shared.domain.model.Result
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.*
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.*

actual class FirebaseClient {
    private val auth = FirebaseAuth.getInstance()
    private val database = FirebaseDatabase.getInstance()

    actual fun signInWithGoogle(): Flow<AuthResult> = flow {
        // Will be implemented with Android activity integration
        // For now, observe current auth state
        val currentUser = auth.currentUser
        if (currentUser != null) {
            emit(AuthResult.Success(currentUser.toUser()))
        } else {
            emit(AuthResult.Error("Not authenticated"))
        }
    }

    actual suspend fun signOut() {
        auth.signOut()
    }

    actual fun observeAuthState(): Flow<User?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { auth ->
            trySend(auth.currentUser?.toUser())
        }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    actual fun observeUsers(): Flow<List<User>> = callbackFlow {
        val usersRef = database.getReference("users")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val users = snapshot.children.mapNotNull { child ->
                    child.getValue(User::class.java)
                }
                trySend(users)
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }
        usersRef.addValueEventListener(listener)
        awaitClose { usersRef.removeEventListener(listener) }
    }

    actual fun observeResults(): Flow<List<Result>> = callbackFlow {
        val resultsRef = database.getReference("results")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val results = snapshot.children.mapNotNull { child ->
                    child.getValue(Result::class.java)
                }
                trySend(results)
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }
        resultsRef.addValueEventListener(listener)
        awaitClose { resultsRef.removeEventListener(listener) }
    }

    private fun com.google.firebase.auth.FirebaseUser.toUser(): User {
        return User(
            uid = uid,
            firstName = displayName ?: "Unknown",
            lat = 0.0,
            lon = 0.0,
            active = false
        )
    }
}
```

### Step 3.3: Implement JS Version

**File**: `shared/src/jsMain/kotlin/com/ariaorienteering/shared/data/firebase/FirebaseClient.kt`

```kotlin
package com.ariaorienteering.shared.data.firebase

import com.ariaorienteering.shared.domain.model.User
import com.ariaorienteering.shared.domain.model.Result
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.*
import kotlin.js.json

actual class FirebaseClient {
    private val firebase = js("require('firebase/app')")
    private val auth = js("require('firebase/auth')")
    private val database = js("require('firebase/database')")

    init {
        initializeFirebase()
    }

    private fun initializeFirebase() {
        val config = json(
            "apiKey" to js("process.env.REACT_APP_FIREBASE_API_KEY"),
            "authDomain" to js("process.env.REACT_APP_FIREBASE_AUTH_DOMAIN"),
            "databaseURL" to js("process.env.REACT_APP_FIREBASE_DB_URL"),
            "projectId" to js("process.env.REACT_APP_FIREBASE_PROJECT_ID"),
            "storageBucket" to js("process.env.REACT_APP_FIREBASE_STORAGE_BUCKET"),
            "messagingSenderId" to js("process.env.REACT_APP_FIREBASE_MSG_SENDER_ID")
        )

        if (firebase.apps.length == 0) {
            firebase.initializeApp(config)
        }
    }

    actual fun signInWithGoogle(): Flow<AuthResult> = flow {
        try {
            val provider = js("new firebase.auth.GoogleAuthProvider()")
            val result = auth.signInWithPopup(provider).await()
            emit(AuthResult.Success(result.user.toUser()))
        } catch (e: Exception) {
            emit(AuthResult.Error(e.message ?: "Unknown error"))
        }
    }

    actual suspend fun signOut() {
        auth.signOut()
    }

    actual fun observeAuthState(): Flow<User?> = callbackFlow {
        val unsubscribe = auth.onAuthStateChanged { user ->
            trySend(user?.toUser())
        }
        awaitClose { unsubscribe() }
    }

    actual fun observeUsers(): Flow<List<User>> = callbackFlow {
        val usersRef = database.ref("users")
        val listener = usersRef.on("value") { snapshot ->
            val users = mutableListOf<User>()
            snapshot.forEach { child ->
                users.add(child.`val`().unsafeCast<User>())
            }
            trySend(users)
        }
        awaitClose { usersRef.off("value", listener) }
    }

    actual fun observeResults(): Flow<List<Result>> = callbackFlow {
        val resultsRef = database.ref("results")
        val listener = resultsRef.on("value") { snapshot ->
            val results = mutableListOf<Result>()
            snapshot.forEach { child ->
                results.add(child.`val`().unsafeCast<Result>())
            }
            trySend(results)
        }
        awaitClose { resultsRef.off("value", listener) }
    }

    private fun dynamic.toUser(): User {
        return User(
            uid = this.uid as String,
            firstName = (this.displayName as? String) ?: "Unknown",
            lat = 0.0,
            lon = 0.0,
            active = false
        )
    }
}
```

### Step 3.4: Test Firebase Connection

Create a simple test to verify Firebase works:

```kotlin
// In shared/src/commonTest/kotlin
class FirebaseClientTest {
    @Test
    fun testFirebaseConnection() = runTest {
        val client = FirebaseClient()
        client.observeUsers().first() // Should not crash
    }
}
```

**Checkpoint**: ✅ Firebase connects on both platforms

---

## Week 4: Data Layer (Repositories)

### Step 4.1: Create Repositories

**File**: `shared/src/commonMain/kotlin/com/ariaorienteering/shared/data/repository/UserRepository.kt`

```kotlin
package com.ariaorienteering.shared.data.repository

import com.ariaorienteering.shared.data.firebase.FirebaseClient
import com.ariaorienteering.shared.domain.model.User
import kotlinx.coroutines.flow.*

class UserRepository(
    private val firebaseClient: FirebaseClient
) {
    private val _selectedUser = MutableStateFlow<User?>(null)
    val selectedUser: StateFlow<User?> = _selectedUser.asStateFlow()

    fun observeActiveUsers(): Flow<List<User>> =
        firebaseClient.observeUsers()
            .map { users -> users.filter { it.active } }

    fun selectUser(user: User) {
        _selectedUser.value = user
    }

    fun clearSelection() {
        _selectedUser.value = null
    }
}
```

**File**: `shared/src/commonMain/kotlin/com/ariaorienteering/shared/data/repository/ResultsRepository.kt`

```kotlin
package com.ariaorienteering.shared.data.repository

import com.ariaorienteering.shared.data.firebase.FirebaseClient
import com.ariaorienteering.shared.domain.model.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class ResultsRepository(
    private val firebaseClient: FirebaseClient
) {
    fun observeResults(): Flow<List<Result>> =
        firebaseClient.observeResults()
            .map { results ->
                results.filter { it.uid != "test" }
                    .sortedByDescending { it.timestamp }
            }
}
```

**File**: `shared/src/commonMain/kotlin/com/ariaorienteering/shared/data/repository/AuthRepository.kt`

```kotlin
package com.ariaorienteering.shared.data.repository

import com.ariaorienteering.shared.data.firebase.AuthResult
import com.ariaorienteering.shared.data.firebase.FirebaseClient
import com.ariaorienteering.shared.domain.model.User
import kotlinx.coroutines.flow.Flow

class AuthRepository(
    private val firebaseClient: FirebaseClient
) {
    fun signInWithGoogle(): Flow<AuthResult> =
        firebaseClient.signInWithGoogle()

    suspend fun signOut() =
        firebaseClient.signOut()

    fun observeAuthState(): Flow<User?> =
        firebaseClient.observeAuthState()
}
```

### Step 4.2: Create Dependency Injection (Simple Factory)

**File**: `shared/src/commonMain/kotlin/com/ariaorienteering/shared/di/AppContainer.kt`

```kotlin
package com.ariaorienteering.shared.di

import com.ariaorienteering.shared.data.firebase.FirebaseClient
import com.ariaorienteering.shared.data.repository.*
import com.ariaorienteering.shared.domain.usecase.*

object AppContainer {
    private val firebaseClient by lazy { FirebaseClient() }

    val authRepository by lazy { AuthRepository(firebaseClient) }
    val userRepository by lazy { UserRepository(firebaseClient) }
    val resultsRepository by lazy { ResultsRepository(firebaseClient) }

    val getActiveUsersUseCase by lazy { GetActiveUsersUseCase(userRepository) }
    val getMapMarkersUseCase by lazy { GetMapMarkersUseCase() }
    val getCourseResultsUseCase by lazy { GetCourseResultsUseCase(resultsRepository) }
}
```

**Checkpoint**: ✅ Data layer complete, dependencies injected

---

## Week 5-6: UI Layer Migration

### Step 5.1: Create Web Entry Point

**File**: `webApp/src/jsMain/resources/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aria Orienteering</title>
    <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"></script>
</head>
<body>
    <div id="root"></div>
    <script src="orienteering-web.js"></script>
</body>
</html>
```

**File**: `webApp/src/jsMain/kotlin/Main.kt`

```kotlin
import androidx.compose.runtime.*
import org.jetbrains.compose.web.renderComposable
import ui.App

fun main() {
    renderComposable(rootElementId = "root") {
        App()
    }
}
```

### Step 5.2: Create Root Composable

**File**: `webApp/src/jsMain/kotlin/ui/App.kt`

```kotlin
package ui

import androidx.compose.runtime.*
import com.ariaorienteering.shared.domain.model.User
import org.jetbrains.compose.web.css.*
import org.jetbrains.compose.web.dom.*

@Composable
fun App() {
    var selectedUser by remember { mutableStateOf<User?>(null) }

    Div({
        style {
            display(DisplayStyle.Flex)
            height(100.vh)
            fontFamily("Arial", "sans-serif")
        }
    }) {
        // Left Sidebar
        Div({
            style {
                width(300.px)
                backgroundColor(Color("#f0f0f0"))
                property("overflow-y", "auto")
                padding(16.px)
            }
        }) {
            // Header
            Div({
                style {
                    display(DisplayStyle.Flex)
                    alignItems(AlignItems.Center)
                    marginBottom(16.px)
                }
            }) {
                Img(src = "/compass_icon.png") {
                    style {
                        width(48.px)
                        height(48.px)
                        marginRight(12.px)
                    }
                }
                H1({
                    style {
                        fontSize(24.px)
                        margin(0.px)
                    }
                }) {
                    Text("Aria Orienteering")
                }
            }

            // Login
            LoginScreen()

            // User List
            Div({
                style {
                    backgroundColor(Color.white)
                    borderRadius(8.px)
                    padding(16.px)
                    marginTop(16.px)
                }
            }) {
                H3 { Text("User List") }
                UserListScreen(
                    onUserSelected = { user -> selectedUser = user }
                )
            }

            // Results
            Div({
                style {
                    backgroundColor(Color.white)
                    borderRadius(8.px)
                    padding(16.px)
                    marginTop(16.px)
                }
            }) {
                ResultsScreen()
            }
        }

        // Main Map Area
        Div({
            style {
                flex(1)
            }
        }) {
            MapScreen(selectedUser = selectedUser)
        }
    }
}
```

### Step 5.3: Implement Login Screen

**File**: `webApp/src/jsMain/kotlin/ui/LoginScreen.kt`

```kotlin
package ui

import androidx.compose.runtime.*
import com.ariaorienteering.shared.data.firebase.AuthResult
import com.ariaorienteering.shared.di.AppContainer
import kotlinx.coroutines.launch
import org.jetbrains.compose.web.css.*
import org.jetbrains.compose.web.dom.*

@Composable
fun LoginScreen() {
    val authRepository = remember { AppContainer.authRepository }
    var currentUser by remember { mutableStateOf<com.ariaorienteering.shared.domain.model.User?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        authRepository.observeAuthState().collect { user ->
            currentUser = user
        }
    }

    Div({
        style {
            padding(8.px)
        }
    }) {
        if (currentUser != null) {
            Button({
                style {
                    width(100.percent)
                    padding(12.px)
                    backgroundColor(Color("#dd4b39"))
                    color(Color.white)
                    border(0.px)
                    borderRadius(4.px)
                    cursor("pointer")
                }
                onClick {
                    scope.launch {
                        authRepository.signOut()
                    }
                }
            }) {
                Text("Sign Out")
            }
        } else {
            Button({
                style {
                    width(100.percent)
                    padding(12.px)
                    backgroundColor(Color("#dd4b39"))
                    color(Color.white)
                    border(0.px)
                    borderRadius(4.px)
                    cursor("pointer")
                }
                onClick {
                    scope.launch {
                        authRepository.signInWithGoogle().collect { result ->
                            when (result) {
                                is AuthResult.Success -> println("Signed in: ${result.user.firstName}")
                                is AuthResult.Error -> println("Error: ${result.message}")
                            }
                        }
                    }
                }
            }) {
                Text("Sign in with Google")
            }
        }
    }
}
```

### Step 5.4: Implement User List

**File**: `webApp/src/jsMain/kotlin/ui/UserListScreen.kt`

```kotlin
package ui

import androidx.compose.runtime.*
import com.ariaorienteering.shared.di.AppContainer
import com.ariaorienteering.shared.domain.model.User
import org.jetbrains.compose.web.css.*
import org.jetbrains.compose.web.dom.*

@Composable
fun UserListScreen(
    onUserSelected: (User) -> Unit
) {
    val getActiveUsersUseCase = remember { AppContainer.getActiveUsersUseCase }
    var users by remember { mutableStateOf<List<User>>(emptyList()) }

    LaunchedEffect(Unit) {
        getActiveUsersUseCase().collect { userList ->
            users = userList
        }
    }

    Div {
        if (users.isEmpty()) {
            P { Text("No Users") }
        } else {
            users.forEach { user ->
                Button({
                    key(user.uid)
                    style {
                        width(100.percent)
                        padding(8.px)
                        margin(4.px, 0.px)
                        backgroundColor(Color("#28a745"))
                        color(Color.white)
                        border(0.px)
                        borderRadius(4.px)
                        cursor("pointer")
                        display(DisplayStyle.Flex)
                        alignItems(AlignItems.Center)
                    }
                    onClick {
                        onUserSelected(user)
                        AppContainer.userRepository.selectUser(user)
                    }
                }) {
                    Img(src = "/compass_icon.png") {
                        style {
                            width(20.px)
                            height(20.px)
                            marginRight(8.px)
                        }
                    }
                    Text(user.firstName)
                }
            }
        }
    }
}
```

### Step 5.5: Implement Results Screen

**File**: `webApp/src/jsMain/kotlin/ui/ResultsScreen.kt`

```kotlin
package ui

import androidx.compose.runtime.*
import com.ariaorienteering.shared.di.AppContainer
import com.ariaorienteering.shared.domain.model.Result
import org.jetbrains.compose.web.css.*
import org.jetbrains.compose.web.dom.*

@Composable
fun ResultsScreen() {
    val getCourseResultsUseCase = remember { AppContainer.getCourseResultsUseCase }
    var results by remember { mutableStateOf<List<Result>>(emptyList()) }

    LaunchedEffect(Unit) {
        getCourseResultsUseCase().collect { resultList ->
            results = resultList
        }
    }

    Div {
        H3 { Text("Results") }

        if (results.isEmpty()) {
            P { Text("No completed courses yet") }
        } else {
            results.forEach { result ->
                Div({
                    key(result.uid)
                    style {
                        padding(8.px)
                        margin(4.px, 0.px)
                        backgroundColor(Color("#f9f9f9"))
                        borderRadius(4.px)
                    }
                }) {
                    P({
                        style { margin(0.px) }
                    }) {
                        Text(result.formattedMessage())
                    }
                }
            }
        }
    }
}
```

### Step 5.6: Implement Map Screen (Simplified)

**File**: `webApp/src/jsMain/kotlin/ui/MapScreen.kt`

```kotlin
package ui

import androidx.compose.runtime.*
import com.ariaorienteering.shared.di.AppContainer
import com.ariaorienteering.shared.domain.model.User
import org.jetbrains.compose.web.css.*
import org.jetbrains.compose.web.dom.*

@Composable
fun MapScreen(selectedUser: User?) {
    val getMapMarkersUseCase = remember { AppContainer.getMapMarkersUseCase }

    Div({
        id("map-container")
        style {
            width(100.percent)
            height(100.percent)
            position(Position.Relative)
        }
    }) {
        // Google Maps integration would go here
        // For now, show selected user info
        selectedUser?.let { user ->
            Div({
                style {
                    position(Position.Absolute)
                    top(16.px)
                    left(16.px)
                    backgroundColor(Color.white)
                    padding(16.px)
                    borderRadius(8.px)
                    property("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
                }
            }) {
                H4 { Text("Selected User: ${user.firstName}") }
                P { Text("Lat: ${user.lat}, Lng: ${user.lon}") }
                user.courseObject?.let { course ->
                    P { Text("Course: ${course.name}") }
                    P { Text("Markers: ${course.markers.size}") }
                }
            }
        }

        // Map placeholder
        Div({
            style {
                width(100.percent)
                height(100.percent)
                backgroundColor(Color("#e0e0e0"))
                display(DisplayStyle.Flex)
                justifyContent(JustifyContent.Center)
                alignItems(AlignItems.Center)
            }
        }) {
            Text("Map Container (Google Maps integration pending)")
        }
    }
}
```

**Checkpoint**: ✅ All UI components rendering

---

## Week 7: Testing & Bug Fixes

### Test Checklist

```bash
# Build the web app
./gradlew :webApp:jsBrowserDevelopmentRun

# Open browser to http://localhost:8080
# Verify:
- [ ] Login button appears
- [ ] User list loads from Firebase
- [ ] Clicking user shows info
- [ ] Results list displays
- [ ] No console errors
```

### Common Issues & Fixes

**Issue 1**: Firebase not connecting
```kotlin
// Add console logging
init {
    console.log("Initializing Firebase...")
    initializeFirebase()
    console.log("Firebase initialized")
}
```

**Issue 2**: Users not loading
```kotlin
// Check Firebase rules in console
// Ensure read permissions are set
```

**Issue 3**: Build fails
```bash
# Clean and rebuild
./gradlew clean
./gradlew :webApp:build
```

---

## Week 8-10: Deployment & Polish

### Step 8.1: Production Build

```bash
./gradlew :webApp:jsBrowserProductionWebpack
```

Output will be in: `webApp/build/distributions/`

### Step 8.2: Deploy to GitHub Pages

**File**: `.github/workflows/deploy-web.yml`

```yaml
name: Deploy Web App

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Build web app
        run: ./gradlew :webApp:jsBrowserProductionWebpack

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./webApp/build/distributions
```

### Step 8.3: Environment Variables

Create `.env` file (add to `.gitignore`):

```bash
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_DATABASE_URL=your_db_url
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
```

---

## Rollback Plan

If migration fails, you can rollback:

### Option 1: Keep React Running
- Deploy React app separately
- Continue development in parallel
- Gradual migration over 3-6 months

### Option 2: Feature Flag
- Add feature flag to switch between React/KMP
- Test with subset of users
- Full rollout when stable

---

## Success Criteria

✅ **Functional Parity**
- All React features work in KMP
- Firebase auth works
- Real-time updates work
- Map displays correctly

✅ **Performance**
- Bundle size < 500KB gzipped
- Load time < 3 seconds
- Smooth animations

✅ **Code Quality**
- >60% code sharing
- Type-safe throughout
- No major bugs

---

## Next Steps After Migration

1. Add Google Maps integration (Week 11)
2. Performance optimization (Week 12)
3. Add new features leveraging shared code
4. Migrate Android app to use shared module

---

## Support & Resources

- **Kotlin Multiplatform Docs**: https://kotlinlang.org/docs/multiplatform.html
- **Compose for Web**: https://github.com/JetBrains/compose-multiplatform
- **Team Slack**: #aria-dev
- **Questions**: Tag @tech-lead

Good luck with the migration! 🚀
