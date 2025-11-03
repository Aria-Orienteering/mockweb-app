# Kotlin Multiplatform Integration Plan
## Adding Web Module to android-app Project

**Date**: 2025-11-01
**Version**: 1.0
**Target Repository**: `Aria-Orienteering/android-app`

---

## Executive Summary

This document outlines the plan to integrate the web application into the `android-app` project using Kotlin Multiplatform (KMP). This approach enables 60-70% code sharing between Android and web platforms, reduces development time from 16+ weeks to ~10 weeks, and provides a single source of truth for business logic.

---

## Project Structure

### Proposed Directory Layout

```
android-app/
├── androidApp/                    # Existing Android app
│   ├── src/
│   └── build.gradle.kts
│
├── webApp/                        # NEW: Compose for Web app
│   ├── src/
│   │   └── jsMain/
│   │       └── kotlin/
│   │           ├── Main.kt
│   │           └── ui/
│   │               ├── App.kt
│   │               ├── LoginScreen.kt
│   │               ├── MapScreen.kt
│   │               ├── UserListScreen.kt
│   │               └── ResultsScreen.kt
│   └── build.gradle.kts
│
├── shared/                        # NEW: Shared KMP module
│   ├── src/
│   │   ├── commonMain/
│   │   │   └── kotlin/
│   │   │       ├── auth/
│   │   │       │   ├── AuthRepository.kt
│   │   │       │   └── AuthState.kt
│   │   │       ├── data/
│   │   │       │   ├── repository/
│   │   │       │   │   ├── UserRepository.kt
│   │   │       │   │   ├── CourseRepository.kt
│   │   │       │   │   └── ResultsRepository.kt
│   │   │       │   └── firebase/
│   │   │       │       └── FirebaseClient.kt
│   │   │       ├── domain/
│   │   │       │   ├── model/
│   │   │       │   │   ├── User.kt
│   │   │       │   │   ├── Course.kt
│   │   │       │   │   ├── Marker.kt
│   │   │       │   │   ├── MarkerStatus.kt
│   │   │       │   │   └── Result.kt
│   │   │       │   └── usecase/
│   │   │       │       ├── GetActiveUsersUseCase.kt
│   │   │       │       ├── ObserveUserLocationUseCase.kt
│   │   │       │       └── GetCourseResultsUseCase.kt
│   │   │       └── util/
│   │   │           └── LatLng.kt
│   │   ├── androidMain/
│   │   │   └── kotlin/
│   │   │       └── firebase/
│   │   │           └── FirebaseClientAndroid.kt
│   │   └── jsMain/
│   │       └── kotlin/
│   │           └── firebase/
│   │               └── FirebaseClientJs.kt
│   └── build.gradle.kts
│
├── settings.gradle.kts            # Update to include webApp and shared
└── build.gradle.kts               # Root build file
```

---

## Phase 1: Project Setup (Week 1)

### 1.1 Create Shared Module

**File**: `shared/build.gradle.kts`

```kotlin
plugins {
    kotlin("multiplatform") version "2.0.21"
    kotlin("plugin.serialization") version "2.0.21"
}

kotlin {
    // Android target
    androidTarget {
        compilations.all {
            kotlinOptions {
                jvmTarget = "17"
            }
        }
    }

    // JS target for web
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
                // Coroutines
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")

                // Serialization
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

                // DateTime
                implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.6.1")

                // Firebase - will use expect/actual pattern
            }
        }

        val androidMain by getting {
            dependencies {
                // Firebase Android SDK
                implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
                implementation("com.google.firebase:firebase-auth-ktx")
                implementation("com.google.firebase:firebase-database-ktx")
            }
        }

        val jsMain by getting {
            dependencies {
                // Firebase JS SDK via npm
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

### 1.2 Create Web Module

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

                // Compose for Web
                implementation(compose.html.core)
                implementation(compose.runtime)

                // Google Maps JavaScript API
                implementation(npm("@googlemaps/js-api-loader", "1.16.8"))
            }
        }
    }
}
```

### 1.3 Update Root Settings

**File**: `settings.gradle.kts`

```kotlin
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
        maven("https://maven.pkg.jetbrains.space/public/p/compose/dev")
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven("https://maven.pkg.jetbrains.space/public/p/compose/dev")
    }
}

rootProject.name = "AriaOrienteering"
include(":androidApp")
include(":shared")      // NEW
include(":webApp")      // NEW
```

---

## Phase 2: Shared Domain Layer (Week 2)

