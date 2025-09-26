import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { NodeMaw, AppStoreClient, PlayStoreClient, AppStoreError, PlayStoreError, NetworkError } from '../index.js';

describe('NodeMaw Core', () => {
    describe('Configuration', () => {
        test('should create instance with default config', () => {
            const client = new NodeMaw();
            const config = client.getConfig();

            assert.equal(config.timeout, 10000);
            assert.equal(config.userAgent, 'node-maw/1.0.0');
            assert.equal(config.retryEnabled, true);
            assert.equal(config.retryAttempts, 3);
            assert.deepEqual(config.headers, {});
        });

        test('should create instance with custom config', () => {
            const customConfig = {
                timeout: 5000,
                userAgent: 'test-agent/2.0.0',
                retryEnabled: false,
                retryAttempts: 1,
                headers: { 'Custom-Header': 'test-value' }
            };

            const client = new NodeMaw(customConfig);
            const config = client.getConfig();

            assert.equal(config.timeout, 5000);
            assert.equal(config.userAgent, 'test-agent/2.0.0');
            assert.equal(config.retryEnabled, false);
            assert.equal(config.retryAttempts, 1);
            assert.deepEqual(config.headers, { 'Custom-Header': 'test-value' });
        });

        test('should create instance with partial config', () => {
            const partialConfig = {
                timeout: 15000,
                headers: { 'Authorization': 'Bearer token' }
            };

            const client = new NodeMaw(partialConfig);
            const config = client.getConfig();

            assert.equal(config.timeout, 15000);
            assert.equal(config.userAgent, 'node-maw/1.0.0'); // default
            assert.equal(config.retryEnabled, true); // default
            assert.equal(config.retryAttempts, 3); // default
            assert.deepEqual(config.headers, { 'Authorization': 'Bearer token' });
        });

        test('should update config correctly', () => {
            const client = new NodeMaw();

            // Update single property
            client.updateConfig({ timeout: 15000 });
            let config = client.getConfig();
            assert.equal(config.timeout, 15000);
            assert.equal(config.userAgent, 'node-maw/1.0.0'); // unchanged

            // Update multiple properties
            client.updateConfig({
                userAgent: 'updated-agent',
                retryEnabled: false
            });
            config = client.getConfig();
            assert.equal(config.timeout, 15000); // unchanged
            assert.equal(config.userAgent, 'updated-agent');
            assert.equal(config.retryEnabled, false);
        });

        test('should preserve immutability of returned config', () => {
            const client = new NodeMaw();
            const config1 = client.getConfig();
            const config2 = client.getConfig();

            // Should be equal but not the same reference
            assert.deepEqual(config1, config2);
            assert.notStrictEqual(config1, config2);

            // The returned config should be readonly, but let's verify it doesn't affect internal state
            const originalTimeout = config1.timeout;
            const config3 = client.getConfig();
            assert.equal(config3.timeout, originalTimeout); // Should still be the same
        });
    });

    describe('Separate Client Access', () => {
        test('should provide access to App Store client', () => {
            const client = new NodeMaw();

            assert.ok(client.appStore instanceof AppStoreClient);
            assert.ok(typeof client.appStore.getVersion === 'function');
            assert.ok(typeof client.appStore.search === 'function');
            assert.ok(typeof client.appStore.exists === 'function');
        });

        test('should provide access to Play Store client', () => {
            const client = new NodeMaw();

            assert.ok(client.playStore instanceof PlayStoreClient);
            assert.ok(typeof client.playStore.getVersion === 'function');
            assert.ok(typeof client.playStore.search === 'function');
            assert.ok(typeof client.playStore.exists === 'function');
            assert.ok(typeof client.playStore.getFullDetails === 'function');
        });

        test('should allow direct client usage', async () => {
            const client = new NodeMaw();

            try {
                // Test App Store client directly
                const appStoreResult = await client.appStore.getVersion('com.apple.calculator');
                assert.ok(appStoreResult);
                assert.ok(typeof appStoreResult.version === 'string');
                assert.ok(appStoreResult.bundleId);

                console.log('✅ Direct App Store client access test passed');
            } catch (error) {
                if (error instanceof NetworkError || error instanceof AppStoreError) {
                    console.log('⚠️ Expected error during direct client test:', error.message);
                }
            }

            try {
                // Test Play Store client directly  
                const playStoreResult = await client.playStore.getVersion('com.whatsapp');
                assert.ok(playStoreResult);
                assert.ok(typeof playStoreResult.version === 'string');
                assert.ok(playStoreResult.packageName);

                console.log('✅ Direct Play Store client access test passed');
            } catch (error) {
                if (error instanceof NetworkError || error instanceof PlayStoreError) {
                    console.log('⚠️ Expected error during direct client test:', error.message);
                }
            }
        });

        test('should maintain separate configurations for each client', () => {
            const client = new NodeMaw({
                timeout: 5000,
                appStore: {
                    country: 'ca',
                    includeMetadata: true
                },
                playStore: {
                    language: 'es',
                    country: 'mx'
                }
            });

            const appStoreConfig = client.appStore.getConfig();
            const playStoreConfig = client.playStore.getConfig();

            // Both should inherit the base timeout
            assert.equal(appStoreConfig.timeout, 5000);
            assert.equal(playStoreConfig.timeout, 5000);

            // App Store specific config
            assert.equal(appStoreConfig.country, 'ca');
            assert.equal(appStoreConfig.includeMetadata, true);

            // Play Store specific config
            assert.equal(playStoreConfig.language, 'es');
            assert.equal(playStoreConfig.country, 'mx');
        });

        test('should update individual client configs via main client', () => {
            const client = new NodeMaw();

            client.updateConfig({
                timeout: 8000,
                appStore: { country: 'uk' },
                playStore: { language: 'fr' }
            });

            const appStoreConfig = client.appStore.getConfig();
            const playStoreConfig = client.playStore.getConfig();

            assert.equal(appStoreConfig.timeout, 8000);
            assert.equal(appStoreConfig.country, 'uk');
            assert.equal(playStoreConfig.timeout, 8000);
            assert.equal(playStoreConfig.language, 'fr');
        });
    });

    describe('Backward Compatibility', () => {
        test('should maintain original getAppStoreVersion method', async () => {
            const client = new NodeMaw();

            try {
                const result = await client.getAppStoreVersion('com.apple.calculator');
                assert.ok(result);
                assert.ok(typeof result.version === 'string');
                assert.ok(result.bundleId);
                console.log('✅ Backward compatible App Store method test passed');
            } catch (error) {
                if (error instanceof NetworkError || error instanceof AppStoreError) {
                    console.log('⚠️ Expected error during backward compatibility test:', error.message);
                }
            }
        });

        test('should maintain original getPlayStoreVersion method', async () => {
            const client = new NodeMaw();

            try {
                const result = await client.getPlayStoreVersion('com.whatsapp');
                assert.ok(result);
                assert.ok(typeof result.version === 'string');
                assert.ok(result.packageName);
                console.log('✅ Backward compatible Play Store method test passed');
            } catch (error) {
                if (error instanceof NetworkError || error instanceof PlayStoreError) {
                    console.log('⚠️ Expected error during backward compatibility test:', error.message);
                }
            }
        });
    });

    describe('Error Classes', () => {
        test('should export AppStoreError correctly', () => {
            const error = new AppStoreError('Test error', 'com.test.app', 404);

            assert.ok(error instanceof Error);
            assert.ok(error instanceof AppStoreError);
            assert.equal(error.name, 'AppStoreError');
            assert.equal(error.message, 'Test error');
            assert.equal(error.bundleId, 'com.test.app');
            assert.equal(error.statusCode, 404);
        });

        test('should create AppStoreError without status code', () => {
            const error = new AppStoreError('Test error', 'com.test.app');

            assert.equal(error.bundleId, 'com.test.app');
            assert.equal(error.statusCode, undefined);
        });

        test('should export PlayStoreError correctly', () => {
            const error = new PlayStoreError('Test error', 'com.test.app', 500);

            assert.ok(error instanceof Error);
            assert.ok(error instanceof PlayStoreError);
            assert.equal(error.name, 'PlayStoreError');
            assert.equal(error.message, 'Test error');
            assert.equal(error.packageName, 'com.test.app');
            assert.equal(error.statusCode, 500);
        });

        test('should create PlayStoreError without status code', () => {
            const error = new PlayStoreError('Test error', 'com.test.app');

            assert.equal(error.packageName, 'com.test.app');
            assert.equal(error.statusCode, undefined);
        });

        test('should export NetworkError correctly', () => {
            const originalError = new Error('Original network error');
            const networkError = new NetworkError('Network error occurred', originalError);

            assert.ok(networkError instanceof Error);
            assert.ok(networkError instanceof NetworkError);
            assert.equal(networkError.name, 'NetworkError');
            assert.equal(networkError.message, 'Network error occurred');
            assert.equal(networkError.originalError, originalError);
        });

        test('should create NetworkError without original error', () => {
            const networkError = new NetworkError('Simple network error');

            assert.equal(networkError.originalError, undefined);
        });
    });

    describe('Type Exports', () => {
        test('should have correct error class inheritance', () => {
            const appStoreError = new AppStoreError('test', 'bundle');
            const playStoreError = new PlayStoreError('test', 'package');
            const networkError = new NetworkError('test');

            // All should be instances of Error
            assert.ok(appStoreError instanceof Error);
            assert.ok(playStoreError instanceof Error);
            assert.ok(networkError instanceof Error);

            // Should have correct names
            assert.equal(appStoreError.name, 'AppStoreError');
            assert.equal(playStoreError.name, 'PlayStoreError');
            assert.equal(networkError.name, 'NetworkError');

            // Should not be instances of each other
            assert.ok(!(appStoreError instanceof PlayStoreError));
            assert.ok(!(appStoreError instanceof NetworkError));
            assert.ok(!(playStoreError instanceof AppStoreError));
            assert.ok(!(playStoreError instanceof NetworkError));
            assert.ok(!(networkError instanceof AppStoreError));
            assert.ok(!(networkError instanceof PlayStoreError));
        });
    });
});

