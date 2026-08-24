<div align="center">

# 🌌 HomeDesk

### *Your personalized, glassmorphic new tab dashboard.*

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](manifest.json)
[![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](script.js)
[![CSS3 Glassmorphism](https://img.shields.io/badge/CSS3-Glassmorphism-1572B6?style=for-the-badge&logo=css3&logoColor=white)](style.css)
[![Dependencies](https://img.shields.io/badge/Dependencies-Zero-success?style=for-the-badge)](manifest.json)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25_Local-9cf?style=for-the-badge&logo=shield&logoColor=white)](#-privacy--offline-first)

<br/>

<p align="center">
  <b>HomeDesk</b> transforms your browser's new tab page into a high-performance, dark glassmorphism command center. Organize your frequently visited shortcuts across custom categorized grids, switch search engines on the fly, and back up or sync your configuration with ease.
</p>

</div>

---

## ✨ Features

### 🗂️ Categorized Shortcut Grids
- **Dynamic Panels**: Create unlimited customizable grids (e.g. *Work*, *Social*, *Dev*, *Entertainment*).
- **Inline Renaming**: Double-click any grid title to quickly rename it.
- **Drag-and-Drop Reordering**: Easily rearrange shortcut icons within any grid.
- **Context Menu Editing**: Right-click any shortcut icon to edit its destination URL, icon, or display label.
- **Smart Responsive Layout**: Dynamically balances grid panels across top and bottom rows based on your viewport and count.

### 🖼️ Appearance & Visual Customization
- **Upload Custom Background**: Upload any local image file (JPG, PNG, WebP) with automatic canvas downsampling & optimization.
- **Dim & Blur Sliders**: Fine-tune background brightness (0–80%) and backdrop blur (0–20px) for optimal contrast.
- **Tile Shapes**: Switch shortcut tiles between **Circle**, **Squircle** (Apple-style rounded squircle), or **Square**.
- **Minimalist Mode**: Toggle website text titles on/off for an icon-only clean aesthetic.

### 🔍 Multi-Engine Search Bar
- **Instant Engine Switching**: Seamlessly toggle between **Google**, **Bing**, **DuckDuckGo**, **YouTube**, **Brave Search**, and **Startpage**.
- **Default Engine Persistence**: Changing engine from the search dropdown or Settings modal automatically saves and syncs across restarts.
- **Type-to-Search**: Start typing anywhere on the page without clicking to automatically focus the search bar.

### ⏰ Clock, Date & Greeting Controls
- **12-Hour vs 24-Hour**: Toggle between `02:30 PM` and `14:30:00`.
- **Show / Hide Seconds**: Minimalist time or live-ticking seconds.
- **Date Formats**: Switch between `DD/MM/YY`, `MM/DD/YY`, or expanded `Text` format (e.g. *Mon, 24 Aug*).
- **Display Name Editor**: Update your greeting nickname directly in settings.

### 🖱️ Shortcut Interactions
- **Single Click**: Opens website in the current tab.
- **Double Click**: Opens website in a new tab (`_blank`).
- **Right Click**: Opens full shortcut editor (rename, custom FA icon, or image URL).

### 💾 Backup, Restore & Factory Reset
- **JSON Export & Sync**: Download timestamped `.json` backups or copy directly to clipboard with full settings preservation.
- **Flexible Restore**: Choose between **Replace** (full restore) or **Merge** (appends imported grids).
- **Factory Reset**: One-click safe wipe to reset all settings, wallpaper, and shortcuts back to clean defaults.

---

## 🖥️ Layout Overview

```
+-------------------------------------------------------------------------+
| [⚙ Settings]                                           [+ Add Grid]    |
|                                                                         |
|  +--------------------+  +--------------------+  +--------------------+ |
|  |     WORK (3x3)     |  |    SOCIAL (3x3)    |  |     DEV (3x3)      | |
|  +--------------------+  +--------------------+  +--------------------+ |
|                                                                         |
|          Alex ❤️      [🔍 Google ▾ | Search Google...   ]    14:20:00    |
|                                                              24/08/26   |
|                                                                         |
|  +--------------------+  +--------------------+  +--------------------+ |
|  |    MEDIA (3x3)     |  |    TOOLS (3x3)     |  |    STUDY (3x3)     | |
|  +--------------------+  +--------------------+  +--------------------+ |
+-------------------------------------------------------------------------+
```

---

## 🚀 Installation & Usage

### Method 1: Chrome Extension (Manifest V3)
1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/HomeDesk.git
   ```
2. Open Google Chrome (or any Chromium-based browser like Brave, Edge, Opera, or Vivaldi).
3. Navigate to `chrome://extensions/`.
4. Enable **Developer mode** using the toggle switch in the top right.
5. Click **Load unpacked** in the top left.
6. Select the `HomeDesk` root directory.
7. Open a new tab (`Ctrl + T` / `Cmd + T`) to launch your new dashboard!

### Method 2: Standalone Local / Web Dashboard
Simply open `index.html` in any modern web browser or serve it with any local static HTTP server (e.g. `npx serve .` or VS Code Live Server).

---

## ⌨️ Shortcuts & Gestures

| Action | Gesture / Shortcut |
| :--- | :--- |
| **Type to Search** | Simply start typing anywhere on the screen |
| **Submit Search** | Press <kbd>Enter</kbd> inside search bar |
| **Rename Grid** | **Double-click** any grid title |
| **Edit Shortcut** | **Right-click** on any shortcut icon |
| **Reorder Shortcuts** | Click the grid edit pen (<kbd><i class="fas fa-pen"></i></kbd>), then **drag & drop** |
| **Delete Shortcut** | Click the grid edit pen, then click the <kbd>×</kbd> badge |
| **Close Modals** | Press <kbd>Esc</kbd> or click outside the modal card |

---

## 📁 File Structure

```
HomeDesk/
├── 📄 index.html        # Semantic dashboard structure and modal templates
├── 🎨 style.css         # Dark glassmorphic design system and CSS Grid layouts
├── ⚡ script.js         # Core application logic, grid CRUD, offline caching, and backup
├── 🔍 search.js         # Multi-engine search handler & keyboard type-to-search
├── 🖼️ bg.jpg            # Default background wallpaper
├── ⚙️ manifest.json     # Chrome Extension Manifest V3 configuration
└── 📖 README.md         # Project documentation
```

---

## 📦 Backup JSON Schema

Exported backup files adhere to the following structured JSON schema:

```json
{
  "version": 1,
  "app": "HomeDesk",
  "exportedAt": "2026-08-24T01:30:00.000Z",
  "userName": "Alex",
  "grids": [
    {
      "name": "Development",
      "items": [
        {
          "name": "GitHub",
          "url": "https://github.com",
          "icon": "fab fa-github",
          "favicon": "data:image/png;base64,..."
        }
      ]
    }
  ]
}
```

---

## 🔒 Privacy & Offline First

- **100% Client-Side**: All data, shortcuts, settings, and cached icons reside entirely in your browser's local storage (`localStorage`).
- **No Trackers or Analytics**: Zero telemetry, tracking pixels, or external analytical scripts.
- **Offline Capable**: Cached Base64 favicons allow shortcuts to render smoothly without an active internet connection.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
