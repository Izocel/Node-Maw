# TypeScript Declarations

Your npm package now includes comprehensive TypeScript declarations with full type safety.

## 📋 **Exported Types**

### Core Types

```typescript
// Main client class
class NodeMaw {
  constructor(config?: NodeMawConfig);
  getAppStoreVersion(bundleId: string): Promise<AppVersion>;
  getPlayStoreVersion(packageName: string): Promise<AppVersion>;
  getConfig(): Readonly<Required<NodeMawConfig>>;
  updateConfig(newConfig: Partial<NodeMawConfig>): void;
}

// Main result interface
interface AppVersion {
  version: string; // e.g., "1.0.0"
  releaseDate: string; // ISO date string
  releaseNotes?: string; // Optional changelog
  bundleId?: string; // iOS only
  packageName?: string; // Android only
}
```

### Configuration

```typescript
interface NodeMawConfig {
  timeout?: number; // Request timeout (default: 10000ms)
  userAgent?: string; // Custom user agent
  headers?: Record<string, string>; // Additional headers
  retryEnabled?: boolean; // Enable retries (default: true)
  retryAttempts?: number; // Retry count (default: 3)
}
```

### App Store Types

```typescript
interface AppStoreResponse {
  resultCount: number;
  results: AppStoreApp[];
}

interface AppStoreApp {
  bundleId: string;
  version: string;
  currentVersionReleaseDate: string;
  releaseNotes: string;
  trackName: string;
  artistName: string;
  trackId: number;
  trackViewUrl: string;
  fileSizeBytes: string;
  minimumOsVersion: string;
  genres: string[];
  averageUserRating: number;
  userRatingCount: number;
  price: number;
  currency: string;
  contentAdvisoryRating: string;
  screenshotUrls: string[];
  ipadScreenshotUrls: string[];
  appletvScreenshotUrls: string[];
}
```

### Play Store Types (Future)

```typescript
interface PlayStoreApp {
  packageName: string;
  version: string;
  versionCode: number;
  releaseDate: string;
  releaseNotes?: string;
  title: string;
  developer: string;
  category: string;
  rating: number;
  reviewCount: number;
  price: string;
  free: boolean;
  size: string;
  minAndroidVersion: string;
  screenshots: string[];
  icon: string;
}
```

### Error Types

```typescript
class AppStoreError extends Error {
  readonly bundleId: string;
  readonly statusCode?: number;
}

class PlayStoreError extends Error {
  readonly packageName: string;
  readonly statusCode?: number;
}

class NetworkError extends Error {
  readonly originalError?: Error;
}
```

## 🔧 **Usage Examples**

### Basic Usage

```typescript
import { NodeMaw, AppVersion } from "node-maw";

const client = new NodeMaw();

try {
  const version: AppVersion = await client.getAppStoreVersion(
    "com.apple.mobilesafari"
  );
  console.log(version.version); // TypeScript knows this is a string
} catch (error) {
  // Error types are properly typed too
}
```

### With Configuration

```typescript
import { NodeMaw, NodeMawConfig, AppStoreError } from "node-maw";

const config: NodeMawConfig = {
  timeout: 5000,
  userAgent: "MyApp/1.0.0",
  headers: { "X-Custom": "header" },
};

const client = new NodeMaw(config);

try {
  const version = await client.getAppStoreVersion("invalid.bundle.id");
} catch (error) {
  if (error instanceof AppStoreError) {
    console.log(`App not found: ${error.bundleId}`);
    console.log(`Status: ${error.statusCode}`);
  }
}
```

### Type Guards

```typescript
import { AppVersion, AppStoreError, NetworkError } from "node-maw";

async function getAppVersion(bundleId: string): Promise<AppVersion | null> {
  try {
    return await client.getAppStoreVersion(bundleId);
  } catch (error) {
    if (error instanceof AppStoreError) {
      console.error("App Store API error:", error.message);
    } else if (error instanceof NetworkError) {
      console.error("Network error:", error.message);
    }
    return null;
  }
}
```

## 📦 **Package Features**

✅ **Full Type Safety**: Every method and property is properly typed
✅ **IntelliSense Support**: Complete autocomplete in VS Code and other editors  
✅ **Error Type Safety**: Specific error types for different failure modes
✅ **JSDoc Comments**: Comprehensive documentation in types
✅ **Source Maps**: Debug support with .d.ts.map files
✅ **ESM Compatible**: Modern module system support

## 🎯 **Type Files Included**

- `dist/index.d.ts` - Main module declarations
- `dist/types.d.ts` - Detailed type definitions
- `dist/index.d.ts.map` - Source map for debugging
- `dist/types.d.ts.map` - Source map for types

Your package consumers will get full TypeScript support out of the box! 🚀
