# iOS Mobile Build Guide - Roof ER Command Center

This guide covers building and deploying the Roof ER Command Center as a native iOS application using Capacitor.

## Prerequisites

- **macOS** with Xcode installed (version 14.0 or later)
- **Node.js** (v20.10.0 or v22.0.0+)
- **Xcode Command Line Tools**: `xcode-select --install`
- **CocoaPods**: `sudo gem install cocoapods`
- **Apple Developer Account** (for deployment to App Store or TestFlight)

## Quick Start

### 1. Initial Setup

First-time setup only - initialize Capacitor and add iOS platform:

```bash
# Build the web application
npm run build

# Initialize Capacitor (only needed once)
npm run cap:init

# Add iOS platform (only needed once)
npm run cap:add:ios
```

### 2. Regular Development Workflow

After making changes to your web application:

```bash
# Build web app and sync to iOS
npm run cap:sync:ios

# Open Xcode to build/run on simulator or device
npm run cap:open:ios
```

Or use the combined command:

```bash
npm run ios:build
```

## Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run cap:init` | Initialize Capacitor configuration (one-time setup) |
| `npm run cap:add:ios` | Add iOS platform to project (one-time setup) |
| `npm run cap:sync` | Build web app and sync to all platforms |
| `npm run cap:sync:ios` | Build web app and sync to iOS only |
| `npm run cap:open:ios` | Open Xcode with the iOS project |
| `npm run cap:copy` | Copy web assets to all platforms (no build) |
| `npm run cap:copy:ios` | Copy web assets to iOS only (no build) |
| `npm run cap:update` | Update Capacitor dependencies |
| `npm run ios:build` | Complete workflow: build + sync + open Xcode |

## Project Structure

```
roof-er-command-center/
├── capacitor.config.ts       # Capacitor configuration
├── ios/                       # iOS native project (created after cap:add:ios)
│   ├── App/
│   │   ├── App/
│   │   │   ├── capacitor.config.json
│   │   │   └── config.xml
│   │   ├── App.xcodeproj/
│   │   └── App.xcworkspace/  # Open this in Xcode
│   └── Podfile
├── client/
│   ├── public/
│   │   └── manifest.json      # PWA manifest
│   ├── src/
│   │   └── service-worker.ts  # Offline support
│   └── index.html             # iOS meta tags configured
└── dist/public/               # Built web assets (synced to iOS)
```

## Configuration

### Capacitor Config (`capacitor.config.ts`)

```typescript
{
  appId: 'com.roofer.commandcenter',
  appName: 'Roof ER Command Center',
  webDir: 'dist/public',
  // ... iOS-specific settings
}
```

### Key Configuration Options

