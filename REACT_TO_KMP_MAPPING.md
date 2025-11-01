# React to KMP Architecture Mapping
## Component Migration Reference Guide

**Date**: 2025-11-01
**Version**: 1.0
**Source**: mockweb-app (React 16.2)
**Target**: KMP + Compose for Web

---

## Overview

This document maps each React component from the existing web app to the proposed KMP architecture, clearly identifying what code should be shared in the `shared` module versus what should remain platform-specific in the `webApp` module.

---

## Architecture Layers

### Shared Module (`shared/`)
- ✅ Data models
- ✅ Business logic
- ✅ Firebase integration
- ✅ State management
- ✅ Use cases
- ✅ Repositories

### Platform-Specific (`webApp/` and `androidApp/`)
- 🌐 UI components
- 🌐 Google Maps rendering
- 🌐 Platform-specific navigation
- 🌐 View state holders (platform-specific)

---

## Component Mapping

## 1. Authentication (`Login.js`)

### Current React Implementation

**File**: `src/components/Login.js`

```javascript
// React Component - Class-based, Material-UI v0.20
class Login extends Component {
    login() {
        auth.signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                this.setState({ user });
            });
    }

    logout() {
        auth.signOut().then(() => {
            this.setState({ user: null });
        });
    }
}
```

### KMP Migration

#### ✅ Shared Code (`shared/src/commonMain/`)

**File**: `shared/src/commonMain/kotlin/domain/auth/AuthRepository.kt`

```kotlin
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

**File**: `shared/src/commonMain/kotlin/domain/auth/AuthState.kt`

```kotlin
sealed class AuthState {
    object Loading : AuthState()
    data class Authenticated(val user: User) : AuthState()
    object Unauthenticated : AuthState()
    data class Error(val message: String) : AuthState()
}
```

#### 🌐 Platform-Specific UI (`webApp/src/jsMain/`)

**File**: `webApp/src/jsMain/kotlin/ui/LoginScreen.kt`

```kotlin
@Composable
fun LoginScreen() {
    val authRepository = remember { AuthRepository(FirebaseClient()) }
    var authState by remember { mutableStateOf<AuthState>(AuthState.Loading) }

    LaunchedEffect(Unit) {
        authRepository.observeAuthState()
            .collect { user ->
                authState = if (user != null) {
                    AuthState.Authenticated(user)
                } else {
                    AuthState.Unauthenticated
                }
            }
    }

    Div({
        classes("auth-container")
    }) {
        when (val state = authState) {
            is AuthState.Authenticated -> {
                Button({
                    onClick {
                        scope.launch { authRepository.signOut() }
                    }
                }) {
                    Text("Sign Out")
                }
            }
            is AuthState.Unauthenticated -> {
                Button({
                    onClick {
                        scope.launch {
                            authRepository.signInWithGoogle().collect { /* handle result */ }
                        }
                    }
                }) {
                    Text("Sign in with Google")
                }
            }
            // ... other states
        }
    }
}
```

**Shared**: 90% (All auth logic, state management)
**Platform**: 10% (UI rendering only)

---

## 2. User List (`UserButtons.js`)

### Current React Implementation

**File**: `src/components/UserButtons.js`

```javascript
class UserButtons extends Component {
    click(user, e) {
        this.setState({ activeUser: user.uid }, () => {
            PubSub.publish('user', user);
        });
    }

    render() {
        return this.props.users.map(i => this.button(i));
    }
}

