# Development Guide

## Building

### Chrome
```bash
npm run build:chrome
```

### Firefox
```bash
npm run build:firefox
```

### Development (no minification)
```bash
npm run dev:chrome
npm run dev:firefox
```

## Debugging

### Firefox

1. Open `about:debugging` in the address bar
2. Click **"This Firefox"** (left sidebar)
3. Click **"Load Temporary Add-on..."**
4. Select `dist/manifest.json` from the file picker
5. The extension appears in the list — click **"Inspect"** to open DevTools
6. Check the **Console** tab for background script logs
7. To reload: click **"Reload"** button (circular arrow) on the extension card
8. To remove: click **"Remove"**

**Note:** After code changes, rebuild with `npm run dev:firefox` or `npm run build:firefox`, then click the **Reload** button in `about:debugging`.

### Chrome

1. Open `chrome://extensions/`
2. Enable **"Developer mode"** (toggle top-right)
3. Click **"Load unpacked"**
4. Select the `dist/` folder
5. Click the **service worker** link to inspect background script
6. Check the **Console** tab for logs
7. To reload: click the **refresh icon** on the extension card, or press `Ctrl+R`
8. To remove: click **"Remove"**

**Note:** Chrome content scripts require a page refresh after extension reload.

## Common Issues

### "Extension context invalidated"
The extension was reloaded but the page still has the old content script. **Refresh the page** to get the new content script.

### "Could not establish connection"
Tab was closed or navigated before the lookup response arrived. Normal behavior — no action needed.

### Firefox says "corrupt"
The manifest.json has invalid fields for Firefox (e.g., Manifest V3 fields). Use `npm run build:firefox` which generates a proper Manifest V2.
