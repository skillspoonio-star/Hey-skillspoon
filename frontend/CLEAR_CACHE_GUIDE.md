# Clear Cache Guide - Fix Theme Issues

If you're experiencing theme issues (like invisible sidebar text), follow these steps to clear all caches:

## 1. Clear Browser Cache

### Chrome/Edge:
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Cached images and files"
3. Click "Clear data"

**OR** Hard Refresh:
- Windows: `Ctrl+Shift+R` or `Ctrl+F5`
- Mac: `Cmd+Shift+R`

### Firefox:
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Cache"
3. Click "Clear Now"

**OR** Hard Refresh:
- Windows: `Ctrl+Shift+R` or `Ctrl+F5`
- Mac: `Cmd+Shift+R`

## 2. Clear Next.js Build Cache

### Stop the Development Server
Press `Ctrl+C` in the terminal where Next.js is running

### Delete Cache Folders
```bash
# Navigate to frontend directory
cd frontend

# Delete .next folder (Windows CMD)
rmdir /s /q .next

# OR (Windows PowerShell)
Remove-Item -Recurse -Force .next

# Delete node_modules/.cache if it exists
rmdir /s /q node_modules\.cache
```

### Restart Development Server
```bash
npm run dev
```

## 3. Clear localStorage (Optional)

Open Browser DevTools:
1. Press `F12`
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Click "Local Storage"
4. Right-click and select "Clear"

## 4. Verify the Fix

After clearing caches:
1. Open the application in the browser
2. Navigate to the dashboard
3. Check if sidebar text is visible in light mode
4. Toggle between light and dark modes to verify both work

## 5. If Still Not Working

### Check CSS Variables
1. Open Browser DevTools (`F12`)
2. Inspect a sidebar menu item
3. Check the "Computed" tab
4. Look for `color` property - it should be `rgb(26, 26, 26)` or similar dark color

### Check Theme Mode
1. Make sure you're in light mode (not dark mode)
2. Click the theme toggle button to switch modes
3. Verify the sidebar changes appearance

### Restart Everything
```bash
# Stop the dev server (Ctrl+C)
# Delete cache
rmdir /s /q .next
# Restart
npm run dev
```

## Expected Results

### Light Mode:
- Sidebar background: Light gray (`#f0f0f5`)
- Sidebar text: Almost black (`#1a1a1a`)
- Active item: Orange background with white text
- Text should be clearly visible

### Dark Mode:
- Sidebar background: Very dark gray (`#0d1117`)
- Sidebar text: Light gray/white (`#f0f0f0`)
- Active item: Orange background with white text
- Text should be clearly visible

## Still Having Issues?

If the problem persists after following all steps:
1. Check if there are any custom CSS files overriding the styles
2. Verify that `globals.css` has been saved correctly
3. Check the browser console for any CSS errors
4. Try a different browser to rule out browser-specific issues
