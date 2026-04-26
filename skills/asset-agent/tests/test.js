/**
 * Asset Skill Test
 */

import { AssetSkill } from '../src/skill.js';

async function test() {
  console.log('\n========================================');
  console.log('Asset Skill Test');
  console.log('========================================\n');

  // Create skill instance
  const skill = new AssetSkill({
    pexelsApiKey: process.env.PEXELS_API_KEY,
    pixabayApiKey: process.env.PIXABAY_API_KEY,
    localLibrary: './workspace/assets'
  });

  // Test providers
  console.log('Available providers:');
  const providers = skill.getProviders();
  console.log(`   Pexels: ${providers.pexels ? 'configured' : 'not configured'}`);
  console.log(`   Pixabay: ${providers.pixabay ? 'configured' : 'not configured'}`);
  console.log(`   Local: ${providers.local ? 'enabled' : 'disabled'}`);

  // Test search
  console.log('\nTesting search...');
  const results = await skill.search('nature', { type: 'image', limit: 3 });
  console.log(`   Found ${results.results.length} results`);
  
  if (results.results.length > 0) {
    const first = results.results[0];
    console.log(`   First result:`);
    console.log(`      Type: ${first.assetType}`);
    console.log(`      ID: ${first.id}`);
    
    if (first.src) {
      console.log(`      URL: ${first.src.medium || first.src.original || 'N/A'}`);
    }
  }

  // Test classification
  console.log('\nTesting classification...');
  const classified = skill.classify({
    id: 123,
    assetType: 'image',
    width: 1920,
    height: 1080,
    tags: 'nature, forest, landscape'
  });
  console.log(`   Category: ${classified.category}`);
  console.log(`   Quality: ${classified.quality?.quality} (${classified.quality?.resolution})`);
  console.log(`   Usage: ${classified.usage?.join(', ')}`);

  // Test library stats
  console.log('\nTesting library stats...');
  const stats = await skill.getLibraryStats();
  console.log(`   Total assets: ${stats.totalAssets}`);
  console.log(`   Videos: ${stats.videos}`);
  console.log(`   Images: ${stats.images}`);
  console.log(`   Size: ${stats.totalSizeFormatted}`);

  console.log('\n========================================\n');
}

test().catch(console.error);
