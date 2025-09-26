#!/usr/bin/env node

/**
 * Example: Search Functionality with Node-MAW
 * 
 * This example demonstrates how to search for apps on both
 * App Store and Play Store with various options.
 */

import { NodeMaw, AppStoreClient, PlayStoreClient } from '../dist/index.js';

async function searchExample() {
    console.log('🔍 Node-MAW Search Functionality Example\n');

    const client = new NodeMaw();

    try {
        // 1. Basic App Store Search
        console.log('🍎 App Store Search:');
        const appStoreResults = await client.appStore.search('calculator', 5);

        console.log(`Found ${appStoreResults.length} calculator apps on App Store:`);
        appStoreResults.forEach((app, index) => {
            console.log(`  ${index + 1}. ${app.appName || 'Unknown'} (${app.version}) - ${app.bundleId}`);
        });

        console.log(''); // Empty line

        // 2. Basic Play Store Search
        console.log('🤖 Play Store Search:');
        const playStoreResults = await client.playStore.search('calculator', {
            num: 5,
            fullDetail: true
        });

        console.log(`Found ${playStoreResults.length} calculator apps on Play Store:`);
        playStoreResults.forEach((app, index) => {
            console.log(`  ${index + 1}. ${app.appName || 'Unknown'} (${app.version}) - ${app.packageName}`);
        });

        console.log(''); // Empty line

        // 3. Advanced Search with Different Terms
        console.log('🎮 Searching for Games:');

        const gameSearches = ['minecraft', 'puzzle', 'racing'];

        for (const term of gameSearches) {
            try {
                const games = await client.appStore.search(term, 3);
                console.log(`  📱 "${term}" - Found ${games.length} apps on App Store`);

                const playGames = await client.playStore.search(term, { num: 3 });
                console.log(`  🤖 "${term}" - Found ${playGames.length} apps on Play Store`);

            } catch (error) {
                console.log(`  ⚠️ Error searching for "${term}": ${error.message}`);
            }
        }

        console.log(''); // Empty line

        // 4. Regional Search Differences
        console.log('🌍 Regional Search Differences:');

        // US App Store
        const usAppStore = new AppStoreClient({ country: 'us' });
        const usResults = await usAppStore.search('banking', 3);
        console.log(`  🇺🇸 US banking apps: ${usResults.length} found`);

        // UK App Store
        const ukAppStore = new AppStoreClient({ country: 'gb' });
        const ukResults = await ukAppStore.search('banking', 3);
        console.log(`  🇬🇧 UK banking apps: ${ukResults.length} found`);

        // Spanish Play Store
        const esPlayStore = new PlayStoreClient({
            language: 'es',
            country: 'es'
        });
        const esResults = await esPlayStore.search('banca', { num: 3 });
        console.log(`  🇪🇸 Spanish banking apps: ${esResults.length} found`);

        console.log(''); // Empty line

        // 5. Search Result Analysis
        console.log('📊 Search Result Analysis:');

        const popularApps = await client.playStore.search('social media', {
            num: 10,
            fullDetail: true
        });

        console.log(`Analyzing ${popularApps.length} social media apps:`);

        const versionsMap = new Map();
        popularApps.forEach(app => {
            if (app.version && app.version !== 'VARY') {
                const versionParts = app.version.split('.').length;
                versionsMap.set(versionParts, (versionsMap.get(versionParts) || 0) + 1);
            }
        });

        console.log('  Version format distribution:');
        versionsMap.forEach((count, parts) => {
            console.log(`    ${parts} parts: ${count} apps`);
        });

        // Check for recent updates (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentUpdates = popularApps.filter(app => {
            if (!app.releaseDate) return false;
            const releaseDate = new Date(app.releaseDate);
            return releaseDate > thirtyDaysAgo;
        });

        console.log(`  Apps updated in last 30 days: ${recentUpdates.length}/${popularApps.length}`);

    } catch (error) {
        console.error('❌ Search error:', error.message);

        if (error.term) {
            console.error(`Search term: ${error.term}`);
        }
    }
}

// Run the example
searchExample().then(() => {
    console.log('\n✨ Search functionality example completed!');
}).catch((error) => {
    console.error('\n💥 Example failed:', error.message);
    process.exit(1);
});