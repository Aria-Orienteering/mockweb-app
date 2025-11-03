# File Copy Checklist: mockweb-app → android-app

This document lists **exactly** what files to copy from this session's work to your local android-app repository.

---

## 📂 Files to Copy

### 1. Documentation (6 files)

**Source**: `/home/user/android-app/docs/kmp/`
**Destination**: `[your-local-android-app]/docs/kmp/`

```
docs/
└── kmp/
    ├── README_KMP_PROPOSAL.md
    ├── KMP_INTEGRATION_PLAN.md
    ├── REACT_TO_KMP_MAPPING.md
    ├── MIGRATION_GUIDE.md
    ├── COLLABORATION_PLAN.md
    └── CONSOLIDATION_GUIDE.md
```

**Action**:
```bash
# On your local machine
cd android-app
mkdir -p docs/kmp
```

Then copy these 6 files from mockweb-app PR or recreate from the PR content.

---

### 2. Shared Module Structure

**Source**: `/home/user/android-app/shared/`
**Destination**: `[your-local-android-app]/shared/`

```
shared/
├── build.gradle                    ← Build configuration
└── src/
    ├── commonMain/
    │   └── kotlin/
    │       └── com/
    │           └── ariaorienteering/
    │               └── shared/
    │                   └── domain/
    │                       └── model/
    │                           ├── User.kt
    │                           ├── Course.kt
    │                           ├── Marker.kt
    │                           └── Result.kt
    ├── commonTest/
    │   └── kotlin/
    │       └── com/
    │           └── ariaorienteering/
    │               └── shared/
    │                   └── UserTest.kt
    ├── androidMain/
    │   └── kotlin/
    │       └── com/
    │           └── ariaorienteering/
    │               └── shared/
    │                   └── (empty for now)
    └── jsMain/
        └── kotlin/
            └── com/
                └── ariaorienteering/
                    └── shared/
                        └── (empty for now)
```

**Action**:
```bash
cd android-app
mkdir -p shared/src/commonMain/kotlin/com/ariaorienteering/shared/domain/model
mkdir -p shared/src/commonTest/kotlin/com/ariaorienteering/shared
mkdir -p shared/src/androidMain/kotlin/com/ariaorienteering/shared
mkdir -p shared/src/jsMain/kotlin/com/ariaorienteering/shared
```

---

### 3. Modified Root Files (2 files)

#### File 1: `build.gradle`

**Location**: `/home/user/android-app/build.gradle`
**Changes**: Added kotlinx-serialization plugin

**Before**:
```gradle
dependencies {
    classpath 'com.android.tools.build:gradle:8.7.3'
    classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"

    // NOTE: Do not place your application dependencies here
    classpath 'com.google.gms:google-services:4.4.2'
}
```

**After**:
```gradle
dependencies {
    classpath 'com.android.tools.build:gradle:8.7.3'
    classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    classpath "org.jetbrains.kotlin:kotlin-serialization:$kotlin_version"  // ← ADD THIS LINE

    // NOTE: Do not place your application dependencies here
    classpath 'com.google.gms:google-services:4.4.2'
}
```

#### File 2: `settings.gradle`

**Location**: `/home/user/android-app/settings.gradle`
**Changes**: Added shared module

**Before**:
```gradle
include ':app'
```

**After**:
```gradle
include ':app'
include ':shared'  // ← ADD THIS LINE
```

---

### 4. Gradle Wrapper (1 file - may already exist)

**Location**: `/home/user/android-app/gradle/wrapper/gradle-wrapper.properties`

**Content**:
```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.7-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

**Note**: Your android-app may already have this. If so, **don't replace it** - just verify it has Gradle 8.7+

---

## 📝 Complete File List

Here are ALL the files you need in your local android-app:

### New Files (Create these)
```
android-app/
├── docs/kmp/                                                    # ← NEW DIRECTORY
│   ├── README_KMP_PROPOSAL.md                                   # ← NEW
│   ├── KMP_INTEGRATION_PLAN.md                                  # ← NEW
│   ├── REACT_TO_KMP_MAPPING.md                                  # ← NEW
│   ├── MIGRATION_GUIDE.md                                       # ← NEW
│   ├── COLLABORATION_PLAN.md                                    # ← NEW
│   └── CONSOLIDATION_GUIDE.md                                   # ← NEW
│
├── shared/                                                      # ← NEW DIRECTORY
│   ├── build.gradle                                             # ← NEW
│   └── src/
│       ├── commonMain/kotlin/com/ariaorienteering/shared/
│       │   └── domain/model/
│       │       ├── User.kt                                      # ← NEW
│       │       ├── Course.kt                                    # ← NEW
│       │       ├── Marker.kt                                    # ← NEW
│       │       └── Result.kt                                    # ← NEW
│       ├── commonTest/kotlin/com/ariaorienteering/shared/
│       │   └── UserTest.kt                                      # ← NEW
│       ├── androidMain/kotlin/com/ariaorienteering/shared/     # ← NEW (empty)
│       └── jsMain/kotlin/com/ariaorienteering/shared/          # ← NEW (empty)
```

### Modified Files (Edit these)
```
android-app/
├── build.gradle                      # ← MODIFY (add serialization plugin)
├── settings.gradle                   # ← MODIFY (add :shared)
└── gradle/wrapper/
    └── gradle-wrapper.properties     # ← CHECK (should have Gradle 8.7+)
