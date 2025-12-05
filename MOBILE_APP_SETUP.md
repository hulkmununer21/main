# Domus Servitia Mobile App Setup

This guide will help you build and deploy the Domus Servitia mobile app using Capacitor.

## 📱 Mobile App Features

- **Splash Screen**: Beautiful landing page at `/app`
- **Onboarding**: 3-screen tutorial flow at `/onboarding`
- **Authentication**: Role-based login (Lodger, Landlord, Staff, Admin)
- **Mobile Home**: Dashboard that routes to appropriate portal
- **Bottom Navigation**: Role-specific navigation tabs (Lodger: Home/Payments/Maintenance/Messages/Profile, Landlord: Home/Properties/Tenants/Finance/Profile, Staff: Home/Tasks/Inspections/Messages/Profile, Admin: Dashboard/Users/Properties/Reports/Settings)
- **Native Features**: Ready for push notifications, camera, biometrics
- **Safe Area Support**: Handles iPhone notch and bottom bar automatically

## 🚀 Quick Start

### Prerequisites
- Node.js and npm installed
- Git installed
- For iOS: Mac with Xcode
- For Android: Android Studio

### Step 1: Export to GitHub
1. Click "Export to GitHub" in Lovable
2. Clone your repository locally:
```bash
git clone <your-repo-url>
cd domus-dwell-manage
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Build the Web App
```bash
npm run build
```

### Step 4: Add Native Platforms

#### For iOS (Mac only):
```bash
npx cap add ios
npx cap sync ios
```

#### For Android:
```bash
npx cap add android
npx cap sync android
```

### Step 5: Open in Native IDE

#### iOS:
```bash
npx cap open ios
```
This opens Xcode. You can then:
- Build and run on simulator
- Connect physical device and run
- Archive for App Store submission

#### Android:
```bash
npx cap open android
```
This opens Android Studio. You can then:
- Build and run on emulator
- Connect physical device and run
- Generate signed APK/Bundle for Play Store

## 🔄 Development Workflow

### Live Reload During Development
The `capacitor.config.ts` is configured with:
```typescript
server: {
  url: 'https://0acd939c-0642-4960-8fb5-34a30390088b.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

This means your mobile app will load from the Lovable preview URL, giving you live reload during development.

### When You Make Changes in Lovable:
1. The preview URL automatically updates
2. Reload your app in the simulator/emulator
3. See changes instantly

### Before Production:
1. Remove or comment out the `server` section in `capacitor.config.ts`
2. Build your app: `npm run build`
3. Sync: `npx cap sync`
4. The app will now use the bundled web assets

## 📦 App Structure

### Mobile-Specific Routes
- `/app` - App splash/landing page (linked from website footer)
- `/onboarding` - 3-screen onboarding flow
- `/mobile-home` - Mobile dashboard (routes to portals)
- `/login` - Authentication (Lodger/Landlord)
- `/staff-login` - Staff/Admin authentication

### Portal Routes (Protected)
- `/lodger-portal` - Lodger dashboard
- `/landlord-portal` - Landlord dashboard
- `/staff-portal` - Staff dashboard
- `/admin-portal` - Admin dashboard

## 🔐 Authentication Flow

1. User opens app → `/app` (Splash)
2. Clicks "Get Started" → `/onboarding`
3. Completes onboarding → `/login`
4. Logs in → `/mobile-home`
5. Accesses role-specific portal

## 🔔 Adding Native Features

### Push Notifications
```bash
npm install @capacitor/push-notifications
npx cap sync
```

### Camera
```bash
npm install @capacitor/camera
npx cap sync
```

### Biometric Authentication
```bash
npm install @capacitor-community/biometric
npx cap sync
```

### Storage (Secure)
```bash
npm install @capacitor/preferences
npx cap sync
```

## 🎨 Customization

### App Icon and Splash Screen
1. Create icons in `public/` directory
2. Use [Capacitor Asset Generator](https://github.com/ionic-team/capacitor-assets)
```bash
npm install -D @capacitor/assets
npx capacitor-assets generate
```

### App Name and ID
Edit `capacitor.config.ts`:
```typescript
{
  appId: 'com.yourdomain.domus',
  appName: 'Domus Servitia'
}
```

## 📱 Deep Linking (Future Enhancement)

To enable deep links like `domus://property/123`:

1. Add to `capacitor.config.ts`:
```typescript
{
  plugins: {
    DeepLinks: {
      scheme: 'domus',
      hostname: 'domusservitia.com'
    }
  }
}
```

2. Install plugin:
```bash
npm install @capacitor/app
```

## 🐛 Troubleshooting

### iOS Build Issues
- Make sure Xcode is up to date
- Run `npx cap sync ios` after any dependency changes
- Clean build folder in Xcode (Cmd + Shift + K)

### Android Build Issues
- Ensure Android Studio SDK is installed
- Run `npx cap sync android` after changes
- Invalidate caches in Android Studio

### Hot Reload Not Working
- Check `capacitor.config.ts` has correct server URL
- Ensure your device/emulator can reach the URL
- Try `npx cap sync` again

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Deployment Guide](https://capacitorjs.com/docs/ios)
- [Android Deployment Guide](https://capacitorjs.com/docs/android)
- [Lovable Mobile Development Blog](https://lovable.dev/blog)

## 🎯 Next Steps

1. **Test the mobile flow**: Navigate `/app` → `/onboarding` → `/login` → portals
2. **Add native plugins**: Push notifications, camera, biometrics
3. **Customize branding**: Update icons, splash screens, colors
4. **Deploy**: Submit to App Store and Google Play

## 💡 Tips

- Always run `npx cap sync` after npm installs
- Test on real devices before production
- Keep the web app and mobile app in sync
- Use feature detection for native-only features

## 🆘 Need Help?

- Check [Capacitor Forums](https://forum.ionicframework.com/c/capacitor)
- Review [Lovable Documentation](https://docs.lovable.dev)
- Contact support@lovable.dev

---

Built with ❤️ using Lovable and Capacitor
