// @ts-ignore
import gplay from 'google-play-scraper';
import {
    AppVersion,
    NodeMawConfig,
    PlayStoreError,
    NetworkError,
    UpdateCheckResult,
    compareVersions
} from './types.js';

/**
 * Configuration specific to Play Store client
 */
export interface PlayStoreConfig extends NodeMawConfig {
    /** Play Store language (default: 'en') */
    language?: string;
    /** Play Store country (default: 'us') */
    country?: string;
    /** Include additional app metadata in responses */
    includeMetadata?: boolean;
}

/**
 * Client for fetching app information from Google Play Store
 */
export class PlayStoreClient {
    private config: Required<PlayStoreConfig>;

    constructor(config: PlayStoreConfig = {}) {
        this.config = {
            timeout: config.timeout ?? 10000,
            userAgent: config.userAgent ?? 'node-maw-playstore/1.0.0',
            headers: config.headers ?? {},
            retryEnabled: config.retryEnabled ?? true,
            retryAttempts: config.retryAttempts ?? 3,
            language: config.language ?? 'en',
            country: config.country ?? 'us',
            includeMetadata: config.includeMetadata ?? false
        };
    }

    /**
     * Fetch app version from Google Play Store
     * @param packageName - Android app package name (e.g., 'com.example.app')
     * @returns Promise<AppVersion> - App version information
     * @throws {PlayStoreError} When app is not found or API request fails
     * @throws {NetworkError} When network request fails
     */
    async getVersion(packageName: string): Promise<AppVersion> {
        // Validate input
        if (typeof packageName !== 'string') {
            throw new PlayStoreError('Package name is required and must be a string', packageName || '');
        }

        if (packageName.trim().length === 0) {
            throw new PlayStoreError('Package name cannot be empty', packageName);
        }

        // Validate package name format (basic check)
        if (!/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(packageName)) {
            throw new PlayStoreError(
                `Invalid package name format: ${packageName}. Expected format: com.example.app`,
                packageName
            );
        }

        let attempts = 0;
        const maxAttempts = this.config.retryEnabled ? this.config.retryAttempts : 1;

        while (attempts < maxAttempts) {
            attempts++;

            try {
                // Use google-play-scraper to fetch app details
                const appDetails = await gplay.app({
                    appId: packageName,
                    lang: this.config.language,
                    country: this.config.country
                });

                if (!appDetails) {
                    throw new PlayStoreError(`App not found: ${packageName}`, packageName, 404);
                }

                return {
                    version: appDetails.version || 'Unknown',
                    releaseDate: this.formatPlayStoreDate(appDetails.updated),
                    releaseNotes: appDetails.recentChanges || undefined,
                    packageName: packageName
                };

            } catch (error) {
                if (attempts >= maxAttempts) {
                    // Handle different error types
                    if (error instanceof Error) {
                        // Check if it's a "not found" error
                        if (error.message.includes('not found') || error.message.includes('404')) {
                            throw new PlayStoreError(
                                `App not found: ${packageName}`,
                                packageName,
                                404
                            );
                        }

                        // Check if it's a network error
                        if (error.message.includes('network') || error.message.includes('timeout')) {
                            throw new NetworkError(
                                `Network error while fetching Play Store version: ${error.message}`,
                                error
                            );
                        }

                        // Generic Play Store error
                        throw new PlayStoreError(
                            `Failed to fetch Play Store version: ${error.message}`,
                            packageName
                        );
                    }

                    throw new NetworkError(
                        `Unknown error while fetching Play Store version: ${JSON.stringify(error)}`,
                        error instanceof Error ? error : undefined
                    );
                }

                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
            }
        }

        // This should never be reached, but just in case
        throw new NetworkError(
            `Failed to fetch Play Store version after ${maxAttempts} attempts`,
            undefined
        );
    }

