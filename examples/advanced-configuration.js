#!/usr/bin/env node

/**
 * Example: Advanced Configuration with Node-MAW
 * 
 * This example demonstrates advanced configuration options,
 * custom headers, timeouts, retry mechanisms, and performance optimization.
 */

import { NodeMaw, AppStoreClient, PlayStoreClient } from '../dist/index.js';

async function advancedConfigurationExample() {
    console.log('⚙️ Node-MAW Advanced Configuration Example\n');

    // 1. Custom HTTP Configuration
    console.log('1️⃣ Custom HTTP Configuration:');

    const customClient = new NodeMaw({
        timeout: 15000,  // 15 second timeout
        userAgent: 'MyApp/2.0.0 (Custom Node-MAW Client)',
        headers: {
            'X-Custom-Header': 'MyAppData',
            'X-API-Version': '2.0',
            'Accept-Language': 'en-US,en;q=0.9'
        },
        retryEnabled: true,
        retryAttempts: 5
    });

    try {
        const result = await customClient.getAppStoreVersion('com.apple.calculator');
        console.log('  ✅ Custom configuration successful');
        console.log(`  📊 Current config timeout: ${customClient.getConfig().timeout}ms`);
        console.log(`  📊 User agent: ${customClient.getConfig().userAgent}`);

    } catch (error) {
        console.log('  ❌ Custom configuration failed:', error.message);
    }

    console.log('\n2️⃣ Separate Client Configurations:');

    // Different configurations for each store
    const advancedClient = new NodeMaw({
        // Global settings
        timeout: 12000,
        retryEnabled: true,

        // App Store specific settings
        appStore: {
            country: 'us',
            includeMetadata: true,
            timeout: 10000,  // Override global timeout
            userAgent: 'MyApp-iOS/1.0',
            headers: {
                'X-Platform': 'iOS',
                'X-Store': 'AppStore'
            }
        },

        // Play Store specific settings
        playStore: {
            language: 'en',
            country: 'us',
            timeout: 15000,  // Different timeout for Play Store
            userAgent: 'MyApp-Android/1.0',
            headers: {
                'X-Platform': 'Android',
                'X-Store': 'PlayStore'
            },
            retryAttempts: 3
        }
    });

    try {
        console.log('  🍎 App Store with custom config:');
        const appStoreResult = await advancedClient.getAppStoreVersion('com.apple.calculator');
        console.log(`    Version: ${appStoreResult.version}`);

        console.log('  🤖 Play Store with custom config:');
        const playStoreResult = await advancedClient.getPlayStoreVersion('com.google.android.calculator');
        console.log(`    Version: ${playStoreResult.version}`);

    } catch (error) {
        console.log('  ❌ Advanced configuration failed:', error.message);
    }

    console.log('\n3️⃣ Performance Optimization:');

    // High-performance client with optimized settings
    const performanceClient = new NodeMaw({
        timeout: 8000,           // Faster timeout
        retryEnabled: true,      // Enable retries
        retryAttempts: 2,        // But fewer attempts
        headers: {
            'Accept-Encoding': 'gzip, deflate',  // Enable compression
            'Connection': 'keep-alive'            // Reuse connections
        }
    });

    const performanceTestApps = [
        'com.apple.calculator',
        'com.apple.mobiletimer',
        'com.apple.mobilenotes'
    ];

    console.log('  🚀 Performance testing with optimized settings:');
    const startTime = Date.now();

    const performanceResults = await Promise.allSettled(
        performanceTestApps.map(async (bundleId) => {
            const start = Date.now();
            try {
                const result = await performanceClient.getAppStoreVersion(bundleId);
                return {
                    bundleId,
                    success: true,
                    version: result.version,
                    duration: Date.now() - start
                };
            } catch (error) {
                return {
                    bundleId,
                    success: false,
                    error: error.message,
                    duration: Date.now() - start
                };
            }
        })
    );

    const totalDuration = Date.now() - startTime;

    performanceResults.forEach((result, index) => {
        const data = result.value || result.reason;
        if (data.success) {
            console.log(`    ✅ ${data.bundleId}: ${data.version} (${data.duration}ms)`);
        } else {
            console.log(`    ❌ ${data.bundleId}: Error (${data.duration}ms)`);
        }
    });

    console.log(`  📊 Total parallel execution time: ${totalDuration}ms`);

    console.log('\n4️⃣ Dynamic Configuration Updates:');

    const dynamicClient = new NodeMaw({
        timeout: 5000,
        retryAttempts: 1
    });

    console.log('  📊 Initial configuration:');
    let config = dynamicClient.getConfig();
    console.log(`    Timeout: ${config.timeout}ms`);
    console.log(`    Retry attempts: ${config.retryAttempts}`);

    // Update configuration
    console.log('\n  🔄 Updating configuration...');
    dynamicClient.updateConfig({
        timeout: 20000,
        retryAttempts: 4,
        headers: {
            'X-Updated': 'true',
            'X-Timestamp': new Date().toISOString()
        }
    });

    config = dynamicClient.getConfig();
    console.log('  📊 Updated configuration:');
    console.log(`    Timeout: ${config.timeout}ms`);
    console.log(`    Retry attempts: ${config.retryAttempts}`);

    // Test with updated config
    try {
        await dynamicClient.getAppStoreVersion('com.apple.calculator');
        console.log('  ✅ Updated configuration works correctly');
    } catch (error) {
        console.log('  ❌ Updated configuration failed:', error.message);
    }

    console.log('\n5️⃣ Environment-Based Configuration:');

    // Different configurations for different environments
    const environments = {
        development: {
            timeout: 30000,      // Longer timeout for debugging
            retryAttempts: 1,    // Fewer retries to fail fast
            headers: {
                'X-Environment': 'development',
                'X-Debug': 'enabled'
            }
        },

        production: {
            timeout: 10000,      // Reasonable timeout
            retryAttempts: 3,    // Standard retries
            headers: {
                'X-Environment': 'production',
                'X-Cache': 'enabled'
            }
        },

        testing: {
            timeout: 5000,       // Fast timeout for tests
            retryAttempts: 0,    // No retries in tests
            headers: {
                'X-Environment': 'testing',
                'X-Mock': 'disabled'
            }
        }
    };

    const currentEnv = 'development'; // Could be process.env.NODE_ENV

    const envClient = new NodeMaw(environments[currentEnv]);

    console.log(`  🔧 ${currentEnv.toUpperCase()} environment configuration:`);
    const envConfig = envClient.getConfig();
    console.log(`    Timeout: ${envConfig.timeout}ms`);
    console.log(`    Retries: ${envConfig.retryAttempts}`);
    console.log(`    Headers: ${Object.keys(envConfig.headers || {}).length} custom headers`);

    console.log('\n6️⃣ Specialized Client Instances:');

    // High-reliability client for critical operations
    const reliableClient = new AppStoreClient({
        timeout: 30000,
        retryEnabled: true,
        retryAttempts: 5,
        headers: {
            'X-Priority': 'high',
            'X-Reliability': 'critical'
        }
    });

    // Fast client for non-critical operations
    const fastClient = new PlayStoreClient({
        timeout: 3000,
        retryEnabled: false,
        headers: {
            'X-Priority': 'low',
            'X-Speed': 'fast'
        }
    });

    console.log('  🛡️ High-reliability client test:');
    try {
        const reliableResult = await reliableClient.getVersion('com.apple.calculator');
        console.log(`    ✅ Reliable result: ${reliableResult.version}`);
    } catch (error) {
        console.log(`    ❌ Even reliable client failed: ${error.message}`);
    }

    console.log('  ⚡ Fast client test:');
    try {
        const fastResult = await fastClient.getVersion('com.google.android.calculator');
        console.log(`    ✅ Fast result: ${fastResult.version}`);
    } catch (error) {
        console.log(`    ❌ Fast client failed (expected): ${error.message.substring(0, 40)}...`);
    }

    console.log('\n7️⃣ Configuration Best Practices:');

    console.log('  💡 Configuration recommendations:');
    console.log('    • Set appropriate timeouts for your use case');
    console.log('    • Enable retries for production environments');
    console.log('    • Use custom User-Agent to identify your application');
    console.log('    • Consider rate limiting when making many requests');
    console.log('    • Cache results when possible to reduce API calls');
    console.log('    • Monitor performance and adjust timeouts accordingly');
    console.log('    • Use environment-specific configurations');
    console.log('    • Implement circuit breakers for high-volume applications');
}

// Run the example
advancedConfigurationExample().then(() => {
    console.log('\n✨ Advanced configuration example completed!');
}).catch((error) => {
    console.error('\n💥 Example failed:', error.message);
    process.exit(1);
});