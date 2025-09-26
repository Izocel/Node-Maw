#!/usr/bin/env node

/**
 * Node-MAW Examples Index
 * 
 * This file provides an interactive menu to run different Node-MAW examples.
 * Each example demonstrates specific features and use cases.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const examples = [
    {
        name: 'basic-usage.js',
        title: '📱 Basic Usage',
        description: 'Fetch app versions from both App Store and Play Store'
    },
    {
        name: 'separate-clients.js',
        title: '🏗️ Separate Clients',
        description: 'Use dedicated AppStoreClient and PlayStoreClient with custom configs'
    },
    {
        name: 'update-checking.js',
        title: '🆙 Update Checking',
        description: 'Check for app updates and compare versions'
    },
    {
        name: 'search-functionality.js',
        title: '🔍 Search Functionality',
        description: 'Search for apps on both stores with various options'
    },
    {
        name: 'regional-support.js',
        title: '🌍 Regional Support',
        description: 'Work with different countries, regions, and languages'
    },
    {
        name: 'error-handling.js',
        title: '⚠️ Error Handling',
        description: 'Comprehensive error handling strategies and patterns'
    },
    {
        name: 'advanced-configuration.js',
        title: '⚙️ Advanced Configuration',
        description: 'Custom headers, timeouts, retry mechanisms, and optimization'
    }
];

async function showMenu() {
    console.log('🚀 Node-MAW Examples\n');
    console.log('Choose an example to run:\n');

    examples.forEach((example, index) => {
        console.log(`  ${index + 1}. ${example.title}`);
        console.log(`     ${example.description}\n`);
    });

    console.log('  0. Run all examples\n');

    // In a real interactive scenario, you would use readline
    // For this demo, we'll show how to run each example
    console.log('💡 To run an example manually, use:');
    console.log('   node examples/<example-name>');
    console.log('\n💡 Or run all examples with:');
    console.log('   node examples/index.js all');
    console.log('\n📚 Example files:');

    examples.forEach(example => {
        console.log(`   • examples/${example.name}`);
    });
}

async function runExample(exampleName) {
    const examplePath = join(__dirname, exampleName);

    console.log(`\n🏃 Running ${exampleName}...`);
    console.log('='.repeat(60));

    try {
        const { stdout, stderr } = await execAsync(`node "${examplePath}"`);

        if (stdout) {
            console.log(stdout);
        }

        if (stderr) {
            console.error('STDERR:', stderr);
        }

        console.log('='.repeat(60));
        console.log(`✅ ${exampleName} completed successfully\n`);

    } catch (error) {
        console.log('='.repeat(60));
        console.error(`❌ ${exampleName} failed:`, error.message);
        console.log('');
    }
}

async function runAllExamples() {
    console.log('🔥 Running all Node-MAW examples...\n');

    for (const example of examples) {
        await runExample(example.name);

        // Add a small delay between examples
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('🎉 All examples completed!');
}

async function validateExamples() {
    console.log('🔍 Validating example files...\n');

    const files = await readdir(__dirname);
    const exampleFiles = files.filter(file => file.endsWith('.js') && file !== 'index.js');

    for (const file of exampleFiles) {
        const isListed = examples.some(ex => ex.name === file);
        console.log(`  ${isListed ? '✅' : '⚠️ '} ${file} ${isListed ? '' : '(not in menu)'}`);
    }

    console.log(`\n📊 Found ${exampleFiles.length} example files, ${examples.length} in menu`);
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

if (command === 'all') {
    runAllExamples();
} else if (command === 'validate') {
    validateExamples();
} else if (command && examples.some(ex => ex.name === command)) {
    runExample(command);
} else if (command && examples.some(ex => ex.name === `${command}.js`)) {
    runExample(`${command}.js`);
} else {
    showMenu();
}