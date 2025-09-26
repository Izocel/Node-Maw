import { AppStoreClient, AppStoreConfig } from './app-store-client.js';
import { PlayStoreClient, PlayStoreConfig } from './play-store-client.js';
import {
    AppVersion,
    AppStoreResponse,
    NodeMawConfig,
    AppStoreError,
    PlayStoreError,
    NetworkError,
    UpdateCheckResult
} from './types.js';

// Re-export types for consumers
export type {
    AppVersion,
    AppStoreResponse,
    AppStoreApp,
    PlayStoreApp,
    NodeMawConfig,
    UpdateCheckResult
} from './types.js';

// Re-export client types
export type { AppStoreConfig } from './app-store-client.js';
export type { PlayStoreConfig } from './play-store-client.js';

// Re-export clients
export { AppStoreClient } from './app-store-client.js';
export { PlayStoreClient } from './play-store-client.js';

export { AppStoreError, PlayStoreError, NetworkError } from './types.js';

/**
 * Unified client configuration that combines both store configs
 */
export interface UnifiedNodeMawConfig extends NodeMawConfig {
    /** App Store specific configuration */
    appStore?: Partial<AppStoreConfig>;
    /** Play Store specific configuration */
    playStore?: Partial<PlayStoreConfig>;
}

/**
 * Unified client that provides access to both App Store and Play Store functionality
 * This class wraps the individual store clients and provides the original API for backward compatibility
 */
export class NodeMaw {
    private appStoreClient: AppStoreClient;
    private playStoreClient: PlayStoreClient;
    private config: Required<NodeMawConfig>;

    constructor(config: UnifiedNodeMawConfig = {}) {
        this.config = {
            timeout: config.timeout ?? 10000,
            userAgent: config.userAgent ?? 'node-maw/1.0.0',
            headers: config.headers ?? {},
            retryEnabled: config.retryEnabled ?? true,
            retryAttempts: config.retryAttempts ?? 3
        };

        // Create App Store client with merged config
        const appStoreConfig: AppStoreConfig = {
            ...this.config,
            userAgent: this.config.userAgent.replace('node-maw', 'node-maw-appstore'),
            ...config.appStore
        };
        this.appStoreClient = new AppStoreClient(appStoreConfig);

        // Create Play Store client with merged config
        const playStoreConfig: PlayStoreConfig = {
            ...this.config,
            userAgent: this.config.userAgent.replace('node-maw', 'node-maw-playstore'),
            ...config.playStore
        };
        this.playStoreClient = new PlayStoreClient(playStoreConfig);
    }

    /**
     * Fetch app version from Apple App Store
     * @param bundleId - iOS app bundle identifier (e.g., 'com.example.app')
     * @returns Promise<AppVersion> - App version information
     * @throws {AppStoreError} When app is not found or API request fails
     * @throws {NetworkError} When network request fails
     */
    async getAppStoreVersion(bundleId: string): Promise<AppVersion> {
        return this.appStoreClient.getVersion(bundleId);
    }

    /**
     * Fetch app version from Google Play Store
     * @param packageName - Android app package name (e.g., 'com.example.app')
     * @returns Promise<AppVersion> - App version information
     * @throws {PlayStoreError} When app is not found or API request fails
     * @throws {NetworkError} When network request fails
     */
    async getPlayStoreVersion(packageName: string): Promise<AppVersion> {
        return this.playStoreClient.getVersion(packageName);
    }

    /**
     * Check for updates on the App Store by comparing current version with latest version
     * @param bundleId - iOS app bundle identifier
     * @param currentVersion - Current version of the app to compare against
     * @returns Promise<UpdateCheckResult> - Update check result with details
     * @throws {AppStoreError} When app is not found or API request fails
     * @throws {NetworkError} When network request fails
     */
    async checkAppStoreForUpdates(bundleId: string, currentVersion: string): Promise<UpdateCheckResult> {
        return this.appStoreClient.checkForUpdates(bundleId, currentVersion);
    }

    /**
     * Check for updates on the Play Store by comparing current version with latest version
     * @param packageName - Android app package name
     * @param currentVersion - Current version of the app to compare against
     * @returns Promise<UpdateCheckResult> - Update check result with details
     * @throws {PlayStoreError} When app is not found or API request fails
     * @throws {NetworkError} When network request fails
     */
    async checkPlayStoreForUpdates(packageName: string, currentVersion: string): Promise<UpdateCheckResult> {
        return this.playStoreClient.checkForUpdates(packageName, currentVersion);
    }

    /**
     * Get the App Store client instance
     * @returns AppStoreClient - Direct access to App Store functionality
     */
    get appStore(): AppStoreClient {
        return this.appStoreClient;
    }

    /**
     * Get the Play Store client instance
     * @returns PlayStoreClient - Direct access to Play Store functionality
     */
    get playStore(): PlayStoreClient {
        return this.playStoreClient;
    }

    /**
     * Get the current configuration
     */
    getConfig(): Readonly<Required<NodeMawConfig>> {
        return { ...this.config };
    }

    /**
     * Update the client configuration
     * @param newConfig - Partial configuration to merge with existing config
     */
    updateConfig(newConfig: Partial<UnifiedNodeMawConfig>): void {
        this.config = {
            ...this.config,
            ...newConfig
        };

        // Update individual client configs
        if (newConfig.appStore || Object.keys(newConfig).some(key => !['appStore', 'playStore'].includes(key))) {
            const appStoreConfig: Partial<AppStoreConfig> = {
                ...this.config,
                ...newConfig.appStore
            };
            this.appStoreClient.updateConfig(appStoreConfig);
        }

        if (newConfig.playStore || Object.keys(newConfig).some(key => !['appStore', 'playStore'].includes(key))) {
            const playStoreConfig: Partial<PlayStoreConfig> = {
                ...this.config,
                ...newConfig.playStore
            };
            this.playStoreClient.updateConfig(playStoreConfig);
        }
    }
}

// Export default instance for convenience
export default new NodeMaw();

// Export default instances of individual clients for convenience
export const AppStore = new AppStoreClient();
export const PlayStore = new PlayStoreClient();