const mapState = state => ({ users: state.users });
const mapDispatch = dispatch => {
    dispatch(getUsersThunk());
    watchUserChangedEvent(dispatch);
};
```

### KMP Migration

#### ✅ Shared Code

**File**: `shared/src/commonMain/kotlin/domain/usecase/GetActiveUsersUseCase.kt`

```kotlin
class GetActiveUsersUseCase(
    private val userRepository: UserRepository
) {
    operator fun invoke(): Flow<List<User>> =
        userRepository.observeActiveUsers()
}
```

**File**: `shared/src/commonMain/kotlin/data/repository/UserRepository.kt`

```kotlin
class UserRepository(
    private val firebaseClient: FirebaseClient
) {
    fun observeActiveUsers(): Flow<List<User>> =
        firebaseClient.observeUsers()
            .map { users -> users.filter { it.active } }

    private val _selectedUser = MutableStateFlow<User?>(null)
    val selectedUser: StateFlow<User?> = _selectedUser.asStateFlow()

    fun selectUser(user: User) {
        _selectedUser.value = user
    }
}
```

#### 🌐 Platform-Specific UI

**File**: `webApp/src/jsMain/kotlin/ui/UserListScreen.kt`

```kotlin
@Composable
fun UserListScreen(
    onUserSelected: (User) -> Unit
) {
    val getActiveUsersUseCase = remember { GetActiveUsersUseCase(UserRepository(FirebaseClient())) }
    var users by remember { mutableStateOf<List<User>>(emptyList()) }

    LaunchedEffect(Unit) {
        getActiveUsersUseCase().collect { userList ->
            users = userList
        }
    }

    Div({
        classes("user-list-container")
    }) {
        if (users.isEmpty()) {
            P { Text("No Users") }
        } else {
            users.forEach { user ->
                Button({
                    classes("user-button")
                    onClick { onUserSelected(user) }
                }) {
                    Img(src = "/compass_icon.png") {
                        classes("user-icon")
                    }
                    Text(user.firstName)
                }
            }
        }
    }
}
```

**Shared**: 85% (Data fetching, filtering, state management)
**Platform**: 15% (UI rendering, user interaction)

---

## 3. Map Container (`MapContainer.js`)

### Current React Implementation

**File**: `src/components/MapContainer.js`

```javascript
class MapContainer extends Component {
    componentWillMount() {
        this.token = PubSub.subscribe('user', (topic, user) => {
            this.setState({ selection: user });
        });
    }

    renderUser() {
        // Complex marker rendering logic
        let user = this.props.users[i];
        let userLatLng = { lat: user.lat, lng: user.lon };
        marker = new maps.Marker({
            position: userLatLng,
            map: this.map,
            icon: symbol,
        });

        if (user.courseObject != null) {
            this.addCourseMarkers(this.map, maps, user.courseObject);
        }
    }

    statusSymbol(status, maps) {
        // Returns different symbols based on marker status
        if (status === "NOT_FOUND") { /* yellow arrow */ }
        else if (status === "FOUND") { /* green arrow */ }
        else if (status === "TARGET") { /* orange arrow */ }
    }
}
```

### KMP Migration

#### ✅ Shared Code

**File**: `shared/src/commonMain/kotlin/domain/model/MapState.kt`

```kotlin
data class MapState(
    val center: LatLng = LatLng(-38.560926, 174.983468),
    val zoom: Int = 15,
    val selectedUser: User? = null,
    val markers: List<MapMarker> = emptyList()
)

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

**File**: `shared/src/commonMain/kotlin/domain/usecase/GetMapMarkersUseCase.kt`

```kotlin
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
```

**File**: `shared/src/commonMain/kotlin/domain/usecase/ObserveMapStateUseCase.kt`

```kotlin
class ObserveMapStateUseCase(
    private val userRepository: UserRepository,
    private val getMapMarkersUseCase: GetMapMarkersUseCase
) {
    operator fun invoke(): Flow<MapState> =
        userRepository.selectedUser
            .map { user ->
                MapState(
                    selectedUser = user,
                    markers = getMapMarkersUseCase(user),
                    center = user?.let { LatLng(it.lat, it.lon) }
                        ?: LatLng(-38.560926, 174.983468)
                )
            }
}
```

#### 🌐 Platform-Specific UI

**File**: `webApp/src/jsMain/kotlin/ui/MapScreen.kt`

