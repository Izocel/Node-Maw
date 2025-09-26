# Node-MAW Examples

This directory contains comprehensive examples demonstrating various features and use cases of the Node-MAW library.

## Quick Start

### Run the Interactive Menu

```bash
node examples/index.js
```

This will show all available examples with descriptions.

### Run All Examples

```bash
node examples/index.js all
```

This will run all examples sequentially.

### Run a Specific Example

```bash
# Run by filename
node examples/basic-usage.js

# Or through the index
node examples/index.js basic-usage.js
```

## Available Examples

### 📱 [basic-usage.js](./basic-usage.js)

**Fetch app versions from both App Store and Play Store**

Demonstrates the fundamental functionality:

- Getting app versions from App Store and Play Store
- Basic error handling
- Checking if apps exist
- Understanding the basic API structure

### 🏗️ [separate-clients.js](./separate-clients.js)

**Use dedicated AppStoreClient and PlayStoreClient with custom configs**

Shows how to use the separated client architecture:

- Unified client vs. separate clients
- Direct client access for advanced features
- Custom configurations for each store
- Default exported instances
- Configuration management

### 🆙 [update-checking.js](./update-checking.js)

**Check for app updates and compare versions**

Demonstrates the new update checking functionality:

- Comparing current versions with latest store versions
- Understanding update results
- Using both unified client and direct client access
- Version comparison details and analysis

### 🔍 [search-functionality.js](./search-functionality.js)

**Search for apps on both stores with various options**

Covers comprehensive search features:

- Basic App Store and Play Store searches
- Advanced search options
- Regional search differences
- Search result analysis and filtering
- Performance considerations

### 🌍 [regional-support.js](./regional-support.js)

**Work with different countries, regions, and languages**

Explores international functionality:

- App Store regional differences
- Play Store language and country combinations
- Regional app availability testing
- Search results by region
- Dynamic region switching
- Best practices for international apps

### ⚠️ [error-handling.js](./error-handling.js)

**Comprehensive error handling strategies and patterns**

Provides robust error handling patterns:

- Handling non-existent apps
- Input validation errors
- Network error scenarios
- Graceful degradation strategies
- Retry mechanisms
- Error recovery patterns

### ⚙️ [advanced-configuration.js](./advanced-configuration.js)

**Custom headers, timeouts, retry mechanisms, and optimization**

Advanced configuration and optimization:

- Custom HTTP configuration
- Separate client configurations
- Performance optimization techniques
- Dynamic configuration updates
- Environment-based configurations
- Specialized client instances

## Example Structure

Each example follows a consistent structure:

```javascript
#!/usr/bin/env node

/**
 * Example: [Title] with Node-MAW
 *
 * Description of what this example demonstrates.
 */

import { NodeMaw, ... } from '../dist/index.js';

async function exampleFunction() {
    console.log('📱 Example Title\n');

    // Example code with detailed comments
    // Error handling
    // Result analysis
}

// Run the example with error handling
exampleFunction().then(() => {
    console.log('\n✨ Example completed!');
}).catch((error) => {
    console.error('\n💥 Example failed:', error.message);
    process.exit(1);
});
```

## Prerequisites

Before running the examples:

1. **Build the project:**

   ```bash
   npm run build
   ```

2. **Ensure you have internet connectivity** (examples make real API calls)

3. **Install dependencies:**
   ```bash
   npm install
   ```

## Running Examples in Development

If you're developing and want to test changes without building:

```bash
# Build first
npm run build

# Then run examples
node examples/basic-usage.js
```

## Understanding the Output

### Success Indicators

- ✅ Successful operations
- 📱 App Store related operations
- 🤖 Play Store related operations
- 🔍 Search operations
- 🌍 Regional operations
- ⚙️ Configuration operations

### Error Indicators

- ❌ Failed operations
- ⚠️ Expected errors or warnings
- 💥 Unexpected failures

### Information

- 📊 Statistics and analysis
- 💡 Tips and recommendations
- 🎉 Completion messages

## Common Issues

### Build Required

If you see import errors, make sure to build the project first:

```bash
npm run build
```

### Network Timeouts

Some examples may take time due to network requests. This is normal and expected.

### Rate Limiting

If you run examples frequently, you might encounter rate limiting from the APIs. Wait a few minutes and try again.

### Regional Differences

Some apps may not be available in all regions, which is expected behavior.

## Adding New Examples

To add a new example:

1. Create a new `.js` file in the `examples/` directory
2. Follow the consistent structure shown above
3. Add comprehensive comments and error handling
4. Update the `examples` array in `index.js`
5. Test the example thoroughly
6. Update this README

## Best Practices Demonstrated

- **Error Handling**: Every example includes proper error handling
- **Resource Cleanup**: Examples clean up resources appropriately
- **Documentation**: Comprehensive comments explain each step
- **Real-world Usage**: Examples use real app IDs when possible
- **Performance**: Examples demonstrate efficient API usage
- **Flexibility**: Show multiple ways to accomplish tasks

## Support

If you have issues with any examples:

1. Check that you've built the project (`npm run build`)
2. Verify your internet connection
3. Look at the error messages - they're designed to be helpful
4. Check the main README for API documentation
5. Open an issue if you find bugs or have suggestions

---

Happy coding with Node-MAW! 🚀
