/**
 * Base interface for app version information
 */
export interface AppVersion {
    /** The current version string (e.g., "1.0.0") */
    version: string;
    /** ISO date string of when this version was released */
    releaseDate: string;
    /** Optional release notes/changelog for this version */
    releaseNotes?: string;
    /** iOS bundle identifier (only present for App Store results) */
    bundleId?: string;
    /** Android package name (only present for Play Store results) */
    packageName?: string;
}

/**
 * Update check result interface
 */
export interface UpdateCheckResult {
    /** Whether an update is available */
    updateAvailable: boolean;
    /** Current version being checked */
    currentVersion: string;
    /** Latest version available in store */
    latestVersion: string;
    /** App details if update is available */
    updateDetails?: AppVersion;
    /** Version comparison result (-1: older, 0: same, 1: newer) */
    versionComparison: number;
}

/**
 * Detailed App Store response interface
 */
export interface AppStoreResponse {
    resultCount: number;
    results: AppStoreApp[];
}

/**
 * App Store app information
 */
export interface AppStoreApp {
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

/**
 * Play Store app information interface (for future implementation)
 */
export interface PlayStoreApp {
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

/**
 * Configuration options for the NodeMaw client
 */
export interface NodeMawConfig {
    /** Request timeout in milliseconds (default: 10000) */
    timeout?: number;
    /** Custom user agent string */
    userAgent?: string;
    /** Additional headers to send with requests */
    headers?: Record<string, string>;
    /** Enable retry logic for failed requests */
    retryEnabled?: boolean;
    /** Number of retry attempts (default: 3) */
    retryAttempts?: number;
}

/**
 * Error types that can be thrown by the client
 */
export class AppStoreError extends Error {
    constructor(
        message: string,
        public readonly bundleId: string,
        public readonly statusCode?: number
    ) {
        super(message);
        this.name = 'AppStoreError';
    }
}

export class PlayStoreError extends Error {
    constructor(
        message: string,
        public readonly packageName: string,
        public readonly statusCode?: number
    ) {
        super(message);
        this.name = 'PlayStoreError';
    }
}

/**
 * Network error for connection issues
 */
export class NetworkError extends Error {
    public readonly originalError?: Error;

    constructor(
        message: string,
        originalError?: Error
    ) {
        super(message);
        this.name = 'NetworkError';
        this.originalError = originalError;
    }
}

/**
 * Utility function to compare semantic versions
 * @param version1 - First version to compare
 * @param version2 - Second version to compare
 * @returns -1 if version1 < version2, 0 if equal, 1 if version1 > version2
 */
export function compareVersions(version1: string, version2: string): number {
    // Handle special cases
    if (version1 === version2) return 0;
    if (version1 === 'Unknown' || version1 === 'VARY') return -1;
    if (version2 === 'Unknown' || version2 === 'VARY') return 1;

    // Clean versions (remove non-numeric chars except dots)
    const cleanVersion1 = version1.replace(/[^0-9.]/g, '');
    const cleanVersion2 = version2.replace(/[^0-9.]/g, '');

    const parts1 = cleanVersion1.split('.').map(Number);
    const parts2 = cleanVersion2.split('.').map(Number);

    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;

        if (part1 < part2) return -1;
        if (part1 > part2) return 1;
    }

    return 0;
}