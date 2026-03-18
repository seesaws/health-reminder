# Health Reminder — Chrome Extension

A Chrome extension that sends randomized health reminders at configurable intervals to help you maintain healthy habits throughout the day.

## Features

- Customizable reminder messages
- Random interval scheduling (1–60 minutes)
- Global on/off toggle
- Quiet hours (do-not-disturb) with cross-midnight support

## Installation

### From source

1. Clone or download this repository
2. Build the UI:
   ```bash
   cd ui
   npm install
   npm run build
   ```
3. Open Chrome and navigate to `chrome://extensions`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked** and select the root project folder

## Usage

Click the extension icon in the toolbar, then click **点击打开健康小助手** to open the options page.

### Options

| Setting | Description |
|---|---|
| Notifications toggle | Enable or disable all reminders |
| Reminder messages | Add, edit, or delete reminder texts (max 100 chars each) |
| Interval | Random delay between reminders, in minutes (min–max range) |
| Quiet hours | Time range during which no reminders are sent (supports overnight ranges e.g. 23:00–07:00) |

After making changes, click **保存设置** to save.

## Development

```bash
cd ui
npm install
npm run dev    # dev server
npm run build  # production build
npm run lint   # lint
```

The built output is placed in `ui/dist/`. Copy or reference the root folder when loading the unpacked extension.

## Permissions

| Permission | Reason |
|---|---|
| `notifications` | Display reminder notifications |
| `storage` | Persist user settings via Chrome sync storage |
| `alarms` | Schedule reminders at timed intervals |

## Tech Stack

- Chrome Extension Manifest V3
- React 19 + TypeScript
- Material UI (MUI) v7
- Vite