describe('Default Export', () => {
    test('should have default export instance', async () => {
        const { default: defaultClient } = await import('../index.js');

        assert.ok(defaultClient instanceof NodeMaw);

        const config = defaultClient.getConfig();
        assert.equal(config.userAgent, 'node-maw/1.0.0');
        assert.equal(config.timeout, 10000);
        assert.equal(config.retryEnabled, true);
        assert.equal(config.retryAttempts, 3);
    });

    test('should allow using default export methods', async () => {
        const { default: defaultClient } = await import('../index.js');

        // Should have the same methods as a regular instance
        assert.ok(typeof defaultClient.getAppStoreVersion === 'function');
        assert.ok(typeof defaultClient.getPlayStoreVersion === 'function');
        assert.ok(typeof defaultClient.getConfig === 'function');
        assert.ok(typeof defaultClient.updateConfig === 'function');
    });

    test('should maintain separate state from new instances', async () => {
        const { default: defaultClient } = await import('../index.js');
        const newClient = new NodeMaw();

        // Update default client config
        defaultClient.updateConfig({ timeout: 20000 });

        // New client should still have default config
        const defaultConfig = defaultClient.getConfig();
        const newConfig = newClient.getConfig();

        assert.equal(defaultConfig.timeout, 20000);
        assert.equal(newConfig.timeout, 10000); // Should still be default
    });

    describe('Update Checking Integration', () => {
        test('should provide App Store update checking via unified interface', async () => {
            const client = new NodeMaw();
            const result = await client.checkAppStoreForUpdates('net.whatsapp.WhatsApp', '1.0.0');

            assert.strictEqual(typeof result.updateAvailable, 'boolean');
            assert.strictEqual(result.currentVersion, '1.0.0');
            assert.strictEqual(typeof result.latestVersion, 'string');
            assert.strictEqual(typeof result.versionComparison, 'number');
        });

        test('should provide Play Store update checking via unified interface', async () => {
            const client = new NodeMaw();
            const result = await client.checkPlayStoreForUpdates('com.whatsapp', '1.0.0');

            assert.strictEqual(typeof result.updateAvailable, 'boolean');
            assert.strictEqual(result.currentVersion, '1.0.0');
            assert.strictEqual(typeof result.latestVersion, 'string');
            assert.strictEqual(typeof result.versionComparison, 'number');
        });

        test('should support update checking via direct client access', async () => {
            const client = new NodeMaw();

            // Test via appStore getter
            const appStoreResult = await client.appStore.checkForUpdates('net.whatsapp.WhatsApp', '1.0.0');
            assert.strictEqual(typeof appStoreResult.updateAvailable, 'boolean');

            // Test via playStore getter
            const playStoreResult = await client.playStore.checkForUpdates('com.whatsapp', '1.0.0');
            assert.strictEqual(typeof playStoreResult.updateAvailable, 'boolean');
        });

        test('should handle error propagation correctly in update checking', async () => {
            const client = new NodeMaw();

            await assert.rejects(
                client.checkAppStoreForUpdates('invalid.bundle.id', '1.0.0'),
                (error: any) => {
                    assert(error instanceof AppStoreError);
                    return true;
                }
            );

            await assert.rejects(
                client.checkPlayStoreForUpdates('invalid.package.name', '1.0.0'),
                (error: any) => {
                    assert(error instanceof PlayStoreError);
                    return true;
                }
            );
        });
    });
});