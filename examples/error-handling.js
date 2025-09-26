#!/usr/bin/env node

/**
 * Example: Error Handling with Node-MAW
 * 
 * This example demonstrates comprehensive error handling
 * strategies when working with App Store and Play Store APIs.
 */

import {
    NodeMaw,
    AppStoreClient,
    PlayStoreClient,
    AppStoreError,
    PlayStoreError,
    NetworkError
} from '../dist/index.js';

async function errorHandlingExample() {
    console.log('⚠️ Node-MAW Error Handling Example\n');

    const client = new NodeMaw();

    // 1. Handling Non-Existent Apps
    console.log('1️⃣ Testing Non-Existent Apps:');

    const nonExistentApps = [
        { store: 'appstore', id: 'com.nonexistent.app.12345' },
        { store: 'playstore', id: 'com.fake.application.xyz' }
    ];

    for (const app of nonExistentApps) {
        try {
            if (app.store === 'appstore') {
                await client.getAppStoreVersion(app.id);
            } else {
                await client.getPlayStoreVersion(app.id);
            }
            console.log(`  ✅ ${app.store}: ${app.id} found (unexpected!)`);

        } catch (error) {
            if (error instanceof AppStoreError) {
                console.log(`  🍎 AppStoreError: ${error.message}`);
                console.log(`      Bundle ID: ${error.bundleId}`);
                console.log(`      Status Code: ${error.statusCode || 'N/A'}`);
            } else if (error instanceof PlayStoreError) {
                console.log(`  🤖 PlayStoreError: ${error.message}`);
                console.log(`      Package Name: ${error.packageName}`);
                console.log(`      Status Code: ${error.statusCode || 'N/A'}`);
            } else {
                console.log(`  ❌ Unexpected error: ${error.message}`);
            }
        }
    }

    console.log('\n2️⃣ Testing Invalid Input Validation:');

    const invalidInputs = [
        { type: 'empty string', value: '' },
        { type: 'null', value: null },
        { type: 'undefined', value: undefined },
        { type: 'number', value: 123 },
        { type: 'whitespace', value: '   ' }
    ];

    for (const input of invalidInputs) {
        try {
            await client.getAppStoreVersion(input.value);
            console.log(`  ⚠️ ${input.type}: No error thrown (unexpected!)`);

        } catch (error) {
            console.log(`  ✅ ${input.type}: Properly rejected - ${error.message.substring(0, 50)}...`);
        }
    }

    console.log('\n3️⃣ Testing Network Error Scenarios:');

    // Create client with very short timeout to simulate network issues
    const timeoutClient = new NodeMaw({ timeout: 1 }); // 1ms timeout

    try {
        await timeoutClient.getAppStoreVersion('com.apple.calculator');
        console.log('  ⚠️ Timeout test: No error thrown (unexpected!)');

    } catch (error) {
        if (error instanceof NetworkError) {
            console.log('  ✅ NetworkError caught:', error.message.substring(0, 60) + '...');
            console.log(`      Has original error: ${!!error.originalError}`);
        } else {
            console.log('  ⚠️ Different error type:', error.constructor.name);
        }
    }

    console.log('\n4️⃣ Graceful Degradation Strategy:');

    const testApps = [
        'com.apple.calculator',           // Should work
        'com.nonexistent.fake.app',       // Should fail
        'net.whatsapp.WhatsApp',          // Should work
        'com.another.fake.app.xyz'        // Should fail
    ];

    const results = [];

    for (const appId of testApps) {
        try {
            const version = await client.getAppStoreVersion(appId);
            results.push({
                appId,
                status: 'success',
                version: version.version,
                error: null
            });
            console.log(`  ✅ ${appId}: ${version.version}`);

        } catch (error) {
            results.push({
                appId,
                status: 'error',
                version: null,
                error: error.message
            });
            console.log(`  ❌ ${appId}: ${error.message.substring(0, 40)}...`);
        }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`\n  📊 Results: ${successCount}/${results.length} apps found successfully`);

    console.log('\n5️⃣ Retry Mechanism Testing:');

    // Client with custom retry settings
    const retryClient = new NodeMaw({
        retryEnabled: true,
        retryAttempts: 2,
        timeout: 5000
    });

    try {
        console.log('  🔄 Testing with retry enabled...');
        const result = await retryClient.getPlayStoreVersion('com.google.android.calculator');
        console.log(`  ✅ Success with retries: ${result.version}`);

    } catch (error) {
        console.log(`  ❌ Failed even with retries: ${error.message}`);
    }

    console.log('\n6️⃣ Update Checking Error Handling:');

    try {
        // Test update checking with invalid version
        await client.checkAppStoreForUpdates('com.apple.calculator', '');
        console.log('  ⚠️ Empty version: No error thrown (unexpected!)');

    } catch (error) {
        console.log('  ✅ Empty version properly rejected:', error.message);
    }

    try {
        // Test update checking with non-existent app
        await client.checkPlayStoreForUpdates('com.nonexistent.app.xyz', '1.0.0');
        console.log('  ⚠️ Non-existent app: No error thrown (unexpected!)');

    } catch (error) {
        console.log('  ✅ Non-existent app properly rejected:', error.message.substring(0, 50) + '...');
    }

    console.log('\n7️⃣ Error Recovery Patterns:');

    async function safeGetVersion(client, identifier, store = 'auto') {
        const maxRetries = 3;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (store === 'appstore' || (store === 'auto' && identifier.includes('.'))) {
                    return await client.getAppStoreVersion(identifier);
                } else {
                    return await client.getPlayStoreVersion(identifier);
                }

            } catch (error) {
                lastError = error;
                console.log(`    Attempt ${attempt} failed: ${error.message.substring(0, 30)}...`);

                // Don't retry for certain error types
                if (error instanceof AppStoreError && error.statusCode === 404) {
                    break;
                }
                if (error instanceof PlayStoreError && error.message.includes('not found')) {
                    break;
                }

                // Wait before retrying
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }

        throw lastError;
    }

    console.log('  🔄 Testing recovery pattern with real app:');
    try {
        const result = await safeGetVersion(client, 'com.apple.calculator', 'appstore');
        console.log(`  ✅ Recovery successful: ${result.version}`);
    } catch (error) {
        console.log(`  ❌ Recovery failed: ${error.message}`);
    }
}

// Run the example
errorHandlingExample().then(() => {
    console.log('\n✨ Error handling example completed!');
}).catch((error) => {
    console.error('\n💥 Example failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
});