### 2.1 Data Models

**File**: `shared/src/commonMain/kotlin/domain/model/User.kt`

```kotlin
package com.ariaorienteering.shared.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class User(
    val uid: String,
    val firstName: String,
    val lat: Double,
    val lon: Double,
    val active: Boolean = false,
    val courseObject: Course? = null,
    val homeMarker: Marker? = null
)
```

**File**: `shared/src/commonMain/kotlin/domain/model/Course.kt`

```kotlin
package com.ariaorienteering.shared.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class Course(
    val id: String,
    val name: String,
    val markers: List<Marker>
)
```

**File**: `shared/src/commonMain/kotlin/domain/model/Marker.kt`

```kotlin
package com.ariaorienteering.shared.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class Marker(
    val lat: Double,
    val lon: Double,
    val status: MarkerStatus
)

@Serializable
enum class MarkerStatus {
    NOT_FOUND,
    TARGET,
    FOUND
}
```

**File**: `shared/src/commonMain/kotlin/domain/model/Result.kt`

```kotlin
package com.ariaorienteering.shared.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class Result(
    val uid: String,
    val name: String,
    val course: String,
    val time: String
)
```

### 2.2 Use Cases

**File**: `shared/src/commonMain/kotlin/domain/usecase/GetActiveUsersUseCase.kt`

```kotlin
package com.ariaorienteering.shared.domain.usecase

import com.ariaorienteering.shared.data.repository.UserRepository
import com.ariaorienteering.shared.domain.model.User
import kotlinx.coroutines.flow.Flow

class GetActiveUsersUseCase(
    private val userRepository: UserRepository
) {
    operator fun invoke(): Flow<List<User>> {
        return userRepository.observeActiveUsers()
    }
}
```

---

## Phase 3: Firebase Integration (Week 3)

### 3.1 Expect/Actual Pattern for Firebase

**File**: `shared/src/commonMain/kotlin/data/firebase/FirebaseClient.kt`

```kotlin
package com.ariaorienteering.shared.data.firebase

import com.ariaorienteering.shared.domain.model.User
import com.ariaorienteering.shared.domain.model.Result
import kotlinx.coroutines.flow.Flow

expect class FirebaseClient {
    // Auth
    fun signInWithGoogle(): Flow<AuthResult>
    fun signOut()
    fun observeAuthState(): Flow<User?>

    // Database
    fun observeUsers(): Flow<List<User>>
    fun observeResults(): Flow<List<Result>>
}

sealed class AuthResult {
    data class Success(val user: User) : AuthResult()
    data class Error(val message: String) : AuthResult()
}
```

**File**: `shared/src/androidMain/kotlin/data/firebase/FirebaseClient.kt`

```kotlin
package com.ariaorienteering.shared.data.firebase

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.database.FirebaseDatabase
// ... Android Firebase implementation
```

**File**: `shared/src/jsMain/kotlin/data/firebase/FirebaseClient.kt`

```kotlin
package com.ariaorienteering.shared.data.firebase

import kotlinx.coroutines.flow.Flow
// ... JS Firebase implementation using npm firebase package
```

### 3.2 Repository Layer

**File**: `shared/src/commonMain/kotlin/data/repository/UserRepository.kt`

```kotlin
package com.ariaorienteering.shared.data.repository

import com.ariaorienteering.shared.data.firebase.FirebaseClient
import com.ariaorienteering.shared.domain.model.User
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class UserRepository(
    private val firebaseClient: FirebaseClient
) {
    fun observeActiveUsers(): Flow<List<User>> {
        return firebaseClient.observeUsers()
            .map { users -> users.filter { it.active } }
    }

    fun observeUserById(uid: String): Flow<User?> {
        return firebaseClient.observeUsers()
            .map { users -> users.find { it.uid == uid } }
    }
}
```

---

## Phase 4: Web UI with Compose (Week 4-5)

### 4.1 Main Entry Point

**File**: `webApp/src/jsMain/kotlin/Main.kt`

```kotlin
import androidx.compose.runtime.*
import org.jetbrains.compose.web.renderComposable

fun main() {
    renderComposable(rootElementId = "root") {
        App()
    }
}
```

### 4.2 Root Composable

**File**: `webApp/src/jsMain/kotlin/ui/App.kt`

