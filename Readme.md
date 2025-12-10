# SafeRoute SOS – Smart Personal Safety & Geo-Fence App

SafeRoute SOS is an Expo React Native app that helps vulnerable users trigger **smart SOS alerts** with:

- 📍 **Live location tracking**
- 🛡️ **Geo-fence safe zones**
- 📵 **Offline SMS fallback**

Built for **[Hackathon Name]**, focused on **women’s safety / vulnerable users** in real-world situations.

---

## ✨ Highlights

- Big, friendly **one-tap SOS** experience  
- **Risk-scored alerts** so responders can prioritize  
- **Geo-fence auto-SOS** when leaving a safe zone  
- **Works even with poor internet** via SMS fallback  
- Clean, modular code with a **services layer** and Firebase backend

---

## 🚨 Core Features (MVP)

### 1. Big SOS Button (Online)

- One tap sends an SOS alert to Firebase Firestore.
- Includes:
  - Live **GPS coordinates** (lat, lng, accuracy)
  - Basic **device & method info**
- Stored in `sosRequests` collection for responders/admins.

---

### 2. Smart Risk Scoring (AI-ish)

Every SOS event is enriched with basic “intelligence”:

- `riskScore` → number from **0–100**
- `riskLevel` → `LOW` / `MEDIUM` / `HIGH`
- `aiSummary` → short text explaining the context

Risk is computed using:

- **Trigger method**: `button`, `geofence`, (later: `shake`, `voice`, etc.)
- **Time of day**: night hours = higher risk
- **GPS quality**: poor accuracy = higher risk (more uncertain situation)

This allows future dashboards to **prioritize high-risk SOS** instead of treating all alerts equally.

---

### 3. Live Map View

- Map screen built with `react-native-maps`
- Shows the user’s **current GPS location** on a map
- Great for demo: “This is where the person is right now.”

---

### 4. Geo-Fence Safe Zone

- User can mark their **current location** as a **safe zone** and start a “trip.”
- The app:
  - Stores that point as `safeZoneCenter`
  - Defines a radius (e.g. `200m`)
  - Watches GPS updates while the trip is “active”
- If user moves **outside the radius** → automatic SOS:
  - `method: "geofence"`
  - Includes location, riskScore, riskLevel, aiSummary

This simulates real-world scenarios like:

> “If I leave college or home unexpectedly, auto-alert my family.”

---

### 5. Offline / Low-Network SMS SOS

When the internet is weak or unavailable:

- User can tap **“SOS via SMS (Offline Fallback)”**
- App:
  - Gets current GPS coordinates
  - Opens the phone’s SMS app with:
    - Pre-filled message: “SOS, I am in danger…”
    - **Google Maps link**:  
      `https://www.google.com/maps?q=<lat>,<lng>`

This ensures the user can **still send location-based SOS** using just SMS.

---

## 🧠 Tech Stack

**Frontend**

- React Native (Expo, TypeScript)
- `@react-navigation/native`, `@react-navigation/native-stack`
- `react-native-maps`
- `expo-location`
- `expo-sms`

**Backend**

- **Firebase**
  - Firestore (stores SOS events and metadata)
  - (Future) Auth, Storage, Cloud Functions

---

## 🏗️ High-Level Architecture

```text
Mobile App (Expo React Native)
       ⬇
Services Layer (src/services/)
  • location.ts  → getCurrentLocation(), watchPosition()
  • sos.ts       → triggerSos(), risk scoring, Firestore writes
  • sms.ts       → offline SMS composition with maps link
  • firebase.ts  → Firebase + Firestore initialization
       ⬇
Firebase Firestore
  Collection: sosRequests
    - userId
    - createdAt
    - status (e.g. "ACTIVE")
    - method ("button" | "geofence" | ...)
    - location { lat, lng, accuracy }
    - riskScore (0–100)
    - riskLevel ("LOW" | "MEDIUM" | "HIGH")
    - aiSummary (short context string)
````

### How to Explain It (For Judges)

> “We built an Expo React Native app with a services layer and Firebase backend.
> On the frontend, the user interacts with three main flows: manual SOS, geo-fence safe trips, and SMS fallback.
> All SOS events go through a central `triggerSos` function which does a lightweight risk analysis – we compute a risk score based on trigger type, time of day, and GPS quality, and store that in Firestore.
> This way, responders or family members can quickly prioritize high-risk alerts.”

---

## 📱 App Flow (User Journey)

1. **Login / Entry**

   * User opens the app and sees a simple entry screen.
   * Taps “Continue” → navigates to Home.

2. **Home – SOS Dashboard**

   * Big red **SOS button**
   * Button to **view current location on map**
   * Button to **start geo-fence safe trip**
   * Button for **SOS via SMS (offline fallback)**

3. **Emergency Flows**

   **a) Manual SOS (Online)**

   * User taps **Big Red SOS**
   * App:

     * Requests location
     * Calls `triggerSos("button", coords)`
     * Computes risk score and summary
     * Writes record to Firestore (`sosRequests`)

   **b) Geo-Fence Safe Trip**

   * User goes to **GeoFence screen**
   * Taps “Set Safe Zone & Start Trip”
   * App:

     * Saves current location as `safeZoneCenter`
     * Starts watching GPS updates
     * If outside radius (e.g. 200m) → `triggerSos("geofence", coords)`

   **c) Live Map View**

   * User navigates to **Map screen**
   * Sees their current position with a marker using `react-native-maps`

   **d) SOS via SMS (Offline Fallback)**

   * User taps **SOS via SMS**
   * App:

     * Gets location
     * Opens SMS app with message:

       * “SOS, I am in danger…”
       * `https://www.google.com/maps?q=lat,lng`

