#!/usr/bin/env node

/**
 * Example: Separate Clients with Node-MAW
 * 
 * This example demonstrates how to use the separate AppStoreClient
 * and PlayStoreClient classes with custom configurations.
 */

import { NodeMaw, AppStoreClient, PlayStoreClient, appStore, playStore } from '../dist/index.js';

async function separateClientsExample() {
    console.log('🏗️ Node-MAW Separate Clients Example\n');

    // 1. Unified Client (recommended approach)
    console.log('1️⃣ Unified Client with Direct Access:');
    const unifiedClient = new NodeMaw();

    try {
        // Use unified client methods
        const appStoreVersion = await unifiedClient.getAppStoreVersion('com.apple.calculator');
        console.log('✅ App Store (unified):', appStoreVersion.version);

        // Access individual clients for advanced features
        const appExists = await unifiedClient.appStore.exists('com.apple.calculator');
        console.log('✅ App exists check:', appExists);

        const searchResults = await unifiedClient.playStore.search('calculator', { num: 2 });
        console.log('✅ Play Store search:', searchResults.length, 'results found');

    } catch (error) {
        console.log('⚠️ Unified client error:', error.message);
    }

    console.log('\n2️⃣ Dedicated App Store Client:');

    // App Store client with custom configuration
    const customAppStore = new AppStoreClient({
        country: 'ca',  // Canadian App Store
        timeout: 8000,
        includeMetadata: true
    });

    try {
        const canadianApp = await customAppStore.getVersion('com.apple.calculator');
        console.log('✅ Canadian App Store:', canadianApp.version);

        // Search Canadian App Store
        const canadianSearch = await customAppStore.search('weather', 3);
        console.log('✅ Canadian search results:', canadianSearch.length, 'apps');

    } catch (error) {
        console.log('⚠️ Canadian App Store error:', error.message);
    }

    console.log('\n3️⃣ Dedicated Play Store Client:');

    // Play Store client with custom configuration
    const customPlayStore = new PlayStoreClient({
        language: 'es',  // Spanish language
        country: 'mx',   // Mexico
        retryAttempts: 5
    });

    try {
        const mexicanApp = await customPlayStore.getVersion('com.google.android.calculator');
        console.log('✅ Mexican Play Store:', mexicanApp.version);

        // Get full details
        const fullDetails = await customPlayStore.getFullDetails('com.google.android.calculator');
        console.log('✅ Full details available:', !!fullDetails);

    } catch (error) {
        console.log('⚠️ Mexican Play Store error:', error.message);
    }

    console.log('\n4️⃣ Default Exported Instances:');

    try {
        // Using default exported instances (convenient for simple use cases)
        const defaultAppStore = await appStore.getVersion('com.apple.calculator');
        console.log('✅ Default App Store instance:', defaultAppStore.version);

        const defaultPlayStore = await playStore.getVersion('com.google.android.calculator');
        console.log('✅ Default Play Store instance:', defaultPlayStore.version);

    } catch (error) {
        console.log('⚠️ Default instances error:', error.message);
    }

    console.log('\n5️⃣ Configuration Management:');

    // Demonstrate configuration updates
    const configClient = new NodeMaw({
        timeout: 5000,
        appStore: { country: 'gb' },
        playStore: { language: 'fr' }
    });

    console.log('Initial config:', {
        timeout: configClient.getConfig().timeout,
    });

    // Update configuration
    configClient.updateConfig({
        timeout: 12000,
        appStore: { country: 'us' },
        playStore: { language: 'en' }
    });

    console.log('Updated config:', {
        timeout: configClient.getConfig().timeout,
    });
}

// Run the example
separateClientsExample().then(() => {
    console.log('\n✨ Separate clients example completed!');
}).catch((error) => {
    console.error('\n💥 Example failed:', error.message);
    process.exit(1);
});