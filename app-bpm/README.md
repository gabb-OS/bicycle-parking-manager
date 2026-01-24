# Mobile Application - Bicycle Parking Manager (BPM)

This folder contains the Android mobile application for the **Bicycle Parking Manager** project. The app is designed to provide users with a seamless interface to manage their bike parking events, locate available areas, and benefit from automatic activity detection.

## Prerequisites

Before running the application, ensure you have:
* **Android Studio** (latest version recommended)
* **Android Emulator** (configured via AVD Manager)
* **Backend services** (Flask API and PostgreSQL) running via Docker.

---

## Development & Networking

### Emulator Connectivity
When running the app on the **Android Studio Emulator**, you must use the special IP address `10.0.2.2` to communicate with the backend. 

In the Android environment, `10.0.2.2` is a special alias to your host loopback interface (`127.0.0.1` on your development machine). The mobile app uses this address to reach the services running in the Docker network instead of `localhost`.

---

## Authentication System

BPM uses **Google Firebase** for secure user authentication and management.

### Implementation Logic
The authentication flow follows a hybrid approach to ensure data consistency between Firebase and our local PostgreSQL database:

1.  **User Creation:**
    * When a new user signs up in the app, Firebase Authentication creates a unique instance and generates an **Authentication Token**.
    * Once the token is obtained, the app sends a registration request to our backend.
    * The backend links the Firebase identity to our local database using the **email address** as the primary identifier.
2.  **Authenticated Requests:**
    * Every request to sensitive routes (e.g., fetching personal parking history, starting a parking event) must include the Firebase ID Token in the request header.
    * **Backend Guards:** Sensitive routes in the Flask API are protected by a Firebase "guard." This middleware verifies the token's existence and validity against Google's servers.
    * Access is granted only if the token is valid, ensuring that users can only interact with their own data.

### Missing Configuration Files
For security reasons, two essential configuration files are **excluded** from this repository (via `.gitignore`). You must manually add them to the project:

* **`app-bpm/app/google-services.json`**: This file is required by the Android app. It contains the Firebase project configuration (API keys, project IDs) necessary for the Firebase SDK to initialize.
* **`backend-bpm/flaskr/keys/firebase-private-key.json`**: This file is required by the Flask backend. It contains the Service Account private keys used by the Firebase Admin SDK to verify user tokens and communicate securely with Google services.

---

## Activity Detection & Testing

The app integrates the **Google Activity Recognition API** to detect transitions between different states (Walking, Biking).

### Testing Limitations
* **Emulator:** While most features are testable via the emulator, the **Google Activity Recognition API** does not support simulated transitions between **WALKING** and **BIKING** within the Android Studio environment.
* **Physical Device:** To validate the logic, the "Activity Transaction" functionality was tested on a physical Android device. 
    * *Note:* For testing purposes, the transition logic was verified using **STILL <-> WALKING** states. This allows for immediate verification of the architecture and state-change logic, which remains identical for the **WALKING <-> BIKING** transitions used in the final production logic.

---

## Usability & Background Behavior

To ensure a smooth user experience while maintaining simple permission management, please consider the following:

* **Foreground Execution:** The application is designed to work correctly **only when running in the foreground**. 
* **Background Activity:** The app **does not require nor request authorization for background activities**. To ensure parking events and activity tracking function as intended, the user should keep the app active and visible.

---

## References
* [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
* [Android Developers - Activity Recognition](https://developers.google.com/location-context/activity-recognition?hl=it)