```kotlin
@Composable
fun MapScreen(selectedUser: User?) {
    val observeMapStateUseCase = remember {
        ObserveMapStateUseCase(
            userRepository,
            GetMapMarkersUseCase()
        )
    }
    var mapState by remember { mutableStateOf(MapState()) }
    val mapRef = remember { mutableStateOf<GoogleMap?>(null) }

    // Observe map state changes
    LaunchedEffect(Unit) {
        observeMapStateUseCase().collect { state ->
            mapState = state
        }
    }

    // Update map markers when state changes
    LaunchedEffect(mapState) {
        mapRef.value?.let { map ->
            updateMapMarkers(map, mapState.markers)
            map.panTo(mapState.center.toGoogleLatLng())
        }
    }

    Div({
        id("map-container")
        style {
            width(100.percent)
            height(100.percent)
        }
    })
}

// Platform-specific Google Maps integration
external interface GoogleMap {
    fun panTo(latLng: dynamic)
    fun setZoom(zoom: Int)
}

fun updateMapMarkers(map: GoogleMap, markers: List<MapMarker>) {
    // Clear existing markers
    clearMarkers()

    // Add new markers with appropriate icons
    markers.forEach { marker ->
        addMarker(map, marker)
    }
}

fun getMarkerIcon(type: MarkerType): dynamic {
    return when (type) {
        MarkerType.USER -> createCircleIcon("cyan")
        MarkerType.COURSE_NOT_FOUND -> createArrowIcon("yellow")
        MarkerType.COURSE_TARGET -> createArrowIcon("orange")
        MarkerType.COURSE_FOUND -> createArrowIcon("green")
        MarkerType.HOME -> createCircleIcon("blue")
    }
}
```

**Shared**: 70% (Marker logic, state computation, data models)
**Platform**: 30% (Google Maps API integration, rendering)

---

## 4. Results Display (`Results.js`)

### Current React Implementation

**File**: `src/components/Results.js`

```javascript
class Results extends Component {
    result(result) {
        return <div key={result.uid}>
            <p>{result.name} completed course {result.course} in {result.time}</p>
        </div>
    }

    render() {
        if (this.props.results.length > 0) {
            return this.props.results.map(i => this.result(i));
        } else {
            return <div><p>No completed courses yet</p></div>
        }
    }
}

const mapDispatch = dispatch => {
    dispatch(getResultsThunk());
    watchResultsChangedEvent(dispatch);
};
```

### KMP Migration

#### ✅ Shared Code

**File**: `shared/src/commonMain/kotlin/domain/usecase/GetCourseResultsUseCase.kt`

```kotlin
class GetCourseResultsUseCase(
    private val resultsRepository: ResultsRepository
) {
    operator fun invoke(): Flow<List<Result>> =
        resultsRepository.observeResults()
            .map { results ->
                results.filter { it.uid != "test" }
                    .sortedByDescending { it.timestamp }
            }
}
```

**File**: `shared/src/commonMain/kotlin/data/repository/ResultsRepository.kt`

```kotlin
class ResultsRepository(
    private val firebaseClient: FirebaseClient
) {
    fun observeResults(): Flow<List<Result>> =
        firebaseClient.observeResults()
}
```

**File**: `shared/src/commonMain/kotlin/domain/model/Result.kt`

```kotlin
@Serializable
data class Result(
    val uid: String,
    val name: String,
    val course: String,
    val time: String,
    val timestamp: Long = 0L
) {
    fun formattedMessage(): String =
        "$name completed course $course in $time"
}
```

#### 🌐 Platform-Specific UI

**File**: `webApp/src/jsMain/kotlin/ui/ResultsScreen.kt`

```kotlin
@Composable
fun ResultsScreen() {
    val getCourseResultsUseCase = remember {
        GetCourseResultsUseCase(ResultsRepository(FirebaseClient()))
    }
    var results by remember { mutableStateOf<List<Result>>(emptyList()) }

    LaunchedEffect(Unit) {
        getCourseResultsUseCase().collect { resultList ->
            results = resultList
        }
    }

    Div({
        classes("results-container")
    }) {
        H3 { Text("Results") }

        if (results.isEmpty()) {
            P { Text("No completed courses yet") }
        } else {
            results.forEach { result ->
                Div({
                    classes("result-item")
                    key(result.uid)
                }) {
                    P { Text(result.formattedMessage()) }
                }
            }
        }
    }
}
```

