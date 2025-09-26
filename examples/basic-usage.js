#!/usr/bin/env node

/**
 * Example: Basic Usage with Node-MAW
 * 
 * This example demonstrates the basic functionality of fetching
 * app versions from both App Store and Play Store.
 */

import { NodeMaw } from '../dist/index.js';

async function basicUsageExample() {
    console.log('📱 Node-MAW Basic Usage Example\n');

    const client = new NodeMaw();

    try {
        // Fetch App Store version
        console.log('🍎 Fetching App Store version...');
        const appStoreVersion = await client.getAppStoreVersion('com.apple.calculator');
        console.log(`App Store Result:`, {
            version: appStoreVersion.version,
            bundleId: appStoreVersion.bundleId,
            releaseDate: appStoreVersion.releaseDate
        });

        console.log(''); // Empty line

        // Fetch Play Store version
        console.log('🤖 Fetching Play Store version...');
        const playStoreVersion = await client.getPlayStoreVersion('com.google.android.calculator');
        console.log(`Play Store Result:`, {
            version: playStoreVersion.version,
            packageName: playStoreVersion.packageName,
            releaseDate: playStoreVersion.releaseDate
        });

        console.log(''); // Empty line

        // Check if apps exist
        console.log('🔍 Checking if apps exist...');
        const appStoreExists = await client.appStore.exists('com.apple.calculator');
        const playStoreExists = await client.playStore.exists('com.google.android.calculator');

        console.log(`App Store exists: ${appStoreExists ? '✅' : '❌'}`);
        console.log(`Play Store exists: ${playStoreExists ? '✅' : '❌'}`);

    } catch (error) {
        console.error('❌ Error:', error.message);

        if (error.bundleId) {
            console.error(`Bundle ID: ${error.bundleId}`);
        }

        if (error.packageName) {
            console.error(`Package Name: ${error.packageName}`);
        }
    }
}

// Run the example
basicUsageExample().then(() => {
    console.log('\n✨ Basic usage example completed!');
}).catch((error) => {
    console.error('\n💥 Example failed:', error.message);
    process.exit(1);
});