#!/usr/bin/env node

/**
 * Advanced test runner with proper stop-on-failure functionality
 * This script runs each test file individually and stops on the first failure
 */

import { spawn } from 'child_process';
import { readdir, stat } from 'fs/promises';
import { resolve, join } from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
let stopOnFailure = false;
let verbose = false;
let nodeArgs = ['--test'];
let testPattern = '';

// Process arguments
for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--stop-on-failure') {
        stopOnFailure = true;
    } else if (arg === '--verbose') {
        verbose = true;
        nodeArgs.push('--verbose');
    } else if (arg.startsWith('--reporter=')) {
        nodeArgs.push(arg);
    } else if (arg.startsWith('--')) {
        nodeArgs.push(arg);
    } else {
        testPattern = arg;
    }
}

if (!testPattern) {
    console.error('❌ Please specify a test pattern (e.g., "dist/__tests__/*.test.js")');
    process.exit(1);
}

console.log(`🧪 Running tests with pattern: ${testPattern}`);
console.log(`⚙️  Options: ${stopOnFailure ? 'stop-on-failure' : 'run-all'}${verbose ? ', verbose' : ''}`);

async function findTestFiles(pattern) {
    const parts = pattern.split('/');
    const dir = parts.slice(0, -1).join('/');
    const filePattern = parts[parts.length - 1];

    try {
        const files = await readdir(dir);
        const testFiles = [];

        for (const file of files) {
            // Skip source map files and other non-test files
            if (file.endsWith('.map') || file.endsWith('.d.ts') || !file.endsWith('.js')) {
                continue;
            }

            if (filePattern.includes('*')) {
                const regex = new RegExp(filePattern.replace(/\*/g, '.*'));
                if (regex.test(file)) {
                    testFiles.push(join(dir, file));
                }
            } else if (file === filePattern) {
                testFiles.push(join(dir, file));
            }
        }

        return testFiles;
    } catch (error) {
        return [];
    }
}

async function runTests() {
    try {
        // Find all test files
        const testFiles = await findTestFiles(testPattern);

        if (testFiles.length === 0) {
            console.log('⚠️  No test files found matching pattern:', testPattern);
            process.exit(0);
        }

        console.log(`📁 Found ${testFiles.length} test file(s):`);
        testFiles.forEach((file, index) => {
            console.log(`   ${index + 1}. ${file}`);
        });
        console.log('');

        let totalPassed = 0;
        let totalFailed = 0;
        let totalSkipped = 0;
        const failedFiles = [];

        for (let i = 0; i < testFiles.length; i++) {
            const testFile = testFiles[i];
            console.log(`🏃 Running: ${testFile} (${i + 1}/${testFiles.length})`);

            const result = await runSingleTest(testFile, nodeArgs);

            totalPassed += result.passed;
            totalFailed += result.failed;
            totalSkipped += result.skipped;

            if (result.failed > 0) {
                failedFiles.push(testFile);

                if (stopOnFailure) {
                    console.log('');
                    console.log('🛑 Stopping on first failure as requested');
                    console.log(`❌ Failed file: ${testFile}`);
                    console.log(`📊 Results so far: ${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped`);
                    process.exit(1);
                }
            }

            console.log(`✅ Completed: ${testFile} (${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped)`);
            console.log('');
        }

        // Final results
        console.log('🏁 All tests completed!');
        console.log('');
        console.log('📊 Final Results:');
        console.log(`   ✅ Passed: ${totalPassed}`);
        console.log(`   ❌ Failed: ${totalFailed}`);
        console.log(`   ⏭️  Skipped: ${totalSkipped}`);
        console.log(`   📁 Files: ${testFiles.length}`);

        if (failedFiles.length > 0) {
            console.log('');
            console.log('❌ Files with failures:');
            failedFiles.forEach(file => {
                console.log(`   • ${file}`);
            });
            process.exit(1);
        } else {
            console.log('');
            console.log('🎉 All tests passed successfully!');
            process.exit(0);
        }

    } catch (error) {
        console.error('💥 Test runner error:', error.message);
        process.exit(1);
    }
}

function runSingleTest(testFile, nodeArgs) {
    return new Promise((resolve, reject) => {
        const args = [...nodeArgs, testFile];
        const testProcess = spawn('node', args, {
            stdio: 'pipe',
            cwd: process.cwd(),
            env: { ...process.env, NODE_ENV: 'test' }
        });

        let output = '';
        let errorOutput = '';
        let passed = 0;
        let failed = 0;
        let skipped = 0;

        testProcess.stdout.on('data', (data) => {
            const chunk = data.toString();
            output += chunk;

            if (verbose) {
                process.stdout.write(chunk);
            }

            // Parse test results
            const passedMatches = chunk.match(/✔/g);
            if (passedMatches) {
                passed += passedMatches.length;
            }

            const failedMatches = chunk.match(/✖/g);
            if (failedMatches) {
                failed += failedMatches.length;
            }

            const skippedMatches = chunk.match(/⏭/g) || chunk.match(/skipped/g);
            if (skippedMatches) {
                skipped += skippedMatches.length;
            }
        });

        testProcess.stderr.on('data', (data) => {
            const chunk = data.toString();
            errorOutput += chunk;

            if (verbose || failed > 0) {
                process.stderr.write(chunk);
            }
        });

        testProcess.on('close', (code) => {
            // Try to extract numbers from the output summary if available
            const summaryMatch = output.match(/ℹ tests (\d+)[\s\S]*?ℹ pass (\d+)[\s\S]*?ℹ fail (\d+)[\s\S]*?ℹ skipped (\d+)/);

            if (summaryMatch) {
                const [, total, passedFromSummary, failedFromSummary, skippedFromSummary] = summaryMatch;
                passed = parseInt(passedFromSummary, 10) || passed;
                failed = parseInt(failedFromSummary, 10) || failed;
                skipped = parseInt(skippedFromSummary, 10) || skipped;
            }

            resolve({
                passed: passed || 0,
                failed: code !== 0 ? Math.max(failed, 1) : failed || 0,
                skipped: skipped || 0,
                output,
                errorOutput,
                exitCode: code
            });
        });

        testProcess.on('error', (error) => {
            reject(new Error(`Failed to run test ${testFile}: ${error.message}`));
        });
    });
}

// Handle process signals
process.on('SIGINT', () => {
    console.log('\n🛑 Test runner interrupted');
    process.exit(130);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Test runner terminated');
    process.exit(143);
});

// Run the tests
runTests();