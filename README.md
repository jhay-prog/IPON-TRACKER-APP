# Ipon: Personal Savings Tracker (React Native + Expo)

Tracks virtual savings only. It never holds or moves real money.

## Run it
```bash
npm install
npx expo install --fix      # aligns package versions with your Expo SDK
npx expo start              # scan the QR code with Expo Go (iOS or Android)
```
Needs Node 18+. Secure storage works in Expo Go on a real phone. Saving reminders require the standalone app build; they are unavailable in Expo Go.

## Build an Android APK
The APK build uses Expo Application Services (EAS Build). Sign in, then run the build from this project folder:
```bash
npm install
npx eas-cli login
npm run build:android:apk
```
When the cloud build finishes, open the build link EAS prints, download the APK to your Android phone, and open it to install. Android may ask you to allow installation from that source. The first build may also ask EAS to create an Android signing key; allow it to manage the key unless you already have one.

## What is inside
- `App.js`: auth gate (setup, lock, unlocked), theme, tabs and stack navigation
- `src/security.js`: salted, iterated SHA-256 password hash kept in the device keychain; one-time recovery code
- `src/store.js`: AsyncStorage persistence; every add, edit and delete is checked against the ledger
- `src/calc.js`: balances, goal maths, streaks and chart data
- `src/charts.js`: bar, donut, column and line charts (react-native-svg)
- `src/screens/`: Auth, Home, TxForm (Save and Withdraw), Savings (list, detail, goal form, archive), Transactions, Analytics, Extras (calendar, challenges, reminders), Settings

## Behaviour notes
- Amount is typed by the user. Date and time are stamped automatically on confirm.
- Withdrawals above the account balance are blocked. Edits and deletes that would make any balance negative are refused.
- Forgot password: use the recovery code shown once at setup (savings stay hidden), or erase all data.
- Backups and CSV exports are plain files. Keep them private.
- Not included: transfers between accounts, goal images (colour icons instead), date picker (dates are typed as YYYY-MM-DD), automatic lock when the app goes to the background.