```

---

## 🚀 Quick Copy Method

### Option 1: Copy from Environment (If you have access)

If you can access `/home/user/android-app/` from this session:

```bash
# On your local machine
cd ~/android-app

# Copy documentation
mkdir -p docs/kmp
scp -r [environment]:/home/user/android-app/docs/kmp/* docs/kmp/

# Copy shared module
scp -r [environment]:/home/user/android-app/shared .

# Copy modified files
scp [environment]:/home/user/android-app/build.gradle .
scp [environment]:/home/user/android-app/settings.gradle .
scp [environment]:/home/user/android-app/gradle/wrapper/gradle-wrapper.properties gradle/wrapper/
```

### Option 2: Get Files from mockweb-app PR (Recommended)

Since all the documentation is in your mockweb-app PR, you can:

```bash
# 1. Copy documentation from mockweb-app to android-app
cd ~/mockweb-app
git checkout claude/modernize-web-app-011CUg3quGQzQJyWqNz1L8ti

cd ~/android-app
mkdir -p docs/kmp
cp ~/mockweb-app/README_KMP_PROPOSAL.md docs/kmp/
cp ~/mockweb-app/KMP_INTEGRATION_PLAN.md docs/kmp/
cp ~/mockweb-app/REACT_TO_KMP_MAPPING.md docs/kmp/
cp ~/mockweb-app/MIGRATION_GUIDE.md docs/kmp/
cp ~/mockweb-app/COLLABORATION_PLAN.md docs/kmp/
cp ~/mockweb-app/CONSOLIDATION_GUIDE.md docs/kmp/
```

### Option 3: Recreate from Scratch (30 minutes)

Follow the next section for exact file contents.

---

## 📄 Exact File Contents to Create

### File 1: `shared/build.gradle`

Create: `android-app/shared/build.gradle`

```gradle
plugins {
    id 'com.android.library'
    id 'kotlin-multiplatform'
    id 'kotlinx-serialization'
}

group = 'com.ariaorienteering'
version = '1.0.0'

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
        commonMain {
            dependencies {
                implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0'
                implementation 'org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3'
                implementation 'org.jetbrains.kotlinx:kotlinx-datetime:0.6.1'
            }
        }

        androidMain {
            dependencies {
                implementation platform('com.google.firebase:firebase-bom:33.7.0')
                implementation 'com.google.firebase:firebase-auth-ktx'
                implementation 'com.google.firebase:firebase-database-ktx'
            }
        }

        jsMain {
            dependencies {
                implementation npm('firebase', '10.14.0')
            }
        }

        commonTest {
            dependencies {
                implementation kotlin('test')
            }
        }
    }
}

android {
    namespace = 'com.ariaorienteering.shared'
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

### File 2: `shared/src/commonMain/kotlin/com/ariaorienteering/shared/domain/model/User.kt`

```kotlin
package com.ariaorienteering.shared.domain.model

import kotlinx.serialization.Serializable

/**
 * Represents a user participating in orienteering.
 * This model is shared between Android and Web platforms.
 */
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

### File 3: `shared/src/commonMain/kotlin/com/ariaorienteering/shared/domain/model/Course.kt`

```kotlin
package com.ariaorienteering.shared.domain.model

import kotlinx.serialization.Serializable

/**
 * Represents an orienteering course with markers.
 * Shared between Android and Web platforms.
 */
@Serializable
data class Course(
    val id: String = "",
    val name: String = "",
    val markers: List<Marker> = emptyList()
)
```

### File 4: `shared/src/commonMain/kotlin/com/ariaorienteering/shared/domain/model/Marker.kt`

```kotlin
package com.ariaorienteering.shared.domain.model

import kotlinx.serialization.Serializable

/**
 * Represents a marker on an orienteering course.
 * Status indicates whether it's been found, targeted, or not found yet.
 */
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

### File 5: `shared/src/commonMain/kotlin/com/ariaorienteering/shared/domain/model/Result.kt`

```kotlin
package com.ariaorienteering.shared.domain.model

import kotlinx.serialization.Serializable

/**
 * Represents the result of a completed orienteering course.
 */
