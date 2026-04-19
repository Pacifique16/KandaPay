# KandaPay — Smart USSD Management System

A React Native app that simplifies mobile money operations for MTN and Airtel users in Rwanda.

## Features
- Send money (MTN MoMo & Airtel Money)
- Buy airtime
- Check balance
- Pay bills
- Auto-detects SIM operator
- Dual-SIM support

## Requirements
- Android 8.0+ (API 26)
- Active MTN or Airtel SIM
- Node.js 18+

## Setup

```bash
npm install
npx expo run:android
```

## Project Structure
```
KandaPay/
├── android/              # Native Android code
│   └── app/src/main/java/com/kandapay/ussd/
│       ├── UssdModule.java     # Core USSD dialing
│       └── UssdPackage.java    # Module registration
├── src/
│   ├── constants/
│   │   └── ussdCodes.ts        # USSD templates for MTN & Airtel
│   ├── modules/ussd/
│   │   └── UssdBridge.ts       # JS <-> Native bridge
│   ├── services/
│   │   └── ussdService.ts      # High-level transaction service
│   ├── screens/                # App screens
│   ├── navigation/             # React Navigation setup
│   ├── store/                  # Redux state management
│   └── utils/                  # Helpers
├── App.tsx
└── app.json
```

## How USSD dialing works
1. User taps action (e.g. "Send Money")
2. App builds USSD string from template: `*182*1*1*{phone}*{amount}#`
3. Native module calls `TelephonyManager.sendUssdRequest()`
4. USSD response is returned and displayed

## Permissions needed
- `CALL_PHONE` — to dial USSD codes
- `READ_PHONE_STATE` — to detect SIM operator
