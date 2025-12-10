### 14.1 – `README.md` Content

````md
# GuardianSOS 👁️‍🗨️🚨  
Smart Personal Safety with Live Location, Geo-Fence Alerts & Offline SOS

## 1. Problem

In emergencies, people often:

- Can’t unlock their phone, open an app, and type messages.
- Don’t know their exact location to share.
- Have poor internet connectivity.
- Have no central record of incidents to refer back to.

This leads to **delayed help** and **unsafe outcomes**.

---

## 2. Solution – GuardianSOS

GuardianSOS is a mobile safety companion that lets you:

- Trigger SOS via **one-tap button** (and extendable to shake/voice).
- Attach **live GPS location** & risk score to every alert.
- Get **geo-fence based auto-SOS** when you leave a safe zone.
- Fall back to **SMS with Google Maps link** when internet is weak.
- Maintain a **personal safety history** per user.

The app is designed to be simple enough for anyone to use in panic, but smart enough to assist responders.

---

## 3. Core Features

### ✅ Authentication & Profiles
- Email/password login & signup (Firebase Auth).
- Per-user **profile** stored in Firestore:
  - Full name
  - Primary emergency contact
  - Secondary contact

### ✅ SOS Triggers
- **Big SOS button** on Home:
  - Grabs current GPS location.
  - Stores alert in Firestore as `sosRequests`.
  - Tags each alert with:
    - `userId`
    - `status`
    - `method` (button / geofence / future: shake/voice)
    - `location` (lat, lng, accuracy)
    - `riskScore` (0–100)
    - `riskLevel` (LOW / MEDIUM / HIGH)
    - `aiSummary` (human-readable risk explanation)

### ✅ Smart Risk Scoring (AI-ish Logic)
- Lightweight scoring based on:
  - Trigger method (button / geofence / shake / voice).
  - Time of day (night vs evening vs day).
  - GPS accuracy.
- Generates an **“AI summary”** like:
  > Risk Level: HIGH (Score: 78/100). Voice-triggered SOS. Triggered during night hours. High GPS accuracy for responders.

### ✅ Geo-Fence Safe Trip
- User selects current location as **safe zone**.
- App tracks movement (while screen is active).
- If user moves **outside radius** (e.g. 200m):
  - Auto-triggers SOS with `method: "geofence"`.
  - Shows alerts to the user.
- Good for: walking home, cab rides, late-night travel.

### ✅ Offline SMS Fallback
- Uses Expo SMS to open the device SMS app with:
  - Custom SOS message.
  - **Google Maps link**: `https://www.google.com/maps?q=lat,lng`
- Recipients are loaded from user’s **Profile** (Firestore).
- Works even when internet is weak (as long as SMS works).

### ✅ Live Map & History
- **Map screen**:
  - Shows user’s current location on a map with a marker.
- **History screen**:
  - Lists all SOS alerts for the logged-in user.
  - Sorted newest → oldest.
  - Shows method, risk level, timestamp, AI summary.

---

## 4. Tech Stack

- **Frontend:** React Native + Expo
- **Navigation:** React Navigation (native stack)
- **Backend:** Firebase
  - Authentication (Email/Password)
  - Firestore (profiles, sosRequests)
- **Device APIs:**
  - `expo-location` (GPS & geofencing logic)
  - `react-native-maps` (map UI)
  - `expo-sms` (SMS fallback)

---

## 5. Project Structure

