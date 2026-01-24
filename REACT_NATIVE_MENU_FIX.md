# React Native Menu Kotlin Compilation Fix

## Problem
The Android build was failing with Kotlin compilation errors in `@react-native-menu/menu` package:

1. **MenuView.kt:28** - `'val' cannot be reassigned`
   - The `menuItems` property was declared as `val` (read-only) but the code was trying to reassign it

2. **MenuViewManagerBase.kt:143** - `Syntax error: Expecting an element`
   - The `@ReactProp` annotation had an empty name parameter: `@ReactProp(name = "")`

## Solution
Created a proper patch using `patch-package` to fix the Kotlin compilation errors:

### Changes Made

1. **Added patch-package** to `package.json` devDependencies
2. **Created patch file** at `patches/@react-native-menu+menu+2.0.0.patch` with fixes:
   - Changed `val menuItems` to `var menuItems` in MenuView.kt
   - Changed `@ReactProp(name = "")` to `@ReactProp(name = "menuTitle")` in MenuViewManagerBase.kt
3. **Updated build workflow** to remove obsolete sed-based patches for react-native-menu
4. **Configured postinstall** script to automatically apply patches

### How It Works
- When `npm install` runs, the `postinstall` script executes `patch-package`
- patch-package applies all patches from the `patches/` directory
- The Kotlin compilation errors are fixed before the Android build runs

### Testing
The patch will be automatically applied in GitHub Actions when dependencies are installed, fixing the build errors.

### Maintenance
If the package is updated, regenerate the patch with:
```bash
npm install @react-native-menu/menu@latest
# Make manual fixes to node_modules/@react-native-menu/menu/android files
npx patch-package @react-native-menu/menu
```

## Files Changed
- `package.json` - Added patch-package dependency and configured patches script
- `patches/@react-native-menu+menu+2.0.0.patch` - Patch file with Kotlin fixes
- `.github/workflows/build.yml` - Removed obsolete manual patches