---

## 🗂️ Project Structure

```text
src/
  components/
    SosButton.tsx        # Big RED SOS button + triggers + SMS fallback
  navigation/
    RootNavigator.tsx    # Navigation between screens
  screens/
    LoginScreen.tsx      # Simple entry/login screen
    HomeScreen.tsx       # Main SOS dashboard
    MapScreen.tsx        # Shows current location on map
    GeoFenceScreen.tsx   # Safe zone + auto SOS on exit
  services/
    firebase.ts          # Firebase init + Firestore instance
    location.ts          # Location helpers (getCurrentLocation, watch)
    sos.ts               # triggerSos, risk scoring, Firestore writes
    sms.ts               # SMS fallback with Google Maps link
App.tsx                  # App root: wraps RootNavigator, providers, etc.
```

---

## 🔧 Setup & Run Locally

### 1. Clone & Install

```bash
# Clone the repo
git clone https://github.com/<your-username>/saferoute-sos.git
cd saferoute-sos

# Install dependencies
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at the Firebase Console.
2. Enable **Firestore**.
3. Get your web config (apiKey, authDomain, projectId, etc.).
4. Update `src/services/firebase.ts` with your config.

> You can use environment variables or hardcoded config for hackathon demo.

### 3. Install Expo & Native Modules

```bash
npx expo install \
  expo-location \
  expo-sms \
  react-native-maps \
  react-native-gesture-handler \
  react-native-reanimated \
  react-native-screens \
  react-native-safe-area-context
```

### 4. Run the App

```bash
npx expo start
```

* Open in **Expo Go** on a real device (recommended for GPS & SMS).
* Or run on an emulator (location simulation possible).

---

## 🧮 Risk Scoring Logic (Simple Version)

Inside `src/services/sos.ts` (conceptually):

1. **Base score** based on method:

   * `button` → medium base risk
   * `geofence` → slightly higher (unexpected movement)
   * (future: `shake` / `voice` → can be even higher)

2. **Time of day**:

   * Night hours (e.g. 9pm–6am) → add extra risk

3. **GPS accuracy**:

   * Poor accuracy (big radius) → add uncertainty → higher risk

4. **Map to level**:

   * 0–30 → `LOW`
   * 31–70 → `MEDIUM`
   * 71–100 → `HIGH`

5. Generate a simple `aiSummary`, such as:

> “High-risk SOS via geo-fence at night with moderate GPS accuracy.”

This is intentionally simple but **feels intelligent** and is easy to extend later.

---

## 🧪 Demo Script (For Hackathon)

Use this outline during your demo:

1. **Intro (10–20 sec)**

   > “Hi, we built SafeRoute SOS, a smart personal safety app that helps vulnerable users trigger an intelligent SOS, even in low-network situations.”

2. **Flow 1 – Manual SOS (Online)**

   * Show **Home screen**
   * Tap **Big Red SOS**
   * Explain:

     > “This sends an SOS to Firebase with live GPS, a computed risk score, and a short context summary.”
   * Quickly show the `sosRequests` document in Firestore.

3. **Flow 2 – Live Map**

   * Open **Map screen**
   * Show your marker
   * Explain:

     > “Responders or family can see exactly where the user is.”

4. **Flow 3 – Geo-Fence Safe Trip**

   * Open **GeoFence screen**, tap “Set Safe Zone & Start Trip”
   * Explain the concept (you don’t have to walk):

     > “Before leaving home/college, the user sets this as a safe zone. If they move outside this radius, the app automatically triggers a geo-fence SOS.”

5. **Flow 4 – Offline SMS**

   * Tap **SOS via SMS**
   * Show SMS app with:

     * Pre-filled text
     * Google Maps link
   * Explain:

     > “Even with poor internet, the user can still send an SOS with location using SMS.”

6. **Wrap Up / Why It’s Smart**

   > “Every SOS event is scored with a risk level, so in the future we can show family or police a prioritized queue of alerts instead of random messages.
   > The design is modular, Firebase-based, and ready to extend with shake detection, voice triggers, and a web dashboard.”

---

## 👥 Team Roles (Suggested)

If you’re working as a team, you can divide tasks like this:

* **You – Lead / Architect**

  * Explain architecture & codebase
  * Integrations, final debugging
  * Drive live demo

* **Teammate 1 – UI & UX**

  * Polish Home screen (cards, colors, icons)
  * Add SOS history list from `sosRequests`
  * Improve wording / multilingual labels

* **Teammate 2 – Features & Settings**

  * Simple user profile (local or Firebase Auth)
  * Settings screen for emergency SMS contacts
  * Show `riskLevel` chips in SOS history

* **Teammate 3 – Presentation**

  * Final PPT (problem → solution → architecture → demo)
  * Architecture & user flow diagrams
  * Assist during live demo

---

## 🚀 Future Enhancements

* ✅ Real user auth with **Firebase Authentication**
* ✅ Trusted contacts (family, friends, community)
* ✅ **Danger heatmap** from SOS history (city safety layer)
* ✅ Shake & voice triggers (accelerometer + speech)
* ✅ Cloud evidence locker (audio/video in Firebase Storage)
* ✅ Web / admin dashboard for monitoring active SOS and risk levels

---

## 📄 License

Add your preferred license here (MIT, Apache-2.0, etc.).

---


