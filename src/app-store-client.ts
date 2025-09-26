import axios, { AxiosInstance, AxiosError } from 'axios';
import {
    AppVersion,
    AppStoreResponse,
    NodeMawConfig,
    AppStoreError,
    NetworkError,
    UpdateCheckResult,
    compareVersions
} from './types.js';

/**
 * Configuration specific to App Store client
 */
export interface AppStoreConfig extends NodeMawConfig {
    /** App Store API country/region (default: 'us') */
    country?: string;
    /** Include additional app metadata in responses */
    includeMetadata?: boolean;
}

/**
 * Client for fetching app information from Apple App Store
 */
export class AppStoreClient {
    private client: AxiosInstance;
    private config: Required<AppStoreConfig>;

    constructor(config: AppStoreConfig = {}) {
        this.config = {
            timeout: config.timeout ?? 10000,
            userAgent: config.userAgent ?? 'node-maw-appstore/1.0.0',
            headers: config.headers ?? {},
            retryEnabled: config.retryEnabled ?? true,
            retryAttempts: config.retryAttempts ?? 3,
            country: config.country ?? 'us',
            includeMetadata: config.includeMetadata ?? false
        };

        this.client = axios.create({
            timeout: this.config.timeout,
            headers: {
                'User-Agent': this.config.userAgent,
                ...this.config.headers
            }
        });
    }

    /**
     * Fetch app version from Apple App Store
     * @param bundleId - iOS app bundle identifier (e.g., 'com.example.app')
     * @returns Promise<AppVersion> - App version information
     * @throws {AppStoreError} When app is not found or API request fails
     * @throws {NetworkError} When network request fails
     */
    async getVersion(bundleId: string): Promise<AppVersion> {
        if (typeof bundleId !== 'string') {
            throw new AppStoreError('Bundle ID is required and must be a string', bundleId || '');
        }

        if (bundleId.trim().length === 0) {
            throw new AppStoreError('Bundle ID cannot be empty', bundleId);
        }

        let attempts = 0;
        const maxAttempts = this.config.retryEnabled ? this.config.retryAttempts : 1;

        while (attempts < maxAttempts) {
            attempts++;

            try {
                const url = `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(bundleId)}&country=${this.config.country}`;
                const response = await this.client.get<AppStoreResponse>(url);

                if (response.data.resultCount === 0) {
                    throw new AppStoreError(`App not found: ${bundleId}`, bundleId, 404);
                }

                const app = response.data.results[0];
                if (!app) {
                    throw new AppStoreError(`Invalid response format for ${bundleId}`, bundleId);
                }

                return {
                    version: app.version,
                    releaseDate: app.currentVersionReleaseDate,
                    releaseNotes: app.releaseNotes,
                    bundleId: app.bundleId
                };

            } catch (error) {
                if (error instanceof AppStoreError) {
                    if (attempts >= maxAttempts) {
                        throw error;
                    }
                    // Don't retry for client errors (4xx)
                    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
                        throw error;
                    }
                }

                if (attempts >= maxAttempts) {
                    if (error instanceof AxiosError) {
                        const statusCode = error.response?.status;
                        throw new AppStoreError(
                            `Failed to fetch App Store version: ${error.message}`,
                            bundleId,
                            statusCode
                        );
                    }

                    throw new NetworkError(
                        `Network error while fetching App Store version: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        error instanceof Error ? error : undefined
                    );
                }

                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
            }
        }

        // This should never be reached, but just in case
        throw new NetworkError(
            `Failed to fetch App Store version after ${maxAttempts} attempts`,
            undefined
        );
    }

    /**
     * Search for apps in the App Store
     * @param term - Search term
     * @param limit - Maximum number of results (default: 50)
     * @returns Promise<AppVersion[]> - Array of app version information
     */
    async search(term: string, limit: number = 50): Promise<AppVersion[]> {
        if (!term || typeof term !== 'string') {
            throw new AppStoreError('Search term is required and must be a string', '');
        }

        try {
            const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${this.config.country}&media=software&limit=${limit}`;
            const response = await this.client.get<AppStoreResponse>(url);

            return response.data.results.map(app => ({
                version: app.version,
                releaseDate: app.currentVersionReleaseDate,
                releaseNotes: app.releaseNotes,
                bundleId: app.bundleId
            }));

        } catch (error) {
            if (error instanceof AxiosError) {
                const statusCode = error.response?.status;
                throw new AppStoreError(
                    `Failed to search App Store: ${error.message}`,
                    term,
                    statusCode
                );
            }

            throw new NetworkError(
                `Network error while searching App Store: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Get the current configuration
     */
    getConfig(): Readonly<Required<AppStoreConfig>> {
        return { ...this.config };
    }

    /**
     * Update the client configuration
     * @param newConfig - Partial configuration to merge with existing config
     */
    updateConfig(newConfig: Partial<AppStoreConfig>): void {
        this.config = {
            ...this.config,
            ...newConfig
        };

        // Recreate axios instance with new config
        this.client = axios.create({
            timeout: this.config.timeout,
            headers: {
                'User-Agent': this.config.userAgent,
                ...this.config.headers
            }
        });
    }

    /**
     * Check if a bundle ID exists in the App Store
     * @param bundleId - iOS app bundle identifier
     * @returns Promise<boolean> - true if app exists, false otherwise
     */
    async exists(bundleId: string): Promise<boolean> {
        try {
            await this.getVersion(bundleId);
            return true;
        } catch (error) {
            if (error instanceof AppStoreError && error.statusCode === 404) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Check for updates by comparing current version with latest available version
     * @param bundleId - iOS app bundle identifier
     * @param currentVersion - Current version of the app to compare against
     * @returns Promise<UpdateCheckResult> - Update check result with details
     * @throws {AppStoreError} When app is not found or API request fails
     * @throws {NetworkError} When network request fails
     */
    async checkForUpdates(bundleId: string, currentVersion: string): Promise<UpdateCheckResult> {
        if (typeof currentVersion !== 'string') {
            throw new AppStoreError('Current version is required and must be a string', bundleId);
        }

        if (currentVersion.trim().length === 0) {
            throw new AppStoreError('Current version cannot be empty', bundleId);
        }

        try {
            // Get latest version from App Store
            const latestAppInfo = await this.getVersion(bundleId);
            const latestVersion = latestAppInfo.version;

            // Compare versions
            const versionComparison = compareVersions(currentVersion, latestVersion);
            const updateAvailable = versionComparison < 0; // Current version is older

            const result: UpdateCheckResult = {
                updateAvailable,
                currentVersion,
                latestVersion,
                versionComparison,
                updateDetails: updateAvailable ? latestAppInfo : undefined
            };

            return result;

        } catch (error) {
            if (error instanceof AppStoreError) {
                throw error;
            }

            throw new NetworkError(
                `Failed to check for updates: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error : undefined
            );
        }
    }
}

// Export default instance for convenience
export default new AppStoreClient();