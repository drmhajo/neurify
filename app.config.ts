// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// Bundle ID format: space.manus.<project_name_dots>.<timestamp>
// e.g., "my-app" created at 2024-01-15 10:30:45 -> "space.manus.my.app.t20240115103045"
// Bundle ID can only contain letters, numbers, and dots
// Android requires each dot-separated segment to start with a letter
const rawBundleId = "com.app.ksmcneurosurgery";
const bundleId =
  rawBundleId
    .replace(/[-_]/g, ".") // Replace hyphens/underscores with dots
    .replace(/[^a-zA-Z0-9.]/g, "") // Remove invalid chars
    .replace(/\.+/g, ".") // Collapse consecutive dots
    .replace(/^\.+|\.+$/g, "") // Trim leading/trailing dots
    .toLowerCase()
    .split(".")
    .map((segment) => {
      // Android requires each segment to start with a letter
      // Prefix with 'x' if segment starts with a digit
      return /^[a-zA-Z]/.test(segment) ? segment : "x" + segment;
    })
    .join(".") || "space.manus.app";
// Extract timestamp from bundle ID and prefix with "manus" for deep link scheme
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const supabaseProjectUrl = process.env.SUPABASE_URL
  ?.trim()
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");
const centralRegistrationUrl = supabaseProjectUrl
  ? `${supabaseProjectUrl}/functions/v1/central-registration`
  : "";

const env = {
  // App branding - update these values directly (do not use env vars)
  appName: "Neurify",
  appSlug: "ksmc-neurosurgery",
  // Stable CDN location of the approved light, safe-area Neurify launcher icon.
  logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663029677493/IbIfxQJZJkslXVmk.png",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.44",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "light",
  newArchEnabled: true,
  extra: {
    centralRegistration: {
      url: centralRegistrationUrl,
      anonKey: process.env.SUPABASE_ANON_KEY?.trim() ?? "",
      centralDataEnabled: true,
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#F8F8FC",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    versionCode: 45,
    softwareKeyboardLayoutMode: "resize",
    googleServicesFile: "./google-services.json",
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-font",
      {
        fonts: ["./assets/fonts/MaterialIcons.ttf", "./assets/fonts/MaterialCommunityIcons.ttf", "./assets/fonts/Cairo-Regular.ttf", "./assets/fonts/Cairo-SemiBold.ttf", "./assets/fonts/Cairo-Bold.ttf"],
      },
    ],
    "expo-web-browser",
    [
      "expo-audio",
      {
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-notifications",
      {
        "defaultChannel": "department-alerts",
        "color": "#4956A6",
        "enableBackgroundRemoteNotifications": true
      }
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#F8F8FC",
        dark: {
          backgroundColor: "#F8F8FC",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
    "./plugins/with-gradle-constraints.js",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