```txt
sos-safety-app/
  App.tsx
  src/
    config/
      theme.ts
    context/
      AuthContext.tsx
    navigation/
      RootNavigator.tsx
    screens/
      LoginScreen.tsx
      HomeScreen.tsx
      MapScreen.tsx
      GeoFenceScreen.tsx
      ProfileScreen.tsx
      HistoryScreen.tsx
    components/
      SosButton.tsx
    services/
      firebase.ts
      location.ts
      sos.ts
      sms.ts
````

* `services/firebase.ts` – Firebase initialization (Auth + Firestore).
* `services/location.ts` – Permission + current GPS helpers.
* `services/sos.ts` – Central SOS logic + risk scoring + Firestore writes.
* `services/sms.ts` – Reads emergency contacts & opens SMS with link.
* `screens/` – UI pages.
* `AuthContext.tsx` – Watches auth state and routes login / app stack.

---

## 6. Setup Instructions (Dev)

1. Clone repo & install:

   ```bash
   npm install
   ```

2. Create a Firebase project and enable:

   * Authentication → Email/Password
   * Firestore Database

3. Copy your Firebase config to:

   ```ts
   // src/services/firebase.ts
   const firebaseConfig = { ... };
   ```

4. Install Expo dependencies:

   ```bash
   npx expo install react-native-screens react-native-safe-area-context
   npx expo install react-native-gesture-handler react-native-reanimated
   npx expo install expo-location react-native-maps expo-sms
   ```

5. Update `babel.config.js`:

   ```js
   module.exports = function (api) {
     api.cache(true);
     return {
       presets: ["babel-preset-expo"],
       plugins: ["react-native-reanimated/plugin"],
     };
   };
   ```

6. Run:

   ```bash
   npx expo start
   ```

---

## 7. How It Works (High-Level Architecture)

1. **User Authenticates**

   * Firebase Auth issues a user ID (`uid`).
   * `AuthContext` listens to auth state and controls navigation.

2. **Profile Setup**

   * User fills name + phone numbers in Profile screen.
   * Saved to Firestore: `profiles/{uid}`.

3. **Triggering SOS**

   * SOS button / geo-fence calls `triggerSos(method, coords)`.
   * `triggerSos`:

     * Computes `riskScore`, `riskLevel`, `aiSummary`.
     * Writes to `sosRequests` with `userId = uid`.

4. **Offline SMS**

   * Reads `profiles/{uid}`.
   * Builds SOS message + Maps link.
   * Uses device SMS to send to `primaryNumber` & `secondaryNumber`.

5. **History View**

   * Queries `sosRequests` where `userId == currentUser.uid`.
   * Streams updates in real time using `onSnapshot`.

---

## 8. Future Enhancements

* Shake-to-SOS using accelerometer.
* Always-on voice keyword (“help me”) SOS.
* Danger heatmap using aggregated SOS data.
* Trusted network: nearby volunteers + responders.
* Multi-language UI and messages.

```

---

### 14.2 – 60–90 Second Pitch Script (Say This to Judges)

You can literally memorize or adapt this:

> **“Hi, I’m \<your name\> and this is GuardianSOS, a smart personal safety app.**  
> 
> In real emergencies people don’t have time to unlock their phone, open WhatsApp and share live location. Internet might be weak, and they may not even know where they are.  
> 
> GuardianSOS solves this with **one-tap SOS**, **auto geo-fence alerts**, and an **offline SMS fallback**.  
> 
> When a user feels unsafe, they just tap the big SOS button. We capture their **live GPS**, compute a **risk score** based on method and time of day, and store an incident in Firestore with an AI-style summary.  
> 
> If they start a ‘Safe Trip’, we monitor their movement. If they leave their safe zone—like getting taken away from home or their usual route—we automatically trigger a geo-fence SOS.  
> 
> And if internet is weak, we switch to **SMS**: we open the phone’s SMS app with an emergency message and a **Google Maps link** to their exact location, sent to their trusted contacts from their profile.  
> 
> Every alert is saved to a **personal safety history**, so they or authorities can see what happened and when.  
> 
> Technically, we built this with **React Native + Expo**, **Firebase Auth + Firestore**, `expo-location`, `react-native-maps`, and `expo-sms`.  
> 
> Our vision is to turn this into a deployable safety companion for students, women, and elderly, with extensions like shake-to-SOS, voice triggers, and danger heatmaps.”  

---

### 14.3 – Live Demo Flow (Step-by-Step for Stage)

When demoing, do **this exact sequence**:

1. **Login / Signup**
   - Show quick signup.
   - “Every user has their own profile & contacts.”

2. **Profile Setup**
   - Open Profile.
   - Show name + two emergency contacts.
   - “These numbers receive SOS messages.”

3. **Home Overview**
   - Show the beautiful home screen.
   - Highlight sections: big SOS, quick actions, history.

4. **Online SOS**
   - Hit the big SOS button.
   - Show “SOS sent with location”.
   - Quickly switch to Firestore console → show new `sosRequests` doc:
     - `userId`, `location`, `riskScore`, `riskLevel`, `aiSummary`.

5. **Map View**
   - Open Map → show your live location.

6. **Geo-Fence**
   - Open GeoFence screen.
   - “Set safe zone & start trip”.
   - (If you can simulate movement, do it; if not, explain quickly.)

7. **SMS Fallback**
   - Tap “SOS via SMS” button.
   - Show SMS app opening with pre-filled message + Google Maps link.
   - Optional: teammate’s phone showing the SMS.

8. **History**
   - Open History screen.
   - Show list of SOS alerts with risk badges & summaries.

That’s a **killer demo**.

---

If you want, next we can:

- Tighten code in any file you’re unsure about
- Plan how to divide work between teammates (who does what)
- Or add **one more “sexy” feature** if you still have time (like shake-to-SOS or a mini “Danger score” banner on Home)

For now, if you create `README.md` with that content and practice the pitch + demo flow, you are **hackathon-ready**. 🚀
```