- **App ID**: `com.roofer.commandcenter` (update before App Store submission)
- **App Name**: Roof ER Command Center
- **Web Directory**: `dist/public` (Vite build output)
- **Splash Screen**: Configured with brand color (#b91c1c)
- **Status Bar**: Dark style with brand color background

## Building for iOS

### Development Build (Simulator)

1. Build and sync:
   ```bash
   npm run ios:build
   ```

2. In Xcode:
   - Select a simulator (e.g., iPhone 15 Pro)
   - Click the Play button or press Cmd+R
   - App will launch in simulator

### Development Build (Physical Device)

1. Connect your iPhone/iPad via USB
2. Build and sync:
   ```bash
   npm run ios:build
   ```

3. In Xcode:
   - Select your connected device from the device dropdown
   - Go to Signing & Capabilities tab
   - Select your Team (Apple Developer Account required)
   - Click the Play button or press Cmd+R

4. On your device:
   - Go to Settings > General > VPN & Device Management
   - Trust your developer certificate
   - Return to home screen and launch the app

### Production Build (TestFlight)

1. Ensure all configurations are production-ready:
   ```bash
   npm run build
   npm run cap:sync:ios
   npm run cap:open:ios
   ```

2. In Xcode:
   - Select "Any iOS Device (arm64)" as the build target
   - Go to Product > Archive
   - Wait for archive to complete
   - In Organizer window, select your archive
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow the wizard to upload to TestFlight

### Production Build (App Store)

After successful TestFlight testing:

1. Log into [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app or select existing app
3. Submit the build from TestFlight for App Store review
4. Complete all required metadata:
   - App description
   - Screenshots (use iOS simulator or device)
   - Keywords
   - Support URL
   - Privacy policy
5. Submit for review

## PWA Features

The app includes Progressive Web App capabilities for enhanced offline support:

### Service Worker

Located at `client/src/service-worker.ts`, provides:

- **Offline caching** of static assets
- **Cache-first strategy** with network fallback
- **Background sync** for data updates
- **Automatic cache updates**

### Manifest

Located at `client/public/manifest.json`, defines:

- App name and description
- Theme colors (matching brand: #b91c1c)
- Display mode (standalone)
- App icons

### iOS-Specific Meta Tags

Configured in `client/index.html`:

```html
<!-- iOS capabilities -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Roof ER">

<!-- Touch icons for home screen -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png">
```

## Assets Required

### App Icons

Create the following icons and place in `client/public/`:

- `icon-192.png` (192x192) - PWA icon
- `icon-512.png` (512x512) - PWA icon
- `apple-touch-icon.png` (180x180) - Default iOS icon
- `apple-touch-icon-152x152.png` (152x152) - iPad icon
- `apple-touch-icon-167x167.png` (167x167) - iPad Pro icon
- `apple-touch-icon-180x180.png` (180x180) - iPhone icon

### Splash Screens

- `splash-screen.png` - iOS splash screen
- Configure in Xcode for various device sizes (optional)

### Favicon

- `favicon.svg` or `favicon.ico` - Browser favicon

## Troubleshooting

### Issue: "No such file or directory" when running cap:sync

**Solution**: Ensure you've run `npm run build` first to create the `dist/public` directory.

```bash
npm run build
npm run cap:sync:ios
```

### Issue: CocoaPods errors

**Solution**: Update CocoaPods and reinstall dependencies:

```bash
cd ios/App
pod repo update
pod install
cd ../..
```

### Issue: Xcode build fails with signing errors

**Solution**:
1. Open Xcode
2. Select the project in the navigator
3. Go to Signing & Capabilities
4. Ensure "Automatically manage signing" is checked
5. Select your Team from dropdown

### Issue: App crashes on device but works in simulator

**Solution**: Check Console in Xcode for error messages. Common issues:
- Network requests to localhost (use actual server IP)
- Missing permissions in Info.plist
- Resources not included in build

### Issue: White screen on launch

**Solution**:
1. Check that `webDir` in `capacitor.config.ts` matches your build output
2. Verify `npm run build` completed successfully
3. Check browser console in Safari Web Inspector

## API & Backend Connectivity

### Development

The app expects the backend server at `http://localhost:3001`. For testing on physical devices:

1. Find your Mac's IP address:
   ```bash
   ipconfig getifaddr en0
   ```

2. Update Vite proxy in `vite.config.ts` (or use environment variable)

3. Ensure your device and Mac are on the same network

### Production

Update API endpoints to use production server URLs before building for App Store.

## Best Practices

1. **Always build before syncing**:
   ```bash
   npm run build && npm run cap:sync:ios
   ```

2. **Test on real devices** before App Store submission

3. **Update version numbers** in both:
   - `package.json` (version)
   - Xcode project settings (Build and Version)

4. **Test offline functionality** to ensure service worker works correctly

5. **Monitor app size** - Keep bundle size under 200KB for optimal performance

6. **Use environment variables** for API endpoints and configuration

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Xcode Documentation](https://developer.apple.com/xcode/)

## Support

For issues or questions:
1. Check Capacitor logs: `npx cap doctor`
2. Review Xcode console output
3. Check browser console in Safari Web Inspector
4. Refer to project documentation

---

**Last Updated**: January 2026
**Capacitor Version**: 8.0.1
**Minimum iOS Version**: 13.0
**Target Deployment**: iOS 13.0+
