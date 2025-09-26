#!/usr/bin/env node

/**
 * Example: Update Checking with Node-MAW
 * 
 * This example demonstrates how to check for app updates on both
 * App Store and Play Store using the new update checking functionality.
 */

import { NodeMaw } from '../dist/index.js';

const client = new NodeMaw();

async function demonstrateUpdateChecking() {
    console.log('🔍 Node-MAW Update Checking Example\n');

    try {
        // Example 1: Check App Store for updates
        console.log('📱 Checking App Store for WhatsApp updates...');
        const appStoreResult = await client.checkAppStoreForUpdates('net.whatsapp.WhatsApp', '2.20.0');

        console.log(`Current Version: ${appStoreResult.currentVersion}`);
        console.log(`Latest Version: ${appStoreResult.latestVersion}`);
        console.log(`Update Available: ${appStoreResult.updateAvailable ? '✅ Yes' : '❌ No'}`);

        if (appStoreResult.updateAvailable) {
            console.log(`📋 Update Details:`, {
                appName: appStoreResult.updateDetails?.appName,
                releaseDate: appStoreResult.updateDetails?.releaseDate
            });
        }

        console.log(''); // Empty line

        // Example 2: Check Play Store for updates
        console.log('🤖 Checking Play Store for WhatsApp updates...');
        const playStoreResult = await client.checkPlayStoreForUpdates('com.whatsapp', '2.20.0');

        console.log(`Current Version: ${playStoreResult.currentVersion}`);
        console.log(`Latest Version: ${playStoreResult.latestVersion}`);
        console.log(`Update Available: ${playStoreResult.updateAvailable ? '✅ Yes' : '❌ No'}`);

        if (playStoreResult.updateAvailable) {
            console.log(`📋 Update Details:`, {
                appName: playStoreResult.updateDetails?.appName,
                releaseDate: playStoreResult.updateDetails?.releaseDate
            });
        }

        console.log(''); // Empty line

        // Example 3: Using direct client access
        console.log('🔧 Using direct client access...');
        const directAppStoreResult = await client.appStore.checkForUpdates('net.whatsapp.WhatsApp', '1.0.0');
        console.log(`Direct App Store check - Update available: ${directAppStoreResult.updateAvailable ? '✅ Yes' : '❌ No'}`);

        const directPlayStoreResult = await client.playStore.checkForUpdates('com.whatsapp', '1.0.0');
        console.log(`Direct Play Store check - Update available: ${directPlayStoreResult.updateAvailable ? '✅ Yes' : '❌ No'}`);

        console.log(''); // Empty line

        // Example 4: Version comparison details
        console.log('📊 Version Comparison Analysis:');
        console.log(`App Store comparison result: ${appStoreResult.versionComparison}`);
        console.log(`Play Store comparison result: ${playStoreResult.versionComparison}`);
        console.log('  • Negative value = Current version is older');
        console.log('  • Zero = Versions are equal');
        console.log('  • Positive value = Current version is newer');

    } catch (error) {
        console.error('❌ Error during update checking:', error.message);

        if (error.bundleId || error.packageName) {
            console.error(`App identifier: ${error.bundleId || error.packageName}`);
        }
    }
}

// Run the example
demonstrateUpdateChecking().then(() => {
    console.log('\n✨ Update checking demo completed!');
}).catch((error) => {
    console.error('\n💥 Demo failed:', error.message);
    process.exit(1);
});