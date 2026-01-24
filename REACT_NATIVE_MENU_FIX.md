# React Native Menu Kotlin Compilation Fix

## Problem
The Android build fails with Kotlin compilation errors in `@react-native-menu/menu@2.0.0` package:

1. **MenuView.kt:28** - `'val' cannot be reassigned`
   - The custom setter tries to assign `super.hitSlopRect = value`, but `hitSlopRect` in `ReactViewGroup` is a `val` (read-only)

2. **MenuViewManagerBase.kt:126** - `'val' cannot be reassigned`
   - Direct assignment `view.hitSlopRect = null` fails because the property is read-only

3. **MenuViewManagerBase.kt:128** - `'val' cannot be reassigned`
   - Direct assignment `view.hitSlopRect = (Rect(...))` fails for the same reason

4. **MenuViewManagerBase.kt:209** - `'val' cannot be reassigned`
   - Direct assignment `view.overflow = overflow` fails because the property is read-only

## Solution
Created a patch using `patch-package` to fix the Kotlin compilation errors:

### Changes Made

1. **MenuView.kt** - Fixed custom setter for `mHitSlopRect`:
   ```kotlin
   // Before:
   set(value) {
     super.hitSlopRect = value  // ERROR: val cannot be reassigned
     mHitSlopRect = value
     updateTouchDelegate()
   }
   
   // After:
   set(value) {
     field = value  // Use backing field instead
     updateTouchDelegate()
   }
   ```

2. **MenuViewManagerBase.kt** - Use setter methods instead of property assignment:
   ```kotlin
   // Before:
   view.hitSlopRect = null  // ERROR: val cannot be reassigned
   view.hitSlopRect = (Rect(...))
   view.overflow = overflow
   
   // After:
   view.setHitSlopRect(null)  // Use setter method
   view.setHitSlopRect(Rect(...))
   view.setOverflow(overflow)
   ```

### How It Works
- When `npm install` runs, the `postinstall` script executes `patch-package`
- patch-package applies all patches from the `patches/` directory
- The Kotlin compilation errors are fixed before the Android build runs

### Testing
The patch will be automatically applied in GitHub Actions when dependencies are installed.

### Maintenance
If the package is updated, regenerate the patch with:
```bash
npm install @react-native-menu/menu@latest
# Make manual fixes to node_modules/@react-native-menu/menu/android files
npx patch-package @react-native-menu/menu
```

## Files Changed
- `patches/@react-native-menu+menu+2.0.0.patch` - Patch file with Kotlin fixes to resolve val reassignment errors
