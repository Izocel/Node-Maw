#!/usr/bin/env node

/**
 * Custom test runner with stop-on-failure functionality
 * This script wraps Node.js's built-in test runner to add stop-on-failure capability
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
let stopOnFailure = false;
let nodeArgs = ['--test'];
let testFiles = [];

// Process arguments
for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--stop-on-failure') {
        stopOnFailure = true;
    } else if (arg.startsWith('--')) {
        nodeArgs.push(arg);
    } else {
        testFiles.push(arg);
    }
}

// Add test files to node args
nodeArgs.push(...testFiles);

console.log(`🧪 Running tests${stopOnFailure ? ' (stop on failure)' : ''}...`);
console.log(`📂 Test files: ${testFiles.join(', ')}`);

if (stopOnFailure) {
    // Custom implementation with stop-on-failure
    const testProcess = spawn('node', nodeArgs, {
        stdio: 'pipe',
        cwd: process.cwd(),
        env: process.env
    });

    let hasFailure = false;
    let output = '';

    testProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        process.stdout.write(chunk);

        // Check for failure patterns
        if (chunk.includes('✖') || chunk.includes('failing tests:') || chunk.includes('AssertionError')) {
            hasFailure = true;
        }
    });

    testProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        process.stderr.write(chunk);

        // Check for error patterns
        if (chunk.includes('Error:') || chunk.includes('AssertionError')) {
            hasFailure = true;
        }
    });

    testProcess.on('close', (code) => {
        if (hasFailure && stopOnFailure) {
            console.log('\n❌ Stopping on first failure as requested');
            process.exit(1);
        } else if (code !== 0) {
            console.log('\n❌ Tests failed');
            process.exit(code);
        } else {
            console.log('\n✅ All tests passed');
            process.exit(0);
        }
    });

    testProcess.on('error', (error) => {
        console.error('Failed to start test process:', error);
        process.exit(1);
    });

    // Handle process signals
    process.on('SIGINT', () => {
        testProcess.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
        testProcess.kill('SIGTERM');
    });

} else {
    // Standard test run without stop-on-failure
    const testProcess = spawn('node', nodeArgs, {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: process.env
    });

    testProcess.on('close', (code) => {
        process.exit(code);
    });

    testProcess.on('error', (error) => {
        console.error('Failed to start test process:', error);
        process.exit(1);
    });
}