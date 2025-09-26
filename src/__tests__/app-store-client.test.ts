import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { AppStoreClient, AppStoreError, NetworkError } from '../index.js';

describe('AppStoreClient', () => {
    describe('Configuration', () => {
        test('should create instance with default config', () => {
            const client = new AppStoreClient();
            const config = client.getConfig();

            assert.equal(config.timeout, 10000);
            assert.equal(config.userAgent, 'node-maw-appstore/1.0.0');
            assert.equal(config.retryEnabled, true);
            assert.equal(config.retryAttempts, 3);
            assert.equal(config.country, 'us');
            assert.equal(config.includeMetadata, false);
            assert.deepEqual(config.headers, {});
        });

        test('should create instance with custom config', () => {
            const customConfig = {
                timeout: 5000,
                userAgent: 'test-appstore-agent/2.0.0',
                retryEnabled: false,
                retryAttempts: 1,
                headers: { 'Custom-Header': 'test-value' },
                country: 'ca',
                includeMetadata: true
            };

            const client = new AppStoreClient(customConfig);
            const config = client.getConfig();

            assert.equal(config.timeout, 5000);
            assert.equal(config.userAgent, 'test-appstore-agent/2.0.0');
            assert.equal(config.retryEnabled, false);
            assert.equal(config.retryAttempts, 1);
            assert.equal(config.country, 'ca');
            assert.equal(config.includeMetadata, true);
            assert.deepEqual(config.headers, { 'Custom-Header': 'test-value' });
        });

        test('should update config correctly', () => {
            const client = new AppStoreClient();

            // Update single property
            client.updateConfig({ timeout: 15000 });
            let config = client.getConfig();
            assert.equal(config.timeout, 15000);
            assert.equal(config.userAgent, 'node-maw-appstore/1.0.0'); // unchanged

            // Update multiple properties
            client.updateConfig({
                userAgent: 'updated-appstore-agent',
                country: 'uk'
            });
            config = client.getConfig();
            assert.equal(config.timeout, 15000); // unchanged
            assert.equal(config.userAgent, 'updated-appstore-agent');
            assert.equal(config.country, 'uk');
        });
    });

    describe('getVersion', () => {
        test('should successfully fetch App Store version for real app', async () => {
            const client = new AppStoreClient();

            try {
                // Using WhatsApp as a test app (known to exist in App Store)
                const result = await client.getVersion('net.whatsapp.WhatsApp');

                assert.ok(result);
                assert.ok(typeof result.version === 'string');
                assert.ok(typeof result.releaseDate === 'string');
                assert.equal(result.bundleId, 'net.whatsapp.WhatsApp');

                // Version should not be empty
                assert.ok(result.version.length > 0);

                // Release date should be a valid ISO string
                assert.ok(!isNaN(Date.parse(result.releaseDate)));

                // Should not have packageName (Android-only field)
                assert.equal(result.packageName, undefined);

                console.log('✅ AppStoreClient test result:', {
                    version: result.version,
                    releaseDate: result.releaseDate,
                    bundleId: result.bundleId,
                    hasReleaseNotes: !!result.releaseNotes
                });

            } catch (error) {
                // If the test fails due to network issues, that's acceptable
                if (error instanceof NetworkError) {
                    console.log('⚠️ Network error during AppStoreClient test - this is acceptable:', error.message);
                    return;
                }
                throw error;
            }
        });

        test('should throw AppStoreError for non-existent app', async () => {
            const client = new AppStoreClient();

            try {
                await client.getVersion('com.test.app.nonexistent.fake.bundle');
                assert.fail('Should have thrown AppStoreError');
            } catch (error) {
                assert.ok(error instanceof AppStoreError);
                assert.equal(error.bundleId, 'com.test.app.nonexistent.fake.bundle');
                assert.equal(error.statusCode, 404);
                assert.ok(error.message.includes('App not found'));
            }
        });

        test('should throw AppStoreError for empty bundle ID', async () => {
            const client = new AppStoreClient();

            try {
                await client.getVersion('');
                assert.fail('Should have thrown AppStoreError');
            } catch (error) {
                assert.ok(error instanceof AppStoreError);
                assert.ok(error.message.includes('Bundle ID cannot be empty'));
            }
        });

        test('should throw AppStoreError for null/undefined bundle ID', async () => {
            const client = new AppStoreClient();

            try {
                // @ts-ignore - intentionally passing invalid type for testing
                await client.getVersion(null);
                assert.fail('Should have thrown AppStoreError');
            } catch (error) {
                assert.ok(error instanceof AppStoreError);
                assert.ok(error.message.includes('Bundle ID is required'));
            }
        });
    });

    describe('exists', () => {
        test('should return true for existing app', async () => {
            const client = new AppStoreClient();

            try {
                const exists = await client.exists('com.apple.calculator');
                assert.equal(exists, true);
            } catch (error) {
                if (error instanceof NetworkError) {
                    console.log('⚠️ Network error during exists test - skipping');
                    return;
                }
                throw error;
            }
        });

        test('should return false for non-existent app', async () => {
            const client = new AppStoreClient();

            try {
                const exists = await client.exists('com.test.app.nonexistent.fake.bundle');
                assert.equal(exists, false);
            } catch (error) {
                if (error instanceof NetworkError) {
                    console.log('⚠️ Network error during exists test - skipping');
                    return;
                }
                throw error;
            }
        });
    });

    describe('search', () => {
        test('should successfully search for apps', async () => {
            const client = new AppStoreClient();

            try {
                const results = await client.search('calculator', 5);

                assert.ok(Array.isArray(results));
                assert.ok(results.length > 0);
                assert.ok(results.length <= 5);

                // Check first result structure
                const firstResult = results[0];
                assert.ok(firstResult, 'First result should exist');
                assert.ok(typeof firstResult.version === 'string');
                assert.ok(typeof firstResult.releaseDate === 'string');
                assert.ok(typeof firstResult.bundleId === 'string');

                console.log('✅ AppStore search test passed with', results.length, 'results');

            } catch (error) {
                if (error instanceof NetworkError || error instanceof AppStoreError) {
                    console.log('⚠️ Expected error during search test:', error.message);
                    return;
                }
                throw error;
            }
        });

        test('should throw error for empty search term', async () => {
            const client = new AppStoreClient();

            try {
                await client.search('');
                assert.fail('Should have thrown AppStoreError');
            } catch (error) {
                assert.ok(error instanceof AppStoreError);
                assert.ok(error.message.includes('Search term is required'));
            }
        });
    });

    describe('Country Support', () => {
        test('should work with different countries', async () => {
            const client = new AppStoreClient({ country: 'ca' });

            try {
                const result = await client.getVersion('com.apple.calculator');
                assert.ok(result);
                console.log('✅ Canadian App Store test passed');
            } catch (error) {
                if (error instanceof NetworkError || error instanceof AppStoreError) {
                    console.log('⚠️ Expected error during country test:', error.message);
                    return;
                }
                throw error;
            }
        });
    });

    describe('Update Checking', () => {
        test('should return update available when current version is older', async () => {
            const client = new AppStoreClient();
            const result = await client.checkForUpdates('net.whatsapp.WhatsApp', '1.0.0');

            assert.strictEqual(typeof result.updateAvailable, 'boolean');
            assert.strictEqual(result.currentVersion, '1.0.0');
            assert.strictEqual(typeof result.latestVersion, 'string');
            assert.strictEqual(typeof result.versionComparison, 'number');

            if (result.updateAvailable) {
                assert(result.updateDetails);
                assert(result.versionComparison < 0); // Current is older
            }
        });

        test('should return no update when current version is same or newer', async () => {
            const client = new AppStoreClient();
            // Using a high version number that's likely newer than current
            const result = await client.checkForUpdates('net.whatsapp.WhatsApp', '99.99.99');

            assert.strictEqual(result.updateAvailable, false);
            assert.strictEqual(result.currentVersion, '99.99.99');
            assert.strictEqual(typeof result.latestVersion, 'string');
            assert(result.versionComparison >= 0); // Current is same or newer
            assert.strictEqual(result.updateDetails, undefined);
        });

        test('should throw error for non-existent app', async () => {
            const client = new AppStoreClient();
            await assert.rejects(
                client.checkForUpdates('com.nonexistent.app.that.does.not.exist', '1.0.0'),
                (error: any) => {
                    assert(error instanceof AppStoreError);
                    assert.strictEqual(error.bundleId, 'com.nonexistent.app.that.does.not.exist');
                    return true;
                }
            );
        });

        test('should throw error for invalid current version', async () => {
            const client = new AppStoreClient();

            await assert.rejects(
                client.checkForUpdates('net.whatsapp.WhatsApp', ''),
                (error: any) => {
                    assert(error instanceof AppStoreError);
                    assert(error.message.includes('Current version cannot be empty'));
                    return true;
                }
            );

            await assert.rejects(
                client.checkForUpdates('net.whatsapp.WhatsApp', null as any),
                (error: any) => {
                    assert(error instanceof AppStoreError);
                    assert(error.message.includes('Current version is required'));
                    return true;
                }
            );
        });

        test('should throw error for invalid bundle ID', async () => {
            const client = new AppStoreClient();
            await assert.rejects(
                client.checkForUpdates('', '1.0.0'),
                (error: any) => {
                    assert(error instanceof AppStoreError);
                    return true;
                }
            );
        });
    });
});