**Shared**: 95% (Data fetching, filtering, formatting)
**Platform**: 5% (UI rendering only)

---

## 5. Redux Store (`Store.js`)

### Current React Implementation

**File**: `src/store/Store.js`

```javascript
// Action creators
export const getUsers = (users) => ({type: GET_USERS, users});
export const getResults = (results) => ({type: GET_RESULTS, results});

// Thunks
export function getUsersThunk() {
    return dispatch => {
        const users = [];
        rootUsers.once('value', snap => {
            snap.forEach(data => {
                let user = data.val();
                if (user.active) {
                    users.push(user)
                }
            })
        }).then(() => dispatch(getUsers(users)))
    }
}

// Listeners
export function watchUserChangedEvent(dispatch) {
    rootUsers.on('child_changed', () => {
        dispatch(getUsersThunk());
    });
}

// Reducers
const users = function UserReducer (state = [], action) {
    switch (action.type) {
        case GET_USERS:
            return action.users;
        default:
            return state
    }
};
```

### KMP Migration

#### ✅ Shared Code - Completely Replaces Redux

**File**: `shared/src/commonMain/kotlin/data/repository/UserRepository.kt`

```kotlin
class UserRepository(
    private val firebaseClient: FirebaseClient
) {
    private val _users = MutableStateFlow<List<User>>(emptyList())
    val users: StateFlow<List<User>> = _users.asStateFlow()

    init {
        // Automatically observe Firebase changes
        scope.launch {
            firebaseClient.observeUsers().collect { userList ->
                _users.value = userList
            }
        }
    }

    fun observeActiveUsers(): Flow<List<User>> =
        users.map { userList ->
            userList.filter { it.active }
        }
}
```

**File**: `shared/src/commonMain/kotlin/data/repository/ResultsRepository.kt`

```kotlin
class ResultsRepository(
    private val firebaseClient: FirebaseClient
) {
    private val _results = MutableStateFlow<List<Result>>(emptyList())
    val results: StateFlow<List<Result>> = _results.asStateFlow()

    init {
        scope.launch {
            firebaseClient.observeResults().collect { resultList ->
                _results.value = resultList
            }
        }
    }

    fun observeResults(): Flow<List<Result>> = results
}
```

**No Platform-Specific Code Needed** - Kotlin Flows replace Redux completely

**Shared**: 100%
**Platform**: 0%

---

## 6. Firebase Configuration (`firebase.js`)

### Current React Implementation

**File**: `src/firebase/firebase.js`

```javascript
import * as firebase from 'firebase'

var config = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    // ...
};
firebase.initializeApp(config);

export const provider = new firebase.auth.GoogleAuthProvider();
export const auth = firebase.auth();
```

### KMP Migration

#### ✅ Shared Interface

**File**: `shared/src/commonMain/kotlin/data/firebase/FirebaseClient.kt`

```kotlin
expect class FirebaseClient() {
    fun initialize()
    fun signInWithGoogle(): Flow<AuthResult>
    fun signOut()
    fun observeAuthState(): Flow<User?>
    fun observeUsers(): Flow<List<User>>
    fun observeResults(): Flow<List<Result>>
}
```

#### 🌐 Platform-Specific Implementations

**File**: `shared/src/jsMain/kotlin/data/firebase/FirebaseClientJs.kt`

