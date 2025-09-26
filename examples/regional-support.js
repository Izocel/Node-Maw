#!/usr/bin/env node

/**
 * Example: Regional and Multi-Language Support with Node-MAW
 * 
 * This example demonstrates how to work with different countries,
 * regions, and languages for both App Store and Play Store.
 */

import { AppStoreClient, PlayStoreClient, NodeMaw } from '../dist/index.js';

async function regionalExample() {
    console.log('🌍 Node-MAW Regional & Multi-Language Example\n');

    // 1. App Store Regional Differences
    console.log('1️⃣ App Store Regional Differences:');

    const regions = [
        { code: 'us', name: '🇺🇸 United States' },
        { code: 'ca', name: '🇨🇦 Canada' },
        { code: 'gb', name: '🇬🇧 United Kingdom' },
        { code: 'de', name: '🇩🇪 Germany' },
        { code: 'jp', name: '🇯🇵 Japan' },
        { code: 'au', name: '🇦🇺 Australia' }
    ];

    const testBundleId = 'com.apple.calculator';

    for (const region of regions) {
        try {
            const client = new AppStoreClient({
                country: region.code,
                timeout: 8000
            });

            const result = await client.getVersion(testBundleId);
            console.log(`  ${region.name}: ${result.version} (${result.releaseDate?.split('T')[0]})`);

        } catch (error) {
            console.log(`  ${region.name}: ❌ ${error.message.substring(0, 40)}...`);
        }
    }

    console.log('\n2️⃣ Play Store Language & Country Combinations:');

    const playStoreConfigs = [
        { lang: 'en', country: 'us', name: '🇺🇸 English (US)' },
        { lang: 'es', country: 'es', name: '🇪🇸 Spanish (Spain)' },
        { lang: 'es', country: 'mx', name: '🇲🇽 Spanish (Mexico)' },
        { lang: 'fr', country: 'fr', name: '🇫🇷 French (France)' },
        { lang: 'de', country: 'de', name: '🇩🇪 German (Germany)' },
        { lang: 'pt', country: 'br', name: '🇧🇷 Portuguese (Brazil)' }
    ];

    const testPackageName = 'com.google.android.calculator';

    for (const config of playStoreConfigs) {
        try {
            const client = new PlayStoreClient({
                language: config.lang,
                country: config.country,
                timeout: 10000
            });

            const result = await client.getVersion(testPackageName);
            console.log(`  ${config.name}: ${result.version}`);

        } catch (error) {
            console.log(`  ${config.name}: ❌ ${error.message.substring(0, 40)}...`);
        }
    }

    console.log('\n3️⃣ Regional App Availability:');

    // Test apps that might have regional restrictions
    const regionalApps = [
        { bundleId: 'com.apple.podcasts', name: 'Apple Podcasts' },
        { bundleId: 'com.apple.news', name: 'Apple News' },
        { bundleId: 'com.apple.tv', name: 'Apple TV' }
    ];

    const testRegions = ['us', 'gb', 'jp', 'de'];

    for (const app of regionalApps) {
        console.log(`\n  📱 Testing ${app.name} availability:`);

        for (const regionCode of testRegions) {
            try {
                const client = new AppStoreClient({ country: regionCode });
                const exists = await client.exists(app.bundleId);
                const flag = regionCode === 'us' ? '🇺🇸' :
                    regionCode === 'gb' ? '🇬🇧' :
                        regionCode === 'jp' ? '🇯🇵' : '🇩🇪';

                console.log(`    ${flag} ${regionCode.toUpperCase()}: ${exists ? '✅ Available' : '❌ Not available'}`);

            } catch (error) {
                console.log(`    ${regionCode.toUpperCase()}: ⚠️ Error checking availability`);
            }
        }
    }

    console.log('\n4️⃣ Search Results by Region:');

    const searchTerm = 'weather';
    const searchRegions = [
        { code: 'us', name: '🇺🇸 US' },
        { code: 'gb', name: '🇬🇧 UK' },
        { code: 'de', name: '🇩🇪 Germany' }
    ];

    console.log(`  Searching for "${searchTerm}" apps:`);

    // App Store search by region
    console.log('\n    App Store Results:');
    for (const region of searchRegions) {
        try {
            const client = new AppStoreClient({ country: region.code });
            const results = await client.search(searchTerm, 3);

            console.log(`    ${region.name}: ${results.length} apps found`);
            results.forEach((app, index) => {
                console.log(`      ${index + 1}. ${app.appName || 'Unknown'} (${app.version})`);
            });

        } catch (error) {
            console.log(`    ${region.name}: ❌ Search failed`);
        }
    }

    // Play Store search by language/country
    console.log('\n    Play Store Results:');
    const playSearchConfigs = [
        { lang: 'en', country: 'us', name: '🇺🇸 English (US)' },
        { lang: 'de', country: 'de', name: '🇩🇪 German (Germany)' },
        { lang: 'es', country: 'es', name: '🇪🇸 Spanish (Spain)' }
    ];

    for (const config of playSearchConfigs) {
        try {
            const client = new PlayStoreClient({
                language: config.lang,
                country: config.country
            });
            const results = await client.search(searchTerm, { num: 3 });

            console.log(`    ${config.name}: ${results.length} apps found`);
            results.forEach((app, index) => {
                console.log(`      ${index + 1}. ${app.appName || 'Unknown'} (${app.version})`);
            });

        } catch (error) {
            console.log(`    ${config.name}: ❌ Search failed`);
        }
    }

    console.log('\n5️⃣ Unified Client with Regional Configuration:');

    // Create unified client with regional settings
    const regionalClient = new NodeMaw({
        appStore: {
            country: 'ca'  // Canadian App Store
        },
        playStore: {
            language: 'fr',  // French language
            country: 'ca'    // Canada
        }
    });

    try {
        console.log('  🇨🇦 Canadian App Store version:');
        const appStoreResult = await regionalClient.getAppStoreVersion('com.apple.calculator');
        console.log(`    ${appStoreResult.version} (${appStoreResult.bundleId})`);

        console.log('\n  🇨🇦 French Canadian Play Store version:');
        const playStoreResult = await regionalClient.getPlayStoreVersion('com.google.android.calculator');
        console.log(`    ${playStoreResult.version} (${playStoreResult.packageName})`);

    } catch (error) {
        console.log('  ❌ Regional client error:', error.message);
    }

    console.log('\n6️⃣ Dynamic Region Switching:');

    const dynamicClient = new NodeMaw();
    const switchableRegions = ['us', 'gb', 'de'];

    for (const region of switchableRegions) {
        // Update configuration for different regions
        dynamicClient.updateConfig({
            appStore: { country: region }
        });

        try {
            const result = await dynamicClient.getAppStoreVersion('com.apple.calculator');
            const flag = region === 'us' ? '🇺🇸' : region === 'gb' ? '🇬🇧' : '🇩🇪';
            console.log(`  ${flag} ${region.toUpperCase()}: ${result.version}`);

        } catch (error) {
            console.log(`  ${region.toUpperCase()}: ❌ Failed to switch region`);
        }
    }

    console.log('\n7️⃣ Best Practices for Regional Support:');

    console.log('  💡 Tips for handling regional differences:');
    console.log('    • Always handle availability errors gracefully');
    console.log('    • Cache results to avoid repeated API calls');
    console.log('    • Consider time zones for release date comparisons');
    console.log('    • Some apps may have different bundle IDs per region');
    console.log('    • Language settings affect search result relevance');
    console.log('    • Regional pricing and availability can vary significantly');
}

// Run the example
regionalExample().then(() => {
    console.log('\n✨ Regional & multi-language example completed!');
}).catch((error) => {
    console.error('\n💥 Example failed:', error.message);
    process.exit(1);
});