@Serializable
data class Result(
    val uid: String = "",
    val name: String = "",
    val course: String = "",
    val time: String = "",
    val timestamp: Long = 0L
) {
    /**
     * Returns a formatted message for display.
     * Example: "John completed course Forest Trail in 45:30"
     */
    fun formattedMessage(): String =
        "$name completed course $course in $time"
}
```

### File 6: `shared/src/commonTest/kotlin/com/ariaorienteering/shared/UserTest.kt`

```kotlin
package com.ariaorienteering.shared

import com.ariaorienteering.shared.domain.model.*
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * Tests for shared data models.
 * These tests run on all platforms (Android, JS, etc.)
 */
class UserTest {

    @Test
    fun testUserCreation() {
        val user = User(
            uid = "test123",
            firstName = "John",
            lat = -38.560926,
            lon = 174.983468,
            active = true
        )

        assertEquals("test123", user.uid)
        assertEquals("John", user.firstName)
        assertEquals(true, user.active)
        assertEquals(-38.560926, user.lat, 0.0001)
    }

    @Test
    fun testUserWithCourse() {
        val markers = listOf(
            Marker(lat = -38.56, lon = 174.98, status = MarkerStatus.FOUND),
            Marker(lat = -38.57, lon = 174.99, status = MarkerStatus.TARGET),
            Marker(lat = -38.58, lon = 175.00, status = MarkerStatus.NOT_FOUND)
        )

        val course = Course(
            id = "course1",
            name = "Forest Trail",
            markers = markers
        )

        val user = User(
            uid = "user1",
            firstName = "Jane",
            lat = -38.56,
            lon = 174.98,
            active = true,
            courseObject = course
        )

        assertEquals("Forest Trail", user.courseObject?.name)
        assertEquals(3, user.courseObject?.markers?.size)
    }

    @Test
    fun testMarkerStatus() {
        val foundMarker = Marker(lat = 0.0, lon = 0.0, status = MarkerStatus.FOUND)
        val targetMarker = Marker(lat = 0.0, lon = 0.0, status = MarkerStatus.TARGET)
        val notFoundMarker = Marker(lat = 0.0, lon = 0.0, status = MarkerStatus.NOT_FOUND)

        assertEquals(MarkerStatus.FOUND, foundMarker.status)
        assertEquals(MarkerStatus.TARGET, targetMarker.status)
        assertEquals(MarkerStatus.NOT_FOUND, notFoundMarker.status)
    }

    @Test
    fun testResultFormattedMessage() {
        val result = Result(
            uid = "user1",
            name = "Alice",
            course = "Mountain Trek",
            time = "45:30",
            timestamp = System.currentTimeMillis()
        )

        val message = result.formattedMessage()
        assertTrue(message.contains("Alice"))
        assertTrue(message.contains("Mountain Trek"))
        assertTrue(message.contains("45:30"))
        assertEquals("Alice completed course Mountain Trek in 45:30", message)
    }
}
```

---

## ✅ Verification Checklist

After copying/creating all files, verify:

```bash
cd android-app

# 1. Check all files exist
ls docs/kmp/
# Should show: 6 markdown files

ls shared/
# Should show: build.gradle, src/

ls shared/src/commonMain/kotlin/com/ariaorienteering/shared/domain/model/
# Should show: User.kt, Course.kt, Marker.kt, Result.kt

# 2. Check modifications
grep "kotlin-serialization" build.gradle
# Should find the classpath line

grep ":shared" settings.gradle
# Should find: include ':shared'

# 3. Try to build
./gradlew :shared:build

# Expected: BUILD SUCCESSFUL
```

---

## 🎯 Summary

**Total Items to Copy/Create**:
- 📁 1 new directory: `docs/kmp/`
- 📁 1 new directory: `shared/`
- 📄 6 documentation files
- 📄 5 Kotlin source files
- 📄 1 test file
- 📄 1 build.gradle (shared module)
- ✏️ 2 modified files (root build.gradle, settings.gradle)

**Time to recreate from scratch**: ~30 minutes

**Easiest method**: Copy from mockweb-app PR for docs + create Kotlin files (file contents above)

---

## 📞 Next Steps After Copying

1. Verify all files are in place (checklist above)
2. Commit to git:
   ```bash
   git checkout -b feature/kmp-web-integration
   git add .
   git commit -m "Add KMP integration foundation"
   git push -u origin feature/kmp-web-integration
   ```
3. Build and test:
   ```bash
   ./gradlew :shared:build
   ./gradlew :shared:test
   ```
4. Start Week 2 from MIGRATION_GUIDE.md

---

**Last Updated**: 2025-11-01
**Source**: This session's work in `/home/user/android-app/`
**Destination**: Your local android-app repository
