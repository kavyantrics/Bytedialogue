#!/usr/bin/env node

/**
 * Helper script to generate UploadThing v7 token format
 * 
 * Usage:
 *   node scripts/generate-uploadthing-token.js
 * 
 * Or if you have old credentials:
 *   node scripts/generate-uploadthing-token.js --apiKey YOUR_SECRET --appId YOUR_APP_ID
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function base64Encode(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}

async function main() {
  console.log('\n🔑 UploadThing v7 Token Generator\n');
  console.log('You have two options:');
  console.log('1. Get token from UploadThing dashboard (RECOMMENDED)');
  console.log('2. Convert old credentials to new format\n');

  const args = process.argv.slice(2);
  
  if (args.includes('--apiKey') && args.includes('--appId')) {
    // Command line mode
    const apiKeyIndex = args.indexOf('--apiKey');
    const appIdIndex = args.indexOf('--appId');
    const apiKey = args[apiKeyIndex + 1];
    const appId = args[appIdIndex + 1];
    const regions = args.includes('--regions') 
      ? args[args.indexOf('--regions') + 1].split(',')
      : ['us-east-1'];

    const tokenObj = { apiKey, appId, regions };
    const token = base64Encode(tokenObj);
    
    console.log('\n✅ Generated token:');
    console.log(token);
    console.log('\n📝 Add this to your .env file:');
    console.log(`UPLOADTHING_TOKEN=${token}\n`);
  } else {
    // Interactive mode
    console.log('Option 1: Get from Dashboard (Easiest)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Go to: https://uploadthing.com/dashboard');
    console.log('2. Navigate to: API Keys');
    console.log('3. Click: "Generate Token" or "Copy Token"');
    console.log('4. Copy the token and add to .env:\n');
    console.log('   UPLOADTHING_TOKEN=your_token_here\n');

    const useOld = await question('Do you want to convert old credentials instead? (y/n): ');
    
    if (useOld.toLowerCase() === 'y') {
      console.log('\nOption 2: Convert Old Credentials');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const apiKey = await question('Enter your UPLOADTHING_SECRET (or API Key): ');
      const appId = await question('Enter your UPLOADTHING_APP_ID: ');
      const regionInput = await question('Enter regions (comma-separated, default: us-east-1): ');
      const regions = regionInput.trim() 
        ? regionInput.split(',').map(r => r.trim())
        : ['us-east-1'];

      const tokenObj = { apiKey, appId, regions };
      const token = base64Encode(tokenObj);
      
      console.log('\n✅ Generated token:');
      console.log(token);
      console.log('\n📝 Add this to your .env file:');
      console.log(`UPLOADTHING_TOKEN=${token}\n`);
    }
  }

  rl.close();
}

main().catch(console.error);

