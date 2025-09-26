# Node-MAW

[![CI](https://github.com/yourusername/node-maw/workflows/CI/badge.svg)](https://github.com/yourusername/node-maw/actions)
[![npm version](https://badge.fury.io/js/node-maw.svg)](https://www.npmjs.com/package/node-maw)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A TypeScript client for fetching mobile app versions from App Store and Play Store with separated client architecture.

## Features

- ✅ TypeScript support with full type safety
- 🔄 Fetch app versions from Apple App Store
- 🤖 Fetch app versions from Google Play Store
- 🏗️ **Separated client architecture for better modularity**
- 🔍 Search functionality for both stores
- 📦 ESM module support
- 🚀 Promise-based API using Axios
- 📋 Comprehensive error handling
- 🌍 Multi-country/region support
- ⚙️ Configurable retry mechanisms
- 🆙 **Update checking with version comparison**

## Installation

```bash
npm install node-maw
```

## Usage

### Unified Client (Recommended)

```typescript
import { NodeMaw } from "node-maw";

const client = new NodeMaw();

// Fetch App Store version
const appStoreVersion = await client.getAppStoreVersion("com.example.app");
console.log(appStoreVersion);

// Fetch Play Store version
const playStoreVersion = await client.getPlayStoreVersion("com.example.app");
console.log(playStoreVersion);

// Access individual clients for advanced features
const appExists = await client.appStore.exists("com.example.app");
const appDetails = await client.playStore.getFullDetails("com.example.app");

// Check for updates (NEW!)
const appStoreUpdate = await client.checkAppStoreForUpdates(
  "com.example.app",
  "1.0.0"
);
const playStoreUpdate = await client.checkPlayStoreForUpdates(
  "com.example.app",
  "1.0.0"
);

if (appStoreUpdate.updateAvailable) {
  console.log(`📱 App Store update available: ${appStoreUpdate.latestVersion}`);
}
```

### Separate Clients

```typescript
import { AppStoreClient, PlayStoreClient } from "node-maw";

// App Store client with specific configuration
const appStoreClient = new AppStoreClient({
  country: "ca",
  includeMetadata: true,
});

// Play Store client with specific configuration
const playStoreClient = new PlayStoreClient({
  language: "es",
  country: "mx",
});

const appStoreVersion = await appStoreClient.getVersion("com.example.app");
const playStoreVersion = await playStoreClient.getVersion("com.example.app");
```

### Default Instances

```typescript
import nodeMaw, { appStore, playStore } from "node-maw";

// Using default unified client
const version1 = await nodeMaw.getAppStoreVersion("com.example.app");

// Using default App Store client
const version2 = await appStore.getVersion("com.example.app");

// Using default Play Store client
const version3 = await playStore.getVersion("com.example.app");
```

## API Reference

### NodeMaw (Unified Client)

The main client that provides access to both stores and maintains backward compatibility.

#### Constructor

```typescript
new NodeMaw(config?: UnifiedNodeMawConfig)
```

#### Methods

- `getAppStoreVersion(bundleId: string): Promise<AppVersion>` - Fetch iOS app version
- `getPlayStoreVersion(packageName: string): Promise<AppVersion>` - Fetch Android app version
- `checkAppStoreForUpdates(bundleId: string, currentVersion: string): Promise<UpdateCheckResult>` - Check for iOS app updates
- `checkPlayStoreForUpdates(packageName: string, currentVersion: string): Promise<UpdateCheckResult>` - Check for Android app updates
- `appStore: AppStoreClient` - Direct access to App Store client
- `playStore: PlayStoreClient` - Direct access to Play Store client

### AppStoreClient

Specialized client for Apple App Store with advanced features.

#### Methods

- `getVersion(bundleId: string): Promise<AppVersion>` - Fetch app version
- `search(term: string, limit?: number): Promise<AppVersion[]>` - Search for apps
- `exists(bundleId: string): Promise<boolean>` - Check if app exists
- `checkForUpdates(bundleId: string, currentVersion: string): Promise<UpdateCheckResult>` - Check for updates
- `updateConfig(config: Partial<AppStoreConfig>): void` - Update configuration

#### Configuration

```typescript
interface AppStoreConfig {
  timeout?: number; // Request timeout (default: 10000ms)
  userAgent?: string; // Custom user agent
  headers?: Record<string, string>; // Additional headers
  retryEnabled?: boolean; // Enable retries (default: true)
  retryAttempts?: number; // Retry attempts (default: 3)
  country?: string; // App Store region (default: 'us')
  includeMetadata?: boolean; // Include additional metadata (default: false)
}
```

### PlayStoreClient

Specialized client for Google Play Store with advanced features.

#### Methods

- `getVersion(packageName: string): Promise<AppVersion>` - Fetch app version
- `search(term: string, options?: SearchOptions): Promise<AppVersion[]>` - Search for apps
- `getFullDetails(packageName: string): Promise<any>` - Get complete app details
- `exists(packageName: string): Promise<boolean>` - Check if app exists
- `checkForUpdates(packageName: string, currentVersion: string): Promise<UpdateCheckResult>` - Check for updates
- `updateConfig(config: Partial<PlayStoreConfig>): void` - Update configuration

#### Configuration

```typescript
interface PlayStoreConfig {
  timeout?: number; // Request timeout (default: 10000ms)
  userAgent?: string; // Custom user agent
  headers?: Record<string, string>; // Additional headers
  retryEnabled?: boolean; // Enable retries (default: true)
  retryAttempts?: number; // Retry attempts (default: 3)
  language?: string; // Play Store language (default: 'en')
  country?: string; // Play Store region (default: 'us')
  includeMetadata?: boolean; // Include additional metadata (default: false)
}
```

## Advanced Usage

### Update Checking (NEW!)

Check if an app has updates available by comparing the current version with the latest version from the store:

```typescript
import { NodeMaw } from "node-maw";

const client = new NodeMaw();

// Check App Store for updates
const appStoreUpdate = await client.checkAppStoreForUpdates(
  "net.whatsapp.WhatsApp",
  "2.20.0"
);

console.log(`Update available: ${appStoreUpdate.updateAvailable}`);
console.log(`Current version: ${appStoreUpdate.currentVersion}`);
console.log(`Latest version: ${appStoreUpdate.latestVersion}`);

if (appStoreUpdate.updateAvailable) {
  console.log("Update details:", appStoreUpdate.updateDetails);
}

// Check Play Store for updates
const playStoreUpdate = await client.checkPlayStoreForUpdates(
  "com.whatsapp",
  "2.20.0"
);

// Use direct client access for more control
const directCheck = await client.appStore.checkForUpdates(
  "com.example.app",
  "1.0.0"
);
```

The `UpdateCheckResult` interface provides:

- `updateAvailable`: Boolean indicating if update is available
- `currentVersion`: The version you're checking against
- `latestVersion`: The latest version available in the store
- `versionComparison`: Numeric comparison result (negative = older, 0 = same, positive = newer)
- `updateDetails`: Full app details if an update is available (undefined otherwise)

### Different Store Regions

```typescript
// App Store in different countries
const canadaClient = new AppStoreClient({ country: "ca" });
const ukClient = new AppStoreClient({ country: "gb" });

// Play Store in different languages/countries
const spanishClient = new PlayStoreClient({
  language: "es",
  country: "mx",
});
```

### Search Functionality

```typescript
// Search App Store
const appStoreResults = await client.appStore.search("calculator", 10);

// Search Play Store with options
const playStoreResults = await client.playStore.search("calculator", {
  num: 10,
  fullDetail: true,
});
```

### Configuration Management

```typescript
const client = new NodeMaw({
  timeout: 15000,
  appStore: {
    country: "ca",
    includeMetadata: true,
  },
  playStore: {
    language: "fr",
    country: "ca",
    retryAttempts: 5,
  },
});

// Update configuration later
client.updateConfig({
  timeout: 20000,
  appStore: { country: "us" },
});
```

## Types

```typescript
interface AppVersion {
  version: string; // App version (e.g., "1.0.0")
  releaseDate: string; // ISO date string
  releaseNotes?: string; // Optional release notes
  bundleId?: string; // iOS bundle ID (App Store only)
  packageName?: string; // Android package name (Play Store only)
}

interface UpdateCheckResult {
  updateAvailable: boolean; // Whether an update is available
  currentVersion: string; // The version being checked
  latestVersion: string; // Latest version available in store
  versionComparison: number; // -1: older, 0: same, 1: newer
  updateDetails?: AppVersion; // Full app details if update available
}
```

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.0.0 (for development)

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run all tests
npm test

# Run specific test suites
npm run test:core        # Core NodeMaw functionality & unified client
npm run test:app-store   # iOS App Store client tests
npm run test:play-store  # Google Play Store client tests

# Run tests in watch mode
npm run test:watch

# Run in development mode
npm run dev

# Type checking
npm run type-check

# Clean build artifacts
npm run clean
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