```kotlin
actual class FirebaseClient {
    private val auth: Auth
    private val database: Database

    init {
        val config = FirebaseConfig(
            apiKey = js("process.env.FIREBASE_API_KEY"),
            authDomain = js("process.env.FIREBASE_AUTH_DOMAIN"),
            databaseURL = js("process.env.FIREBASE_DATABASE_URL"),
            projectId = js("process.env.FIREBASE_PROJECT_ID"),
            storageBucket = js("process.env.FIREBASE_STORAGE_BUCKET"),
            messagingSenderId = js("process.env.FIREBASE_MESSAGING_SENDER_ID")
        )

        val app = initializeApp(config)
        auth = getAuth(app)
        database = getDatabase(app)
    }

    actual fun signInWithGoogle(): Flow<AuthResult> = flow {
        try {
            val provider = GoogleAuthProvider()
            val result = signInWithPopup(auth, provider).await()
            emit(AuthResult.Success(result.user.toUser()))
        } catch (e: Exception) {
            emit(AuthResult.Error(e.message ?: "Unknown error"))
        }
    }

    actual fun observeUsers(): Flow<List<User>> = callbackFlow {
        val usersRef = ref(database, "users")
        val listener = onValue(usersRef) { snapshot ->
            val users = snapshot.children.mapNotNull { it.toUser() }
            trySend(users)
        }
        awaitClose { listener.unsubscribe() }
    }

    // ... other methods
}
```

**File**: `shared/src/androidMain/kotlin/data/firebase/FirebaseClientAndroid.kt`

```kotlin
actual class FirebaseClient {
    private val auth = FirebaseAuth.getInstance()
    private val database = FirebaseDatabase.getInstance()

    actual fun signInWithGoogle(): Flow<AuthResult> = flow {
        // Android-specific Google Sign-In implementation
    }

    actual fun observeUsers(): Flow<List<User>> = callbackFlow {
        val usersRef = database.getReference("users")
        val listener = usersRef.addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val users = snapshot.children.mapNotNull {
                    it.getValue(User::class.java)
                }
                trySend(users)
            }
            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        })
        awaitClose { usersRef.removeEventListener(listener) }
    }

    // ... other methods
}
```

**Shared**: 30% (Interface definition)
**Platform**: 70% (Platform-specific SDK implementation)

---

## Summary Table

| Component | React File | Shared % | Platform % | Key Shared Elements | Platform Elements |
|-----------|-----------|----------|------------|---------------------|-------------------|
| **Auth** | `Login.js` | 90% | 10% | AuthRepository, AuthState, business logic | UI rendering, platform auth flow |
| **User List** | `UserButtons.js` | 85% | 15% | GetActiveUsersUseCase, UserRepository, filtering | UI rendering, click handlers |
| **Map** | `MapContainer.js` | 70% | 30% | MapState, marker logic, use cases | Google Maps API, marker rendering |
| **Results** | `Results.js` | 95% | 5% | GetCourseResultsUseCase, ResultsRepository, formatting | UI rendering only |
| **State** | `Store.js` | 100% | 0% | All repositories, StateFlow | N/A - Kotlin Flows |
| **Firebase** | `firebase.js` | 30% | 70% | Interface definitions | Platform-specific SDK calls |
| **Models** | `User.js` | 100% | 0% | All data classes | N/A |

**Overall Code Sharing: ~68%** (aligns with 60-70% estimate in Android PR)

---

## Key Architectural Improvements

### 1. **No More Redux**
- Replace with Kotlin StateFlow/SharedFlow
- Type-safe state management
- Automatic subscription cleanup

### 2. **No More PubSub**
- Replace with reactive streams (Flow)
- Better lifecycle management
- Type-safe events

### 3. **Clean Architecture**
- Clear separation: Domain → Data → UI
- Shared business logic
- Platform-specific UI only

### 4. **Type Safety**
- Kotlin's type system across all layers
- Compile-time error detection
- No runtime surprises from JS

### 5. **Modern Patterns**
- Use cases for business logic
- Repository pattern for data access
- Expect/Actual for platform differences

---

## Next Steps

1. ✅ Review this mapping with team
2. Start with shared models (easiest, highest value)
3. Implement Firebase abstraction layer
4. Build repositories and use cases
5. Create platform-specific UI last

This mapping ensures maximum code reuse while maintaining platform-specific optimizations where needed.
