import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { PlayStoreClient, PlayStoreError, NetworkError } from '../index.js';

describe('PlayStoreClient', () => {
    describe('Configuration', () => {
        test('should create instance with default config', () => {
            const client = new PlayStoreClient();
            const config = client.getConfig();

            assert.equal(config.timeout, 10000);
            assert.equal(config.userAgent, 'node-maw-playstore/1.0.0');
            assert.equal(config.retryEnabled, true);
            assert.equal(config.retryAttempts, 3);
            assert.equal(config.language, 'en');
            assert.equal(config.country, 'us');
            assert.equal(config.includeMetadata, false);
            assert.deepEqual(config.headers, {});
        });

        test('should create instance with custom config', () => {
            const customConfig = {
                timeout: 5000,
                userAgent: 'test-playstore-agent/2.0.0',
                retryEnabled: false,
                retryAttempts: 1,
                headers: { 'Custom-Header': 'test-value' },
                language: 'es',
                country: 'mx',
                includeMetadata: true
            };

            const client = new PlayStoreClient(customConfig);
            const config = client.getConfig();

            assert.equal(config.timeout, 5000);
            assert.equal(config.userAgent, 'test-playstore-agent/2.0.0');
            assert.equal(config.retryEnabled, false);
            assert.equal(config.retryAttempts, 1);
            assert.equal(config.language, 'es');
            assert.equal(config.country, 'mx');
            assert.equal(config.includeMetadata, true);
            assert.deepEqual(config.headers, { 'Custom-Header': 'test-value' });
        });

        test('should update config correctly', () => {
            const client = new PlayStoreClient();

            // Update single property
            client.updateConfig({ timeout: 15000 });
            let config = client.getConfig();
            assert.equal(config.timeout, 15000);
            assert.equal(config.userAgent, 'node-maw-playstore/1.0.0'); // unchanged

            // Update multiple properties
            client.updateConfig({
                userAgent: 'updated-playstore-agent',
                language: 'fr',
                country: 'fr'
            });
            config = client.getConfig();
            assert.equal(config.timeout, 15000); // unchanged
            assert.equal(config.userAgent, 'updated-playstore-agent');
            assert.equal(config.language, 'fr');
            assert.equal(config.country, 'fr');
        });
    });

    describe('getVersion', () => {
        test('should successfully fetch Play Store version for real app', async () => {
            const client = new PlayStoreClient();

            try {
                // Using WhatsApp as a test app (known to exist in Play Store)
                const result = await client.getVersion('com.whatsapp');

                assert.ok(result);
                assert.ok(typeof result.version === 'string');
                assert.ok(typeof result.releaseDate === 'string');
                assert.equal(result.packageName, 'com.whatsapp');

                // Version should not be empty
                assert.ok(result.version.length > 0);

                // Release date should be a valid ISO string
                assert.ok(!isNaN(Date.parse(result.releaseDate)));

                // Should not have bundleId (iOS-only field)
                assert.equal(result.bundleId, undefined);

                console.log('✅ PlayStoreClient test result:', {
                    version: result.version,
                    releaseDate: result.releaseDate,
                    packageName: result.packageName,
                    hasReleaseNotes: !!result.releaseNotes
                });

            } catch (error) {
                // If the test fails due to network issues, that's acceptable
                if (error instanceof NetworkError) {
                    console.log('⚠️ Network error during PlayStoreClient test - this is acceptable:', error.message);
                    return;
                }
                throw error;
            }
        });

        test('should throw PlayStoreError for non-existent app', async () => {
            const client = new PlayStoreClient();

            try {
                await client.getVersion('com.test.app.nonexistent.fake.package');
                assert.fail('Should have thrown PlayStoreError');
            } catch (error) {
                assert.ok(error instanceof PlayStoreError);
                assert.equal(error.packageName, 'com.test.app.nonexistent.fake.package');
                assert.ok(error.message.includes('App not found') || error.message.includes('not found'));
            }
        });

        test('should throw PlayStoreError for invalid package name format', async () => {
            const client = new PlayStoreClient();

            try {
                await client.getVersion('invalid-package');
                assert.fail('Should have thrown PlayStoreError');
            } catch (error) {
                assert.ok(error instanceof PlayStoreError);
                assert.equal(error.packageName, 'invalid-package');
                assert.ok(error.message.includes('Invalid package name format'));
            }
        });

        test('should throw PlayStoreError for empty package name', async () => {
            const client = new PlayStoreClient();

            try {
                await client.getVersion('');
                assert.fail('Should have thrown PlayStoreError');
            } catch (error) {
                assert.ok(error instanceof PlayStoreError);
                assert.ok(error.message.includes('Package name cannot be empty'));
            }
        });

        test('should throw PlayStoreError for null/undefined package name', async () => {
            const client = new PlayStoreClient();

            try {
                // @ts-ignore - intentionally passing invalid type for testing
                await client.getVersion(null);
                assert.fail('Should have thrown PlayStoreError');
            } catch (error) {
                assert.ok(error instanceof PlayStoreError);
                assert.ok(error.message.includes('Package name is required'));
            }
        });
    });

    describe('exists', () => {
        test('should return true for existing app', async () => {
            const client = new PlayStoreClient();

            try {
                const exists = await client.exists('com.whatsapp');
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
            const client = new PlayStoreClient();

            try {
                const exists = await client.exists('com.test.app.nonexistent.fake.package');
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
            const client = new PlayStoreClient();

            try {
                const results = await client.search('calculator', { num: 5 });

                assert.ok(Array.isArray(results));
                assert.ok(results.length > 0);
                assert.ok(results.length <= 5);

                // Check first result structure
                const firstResult = results[0];
                assert.ok(firstResult, 'First result should exist');
                assert.ok(typeof firstResult.version === 'string');
                assert.ok(typeof firstResult.releaseDate === 'string');
                assert.ok(typeof firstResult.packageName === 'string');

                console.log('✅ PlayStore search test passed with', results.length, 'results');

            } catch (error) {
                if (error instanceof NetworkError || error instanceof PlayStoreError) {
                    console.log('⚠️ Expected error during search test:', error.message);
                    return;
                }
                throw error;
            }
        });

        test('should throw error for empty search term', async () => {
            const client = new PlayStoreClient();

            try {
                await client.search('');
                assert.fail('Should have thrown PlayStoreError');
            } catch (error) {
                assert.ok(error instanceof PlayStoreError);
                assert.ok(error.message.includes('Search term is required'));
            }
        });
    });

    describe('getFullDetails', () => {
        test('should get full app details', async () => {
            const client = new PlayStoreClient();

            try {
                const details = await client.getFullDetails('com.whatsapp');

                assert.ok(details);
                assert.ok(typeof details === 'object');
                assert.ok(details.appId || details.packageName);

                console.log('✅ Full details test passed');

            } catch (error) {
                if (error instanceof NetworkError || error instanceof PlayStoreError) {
                    console.log('⚠️ Expected error during full details test:', error.message);
                    return;
                }
                throw error;
            }
        });

        test('should throw error for non-existent app in full details', async () => {
            const client = new PlayStoreClient();

            try {
                await client.getFullDetails('com.test.app.nonexistent.fake.package');
                assert.fail('Should have thrown PlayStoreError');
            } catch (error) {
                assert.ok(error instanceof PlayStoreError);
                assert.equal(error.packageName, 'com.test.app.nonexistent.fake.package');
            }
        });
    });

    describe('Language and Country Support', () => {
        test('should work with different languages and countries', async () => {
            const client = new PlayStoreClient({
                language: 'es',
                country: 'mx'
            });

            try {
                const result = await client.getVersion('com.whatsapp');
                assert.ok(result);
                console.log('✅ Spanish/Mexico Play Store test passed');
            } catch (error) {
                if (error instanceof NetworkError || error instanceof PlayStoreError) {
                    console.log('⚠️ Expected error during language/country test:', error.message);
                    return;
                }
                throw error;
            }
        });
    });

    describe('Package Name Validation', () => {
        test('should validate package name format strictly', async () => {
            const client = new PlayStoreClient();

            const invalidPackageNames = [
                'com',                          // Too short
                'com.',                         // Ends with dot
                '.com.example',                 // Starts with dot
                'com..example',                 // Double dot
                '123.example.app',              // Starts with number
                'com.example.app.',             // Ends with dot
                'com.example-app',              // Invalid character (hyphen)
                'com.example app',              // Space
                'com.example.app!',             // Special character
            ];

            for (const packageName of invalidPackageNames) {
                try {
                    await client.getVersion(packageName);
                    assert.fail(`Should have thrown PlayStoreError for: ${packageName}`);
                } catch (error) {
                    assert.ok(error instanceof PlayStoreError, `Expected PlayStoreError for: ${packageName}`);
                    assert.ok(
                        error.message.includes('Invalid package name format'),
                        `Expected format error for: ${packageName}, got: ${error.message}`
                    );
                }
            }
        });

        test('should accept valid package name formats', async () => {
            const client = new PlayStoreClient();

            const validPackageNames = [
                'com.example.app',
                'com.google.android.gms',
                'a.b.c',
                'com.company123.app456',
                'com.example.app_name',
                'org.example.myapp',
            ];

            for (const packageName of validPackageNames) {
                try {
                    await client.getVersion(packageName);
                    // If it doesn't throw a format error, the format is considered valid
                    console.log(`✅ Valid format accepted: ${packageName}`);
                } catch (error) {
                    // Only format errors should fail this test
                    if (error instanceof PlayStoreError && error.message.includes('Invalid package name format')) {
                        assert.fail(`Valid package name rejected: ${packageName} - ${error.message}`);
                    }
                    // Network errors or "not found" errors are acceptable for this test
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.log(`ℹ️ Format valid but app not found or network error for ${packageName}: ${errorMessage}`);
                }
            }
        });
    });

    describe('Update Checking', () => {
        test('should return update available when current version is older', async () => {
            const client = new PlayStoreClient();
            const result = await client.checkForUpdates('com.whatsapp', '1.0.0');

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
            const client = new PlayStoreClient();
            // Using a high version number that's likely newer than current
            const result = await client.checkForUpdates('com.whatsapp', '99.99.99');

            assert.strictEqual(result.updateAvailable, false);
            assert.strictEqual(result.currentVersion, '99.99.99');
            assert.strictEqual(typeof result.latestVersion, 'string');
            assert(result.versionComparison >= 0); // Current is same or newer
            assert.strictEqual(result.updateDetails, undefined);
        });

        test('should throw error for non-existent app', async () => {
            const client = new PlayStoreClient();
            await assert.rejects(
                client.checkForUpdates('com.nonexistent.app.that.does.not.exist', '1.0.0'),
                (error: any) => {
                    assert(error instanceof PlayStoreError);
                    assert.strictEqual(error.packageName, 'com.nonexistent.app.that.does.not.exist');
                    return true;
                }
            );
        });

        test('should throw error for invalid current version', async () => {
            const client = new PlayStoreClient();

            await assert.rejects(
                client.checkForUpdates('com.whatsapp', ''),
                (error: any) => {
                    assert(error instanceof PlayStoreError);
                    assert(error.message.includes('Current version cannot be empty'));
                    return true;
                }
            );

            await assert.rejects(
                client.checkForUpdates('com.whatsapp', null as any),
                (error: any) => {
                    assert(error instanceof PlayStoreError);
                    assert(error.message.includes('Current version is required'));
                    return true;
                }
            );
        });

        test('should throw error for invalid package name', async () => {
            const client = new PlayStoreClient();
            await assert.rejects(
                client.checkForUpdates('', '1.0.0'),
                (error: any) => {
                    assert(error instanceof PlayStoreError);
                    return true;
                }
            );
        });
    });
});