    /**
     * Search for apps in the Play Store
     * @param term - Search term
     * @param options - Search options
     * @returns Promise<AppVersion[]> - Array of app version information
     */
    async search(term: string, options: { num?: number; fullDetail?: boolean } = {}): Promise<AppVersion[]> {
        if (!term || typeof term !== 'string') {
            throw new PlayStoreError('Search term is required and must be a string', '');
        }

        try {
            const results = await gplay.search({
                term: term,
                lang: this.config.language,
                country: this.config.country,
                num: options.num || 50,
                fullDetail: options.fullDetail || false
            });

            return results.map((app: any) => ({
                version: app.version || 'Unknown',
                releaseDate: this.formatPlayStoreDate(app.updated),
                releaseNotes: app.recentChanges || undefined,
                packageName: app.appId
            }));

        } catch (error) {
            throw new NetworkError(
                `Network error while searching Play Store: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Get app details with full information
     * @param packageName - Android app package name
     * @returns Promise<any> - Full app details from Play Store
     */
    async getFullDetails(packageName: string): Promise<any> {
        if (!packageName || typeof packageName !== 'string') {
            throw new PlayStoreError('Package name is required and must be a string', packageName || '');
        }

        try {
            return await gplay.app({
                appId: packageName,
                lang: this.config.language,
                country: this.config.country
            });
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('not found') || error.message.includes('404')) {
                    throw new PlayStoreError(
                        `App not found: ${packageName}`,
                        packageName,
                        404
                    );
                }

                throw new PlayStoreError(
                    `Failed to fetch Play Store details: ${error.message}`,
                    packageName
                );
            }

            throw new NetworkError(
                `Unknown error while fetching Play Store details: ${JSON.stringify(error)}`,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Get the current configuration
     */
    getConfig(): Readonly<Required<PlayStoreConfig>> {
        return { ...this.config };
    }

    /**
     * Update the client configuration
     * @param newConfig - Partial configuration to merge with existing config
     */
    updateConfig(newConfig: Partial<PlayStoreConfig>): void {
        this.config = {
            ...this.config,
            ...newConfig
        };
    }

    /**
     * Check if a package name exists in the Play Store
     * @param packageName - Android app package name
     * @returns Promise<boolean> - true if app exists, false otherwise
     */
    async exists(packageName: string): Promise<boolean> {
        try {
            await this.getVersion(packageName);
            return true;
        } catch (error) {
            if (error instanceof PlayStoreError && error.statusCode === 404) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Check for updates by comparing current version with latest available version
     * @param packageName - Android app package name
     * @param currentVersion - Current version of the app to compare against
     * @returns Promise<UpdateCheckResult> - Update check result with details
     * @throws {PlayStoreError} When app is not found or API request fails
     * @throws {NetworkError} When network request fails
     */
    async checkForUpdates(packageName: string, currentVersion: string): Promise<UpdateCheckResult> {
        if (typeof currentVersion !== 'string') {
            throw new PlayStoreError('Current version is required and must be a string', packageName);
        }

        if (currentVersion.trim().length === 0) {
            throw new PlayStoreError('Current version cannot be empty', packageName);
        }

        try {
            // Get latest version from Play Store
            const latestAppInfo = await this.getVersion(packageName);
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
            if (error instanceof PlayStoreError) {
                throw error;
            }

            throw new NetworkError(
                `Failed to check for updates: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Format Play Store date to ISO string
     * @private
     */
    private formatPlayStoreDate(date: string | number | undefined): string {
        if (!date) {
            return new Date().toISOString();
        }

        try {
            // If it's a timestamp (number), convert to date
            if (typeof date === 'number') {
                return new Date(date).toISOString();
            }

            // If it's a string, try to parse it
            if (typeof date === 'string') {
                const parsed = new Date(date);
                if (!isNaN(parsed.getTime())) {
                    return parsed.toISOString();
                }
            }

            // Fallback to current date
            return new Date().toISOString();
        } catch (error) {
            return new Date().toISOString();
        }
    }
}

// Export default instance for convenience
export default new PlayStoreClient();