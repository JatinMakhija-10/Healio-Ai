/**
 * Arovia.AI — Supabase Storage Cleanup Script
 * ============================================
 * Analyzes and cleans up storage buckets to free space.
 * 
 * Usage:
 *   npx tsx scripts/clean_storage.ts                    # Analyze only
 *   npx tsx scripts/clean_storage.ts --clean            # Clean files older than 90 days
 *   npx tsx scripts/clean_storage.ts --clean --days=30  # Clean files older than 30 days
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Helper Functions ────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function analyzeBucket(bucketName: string) {
  console.log(`\n📦 Analyzing bucket: ${bucketName}`);
  
  try {
    const { data: files, error } = await supabase
      .storage
      .from(bucketName)
      .list('', {
        limit: 10000,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) {
      console.error(`  ❌ Error: ${error.message}`);
      return null;
    }
    
    if (!files || files.length === 0) {
      console.log(`  ✅ Empty bucket`);
      return { count: 0, totalSize: 0, files: [] };
    }
    
    const totalSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
    
    console.log(`  📊 Files: ${files.length}`);
    console.log(`  💾 Total size: ${formatBytes(totalSize)}`);
    
    // Show largest files
    const sortedBySize = [...files]
      .filter(f => f.metadata?.size)
      .sort((a, b) => (b.metadata?.size || 0) - (a.metadata?.size || 0))
      .slice(0, 5);
    
    if (sortedBySize.length > 0) {
      console.log(`  📈 Top 5 largest files:`);
      sortedBySize.forEach(file => {
        console.log(`     - ${file.name}: ${formatBytes(file.metadata?.size || 0)}`);
      });
    }
    
    // Age analysis
    const now = new Date();
    const ageGroups = {
      '< 7 days': 0,
      '7-30 days': 0,
      '30-90 days': 0,
      '90-180 days': 0,
      '> 180 days': 0,
    };
    
    files.forEach(file => {
      const createdAt = new Date(file.created_at);
      const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff < 7) ageGroups['< 7 days']++;
      else if (daysDiff < 30) ageGroups['7-30 days']++;
      else if (daysDiff < 90) ageGroups['30-90 days']++;
      else if (daysDiff < 180) ageGroups['90-180 days']++;
      else ageGroups['> 180 days']++;
    });
    
    console.log(`  📅 Age distribution:`);
    Object.entries(ageGroups).forEach(([range, count]) => {
      if (count > 0) {
        console.log(`     - ${range}: ${count} files`);
      }
    });
    
    return { count: files.length, totalSize, files };
  } catch (err: any) {
    console.error(`  ❌ Unexpected error: ${err.message}`);
    return null;
  }
}

async function cleanOldFiles(bucketName: string, daysOld: number) {
  console.log(`\n🧹 Cleaning ${bucketName}: Deleting files older than ${daysOld} days...`);
  
  try {
    const { data: files, error: listError } = await supabase
      .storage
      .from(bucketName)
      .list('', { limit: 10000 });
    
    if (listError) {
      console.error(`  ❌ Error listing files: ${listError.message}`);
      return 0;
    }
    
    if (!files || files.length === 0) {
      console.log(`  ℹ️  No files to clean`);
      return 0;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const oldFiles = files.filter(file => {
      const createdAt = new Date(file.created_at);
      return createdAt < cutoffDate;
    });
    
    if (oldFiles.length === 0) {
      console.log(`  ✅ No files older than ${daysOld} days`);
      return 0;
    }
    
    console.log(`  📋 Found ${oldFiles.length} files to delete`);
    
    let deleted = 0;
    let failed = 0;
    let totalSizeFreed = 0;
    
    // Delete in batches of 50
    const batchSize = 50;
    for (let i = 0; i < oldFiles.length; i += batchSize) {
      const batch = oldFiles.slice(i, i + batchSize);
      const fileNames = batch.map(f => f.name);
      
      const { error } = await supabase
        .storage
        .from(bucketName)
        .remove(fileNames);
      
      if (error) {
        console.error(`  ⚠️  Batch ${Math.floor(i / batchSize) + 1} failed: ${error.message}`);
        failed += batch.length;
      } else {
        deleted += batch.length;
        totalSizeFreed += batch.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
        console.log(`  ✓ Deleted ${deleted}/${oldFiles.length} files`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n  ✅ Cleanup complete:`);
    console.log(`     - Deleted: ${deleted} files`);
    console.log(`     - Failed: ${failed} files`);
    console.log(`     - Space freed: ${formatBytes(totalSizeFreed)}`);
    
    return deleted;
  } catch (err: any) {
    console.error(`  ❌ Unexpected error: ${err.message}`);
    return 0;
  }
}

// ─── Main Function ───────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Arovia.AI Storage Cleanup Script                  ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
  
  const buckets = ['chat-attachments', 'wellness-videos'];
  
  // Analyze all buckets
  console.log('📊 STORAGE ANALYSIS\n');
  console.log('═'.repeat(60));
  
  const results: Record<string, any> = {};
  let totalFiles = 0;
  let totalSize = 0;
  
  for (const bucket of buckets) {
    const result = await analyzeBucket(bucket);
    if (result) {
      results[bucket] = result;
      totalFiles += result.count;
      totalSize += result.totalSize;
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`\n📈 TOTAL ACROSS ALL BUCKETS:`);
  console.log(`   Files: ${totalFiles}`);
  console.log(`   Size: ${formatBytes(totalSize)}`);
  
  // Clean if requested
  const shouldClean = process.argv.includes('--clean');
  const daysArg = process.argv.find(arg => arg.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.split('=')[1]) : 90;
  
  if (shouldClean) {
    console.log('\n\n🧹 CLEANUP OPERATION\n');
    console.log('═'.repeat(60));
    
    let totalDeleted = 0;
    for (const bucket of buckets) {
      if (results[bucket]?.count > 0) {
        const deleted = await cleanOldFiles(bucket, days);
        totalDeleted += deleted;
      }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log(`\n✅ CLEANUP SUMMARY:`);
    console.log(`   Total files deleted: ${totalDeleted}`);
    
    if (totalDeleted > 0) {
      console.log('\n📊 Analyzing storage after cleanup...\n');
      console.log('═'.repeat(60));
      
      let newTotalFiles = 0;
      let newTotalSize = 0;
      
      for (const bucket of buckets) {
        const result = await analyzeBucket(bucket);
        if (result) {
          newTotalFiles += result.count;
          newTotalSize += result.totalSize;
        }
      }
      
      console.log('\n' + '═'.repeat(60));
      console.log(`\n🎉 FINAL RESULTS:`);
      console.log(`   Files: ${totalFiles} → ${newTotalFiles} (${totalFiles - newTotalFiles} deleted)`);
      console.log(`   Size: ${formatBytes(totalSize)} → ${formatBytes(newTotalSize)}`);
      console.log(`   Space freed: ${formatBytes(totalSize - newTotalSize)}`);
    }
    
  } else {
    console.log('\n\n💡 NEXT STEPS:\n');
    console.log('To clean up storage, run:');
    console.log(`  npx tsx scripts/clean_storage.ts --clean --days=${days}\n`);
    console.log('This will delete files older than the specified days.');
    console.log('Default is 90 days if --days is not specified.\n');
  }
  
  console.log('\n' + '═'.repeat(60) + '\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
