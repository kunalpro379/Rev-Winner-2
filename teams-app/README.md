# ServiceNow Sales Assistant for Microsoft Teams

## 🔒 **Private Installation Guide**

This Teams app runs **completely private** - other meeting participants cannot see or detect its presence.

## Installation Steps

### Step 1: Prepare the App Package
1. **Download** the complete `teams-app` folder to your computer
2. **Run the configuration script**: 
   ```bash
   node deploy.js
   ```
   This creates a ready-to-install package in the `dist` folder

### Step 2: Install in Teams (Sideloading)
1. **Open Microsoft Teams**
2. **Click Apps** in the left sidebar
3. **Click "Manage your apps"** (bottom left)
4. **Click "Upload a custom app"** → **"Upload for me"**
5. **Select all three files** from the `teams-app/dist` folder:
   - `dist/manifest.json`
   - `dist/color-icon.png` 
   - `dist/outline-icon.png`
6. **Click "Add"** to install

### Step 3: Access Privately
1. **Find "Sales Assistant"** in your personal Apps
2. **Click to open** - it opens as a **personal tab**
3. **Pin to sidebar** for quick access (right-click → Pin)

## 🔐 **Privacy Features**

- **Personal App Only**: Visible only to you, never to other meeting participants
- **No Meeting Notifications**: Doesn't announce its presence in meetings
- **Silent Operation**: All features work silently in the background
- **Private Audio**: Uses your personal microphone, not meeting audio stream
- **Discrete UI**: Minimal, professional interface that doesn't distract

## 🎯 **Usage in Meetings**

1. **Join any Teams meeting** normally
2. **Keep the Sales Assistant open** in a separate tab/window
3. **Conduct discovery calls** using the AI assistant
4. **Take notes and insights** privately
5. **Generate summaries** after the call

## ⚙️ **Configuration**

The app automatically detects when you're in a Teams meeting and:
- Adjusts audio input settings
- Enables meeting context features
- Provides enhanced discovery insights

## **Quick Start**

Once installed, the Sales Assistant provides:
- **AI-powered conversation responses**
- **Real-time speech recognition**
- **ServiceNow module recommendations**
- **Automatic discovery insights**
- **Call summary generation**

**Note**: For enterprise deployment, contact your Teams administrator for organization-wide installation.