```kotlin
package ui

import androidx.compose.runtime.*
import org.jetbrains.compose.web.css.*
import org.jetbrains.compose.web.dom.*

@Composable
fun App() {
    var selectedUser by remember { mutableStateOf<User?>(null) }

    Div({
        style {
            display(DisplayStyle.Flex)
            height(100.vh)
        }
    }) {
        // Left sidebar
        Div({
            style {
                width(300.px)
                property("overflow-y", "auto")
            }
        }) {
            LoginScreen()
            UserListScreen(
                onUserSelected = { user -> selectedUser = user }
            )
            ResultsScreen()
        }

        // Main map area
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

### 4.3 Google Maps Integration

**File**: `webApp/src/jsMain/kotlin/ui/MapScreen.kt`

```kotlin
package ui

import androidx.compose.runtime.*
import kotlinx.browser.document
import org.jetbrains.compose.web.dom.Div
import org.w3c.dom.HTMLDivElement

@Composable
fun MapScreen(selectedUser: User?) {
    val mapElementId = "map-container"

    DisposableEffect(Unit) {
        val mapElement = document.getElementById(mapElementId) as? HTMLDivElement
        if (mapElement != null) {
            initializeGoogleMap(mapElement)
        }

        onDispose {
            // Cleanup map
        }
    }

    LaunchedEffect(selectedUser) {
        selectedUser?.let { user ->
            updateMapMarker(user)
        }
    }

    Div({
        id(mapElementId)
        style {
            width(100.percent)
            height(100.percent)
        }
    })
}

external fun initializeGoogleMap(element: HTMLDivElement)
external fun updateMapMarker(user: User)
```

---

## Phase 5: Integration Testing (Week 6)

### 5.1 Test Firebase Connection
- Verify authentication works on both platforms
- Test real-time database sync
- Validate data model serialization

### 5.2 Test UI Components
- User list rendering
- Map marker updates
- Results display

### 5.3 Performance Testing
- Bundle size analysis
- Initial load time
- Real-time update latency

---

## Phase 6: Deployment Setup (Week 7)

### 6.1 Web Hosting
- Configure GitHub Pages or Firebase Hosting
- Set up CI/CD pipeline
- Configure environment variables

### 6.2 Build Configuration

**File**: `webApp/webpack.config.d/config.js`

```javascript
config.output = config.output || {};
config.output.filename = 'orienteering-web.js';

config.resolve = config.resolve || {};
config.resolve.fallback = {
    ...config.resolve.fallback,
    "path": false,
    "fs": false
};
```

---

## Migration Timeline

| Week | Phase | Deliverable |
|------|-------|-------------|
| 1 | Setup | Project structure, build files |
| 2 | Domain | Data models, use cases |
| 3 | Data | Firebase integration, repositories |
| 4-5 | UI | Compose web components |
| 6 | Testing | Integration tests, bug fixes |
| 7 | Deploy | CI/CD, hosting setup |
| 8-10 | Polish | Performance, documentation |

---

## Dependencies & Prerequisites

### Required Tools
- Android Studio 2024.1+ (Ladybug or later)
- JDK 17
- Kotlin 2.0.21
- Node.js 18+ (for JS dependencies)
- Firebase account with project setup

### Firebase Configuration

Both platforms need access to Firebase config:

**Android**: `androidApp/google-services.json`
**Web**: Environment variables in build or `.env` file

```javascript
// Web Firebase Config
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
};
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Google Maps JS API differences | Medium | High | Create abstraction layer early |
| Firebase JS SDK limitations | Low | Medium | Test all features in week 3 |
| Compose for Web maturity | Medium | Medium | Keep React as backup for 1 month |
| Team learning curve | Medium | Low | Pair programming, documentation |

---

## Success Metrics

- ✅ 60%+ code shared between platforms
- ✅ Web bundle size < 500KB gzipped
- ✅ Initial load time < 3 seconds
- ✅ Feature parity with React app
- ✅ Single Firebase configuration
- ✅ Unified data models

---

## Next Steps

1. Review this plan with Android team
2. Get approval from stakeholders
3. Create feature branch: `feature/kmp-web-integration`
4. Set up shared module (Week 1)
5. Implement domain layer (Week 2)
6. Begin Firebase integration (Week 3)

---

## References

- [Kotlin Multiplatform Documentation](https://kotlinlang.org/docs/multiplatform.html)
- [Compose Multiplatform](https://www.jetbrains.com/lp/compose-multiplatform/)
- [Firebase for Web](https://firebase.google.com/docs/web/setup)
- [Android PR #3 - Modernization](https://github.com/Aria-Orienteering/android-app/pull/3)
