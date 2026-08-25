# Supabase Storage Diagnosis & Optimization

## 🔍 Current Storage Analysis

Based on code analysis, your Supabase storage has:

### **Storage Buckets:**
1. **`chat-attachments`** (public) - For chat message files (images, PDFs, docs)
2. **`wellness-videos`** (assumed) - For doctor-uploaded wellness videos

### **Database Tables with Embeddings:**
- `ayurvedic_knowledge_embeddings` - Ayurvedic books (processed from PDFs, PDFs NOT stored)
- `ayurvedic_embeddings` - Herb knowledge
- `boericke_embeddings` - Homeopathic remedies
- `home_remedy_embeddings` - Home remedies
- `clinical_cases` - Patient case embeddings (768-dim)

## ❌ What's NOT Causing Storage Issues

Your ingestion scripts (`ingest_books.ts`, `ingest_ayurveda.ts`) **do NOT upload PDFs to Supabase**:
- PDFs are downloaded to `data/ayurveda/raw/` locally
- Scripts extract text, chunk it, and embed it
- **Only embeddings** go to Supabase database (not storage buckets)

## ✅ What IS Consuming Storage

Based on the code, storage is likely full from:

### **1. Chat Attachments (`chat-attachments` bucket)**
- Users uploading images, PDFs, documents in chat
- No size limits or cleanup policies visible
- Files accumulate over time

### **2. Wellness Videos (`wellness-videos` bucket)**
- Doctors uploading video content + thumbnails
- Video files are large (can be 50-500 MB each)
- Code from `src/app/doctor/videos/page.tsx` uploads:
  - Video files
  - Thumbnail images
- No compression or size validation

### **3. Database Size (Tables, not storage)**
- Large embedding tables might contribute to database quota (separate from storage)
- But this is in the database size limit, not storage bucket limit

---

## 🎯 Solution: Clean Up Storage Buckets

### **Step 1: Check Current Storage Usage**

Run this SQL in Supabase Dashboard:

```sql
-- Check storage bucket usage
SELECT 
    bucket_id,
    COUNT(*) as file_count,
    pg_size_pretty(SUM(LENGTH(metadata::text))::bigint) as metadata_size,
    pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
GROUP BY bucket_id
ORDER BY SUM((metadata->>'size')::bigint) DESC;

-- Get largest files
SELECT 
    bucket_id,
    name,
    pg_size_pretty((metadata->>'size')::bigint) as size,
    created_at
FROM storage.objects
ORDER BY (metadata->>'size')::bigint DESC
LIMIT 50;
```

### **Step 2: Delete Old/Unused Files**

#### **Option A: Delete old chat attachments**
```sql
-- Delete chat attachments older than 90 days
DELETE FROM storage.objects
WHERE bucket_id = 'chat-attachments'
  AND created_at < NOW() - INTERVAL '90 days';
```

#### **Option B: Delete specific large files**
```sql
-- Find and delete files larger than 10 MB
DELETE FROM storage.objects
WHERE bucket_id = 'wellness-videos'
  AND (metadata->>'size')::bigint > 10485760;  -- 10 MB
```

#### **Option C: Delete orphaned files (no DB reference)**
```sql
-- Chat attachments not referenced in messages table
DELETE FROM storage.objects
WHERE bucket_id = 'chat-attachments'
  AND name NOT IN (
    SELECT unnest(string_to_array(attachments::text, ','))
    FROM messages
    WHERE attachments IS NOT NULL
  );
```

### **Step 3: Vacuum Storage (Reclaim Space)**

After deleting files:

```sql
-- This reclaims the actual storage space
VACUUM FULL storage.objects;
```

---

## 🛡️ Prevent Future Storage Issues

### **1. Add File Size Limits**

Update `backend/.env`:
```env
MAX_UPLOAD_SIZE_MB=5  # Current: 10 MB
```

### **2. Implement Storage Policies**

**Migration: `supabase/migrations/20260607_storage_limits.sql`**
```sql
-- ─── Storage Retention Policy ─────────────────────────────────────────────
-- Auto-delete chat attachments older than 180 days

CREATE OR REPLACE FUNCTION cleanup_old_attachments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM storage.objects
    WHERE bucket_id = 'chat-attachments'
      AND created_at < NOW() - INTERVAL '180 days';
END;
$$;

-- Schedule cleanup (requires pg_cron extension)
-- Run monthly
SELECT cron.schedule(
    'cleanup-old-attachments',
    '0 3 1 * *',  -- 3 AM on 1st of each month
    'SELECT cleanup_old_attachments();'
);
```

### **3. Add Size Validation to Upload Code**

**Update: `src/lib/chat/chatService.ts`**
```typescript
async uploadAttachment(file: File) {
    // Add size check
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
        throw new Error(`File size exceeds ${MAX_SIZE / 1024 / 1024} MB limit`);
    }
    
    const filePath = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

    if (uploadError) throw uploadError;
    return filePath;
}
```

### **4. Compress Videos Before Upload**

**Update: `src/app/doctor/videos/page.tsx`**
```typescript
// Add video compression before upload
async function compressVideo(file: File): Promise<File> {
    // Use ffmpeg.wasm or a backend compression service
    // For now, just validate size
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
    
    if (file.size > MAX_VIDEO_SIZE) {
        throw new Error('Video too large. Please compress to under 50 MB.');
    }
    
    return file;
}
```

### **5. Move Large Files to External Storage**

For wellness videos, consider:

**Option A: Cloudflare R2**
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

async function uploadToR2(file: File) {
    const key = `videos/${Date.now()}_${file.name}`;
    
    await r2.send(new PutObjectCommand({
        Bucket: 'arovia-videos',
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
    }));
    
    return `https://videos.arovia.ai/${key}`;
}
```

**Cost:** $2-5/month for 93 PDFs + videos (much cheaper than Supabase Pro)

---

## 📊 Expected Results

### **Before Cleanup:**
- Storage: 1 GB (full)
- Files: ~100-500 chat attachments + 10-50 videos

### **After Cleanup:**
- Storage: ~200-400 MB
- Files: Recent attachments only + compressed videos

### **With Policies:**
- Auto-cleanup prevents future issues
- Size limits prevent single large uploads
- External storage handles videos

---

## 🚀 Action Plan

### **Immediate (Today):**
1. ✅ Run storage diagnosis SQL queries
2. ✅ Identify largest files/buckets
3. ✅ Delete old chat attachments (>90 days)
4. ✅ Run `VACUUM FULL storage.objects;`

### **This Week:**
5. ✅ Add file size validation to upload endpoints
6. ✅ Implement retention policy migration
7. ✅ Compress existing large videos or move to R2

### **Long-term:**
8. ✅ Set up Cloudflare R2 for video storage
9. ✅ Migrate existing videos to R2
10. ✅ Monitor storage usage weekly

---

## 🔧 Quick Fix Script

**File: `scripts/clean_storage.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeStorage() {
  console.log('📊 Analyzing Supabase storage...\n');
  
  // List all files in chat-attachments
  const { data: chatFiles, error: chatError } = await supabase
    .storage
    .from('chat-attachments')
    .list();
  
  if (chatError) {
    console.error('Error listing chat-attachments:', chatError);
  } else {
    const totalSize = chatFiles.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
    console.log(`chat-attachments: ${chatFiles.length} files, ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  }
  
  // List wellness-videos
  const { data: videoFiles, error: videoError } = await supabase
    .storage
    .from('wellness-videos')
    .list();
  
  if (videoError) {
    console.error('Error listing wellness-videos:', videoError);
  } else {
    const totalSize = videoFiles.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
    console.log(`wellness-videos: ${videoFiles.length} files, ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  }
}

async function cleanOldAttachments(daysOld: number = 90) {
  console.log(`\n🧹 Deleting chat attachments older than ${daysOld} days...`);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const { data: files, error: listError } = await supabase
    .storage
    .from('chat-attachments')
    .list();
  
  if (listError) {
    console.error('Error listing files:', listError);
    return;
  }
  
  const oldFiles = files.filter(file => 
    new Date(file.created_at) < cutoffDate
  );
  
  console.log(`Found ${oldFiles.length} files to delete`);
  
  let deleted = 0;
  for (const file of oldFiles) {
    const { error } = await supabase
      .storage
      .from('chat-attachments')
      .remove([file.name]);
    
    if (!error) {
      deleted++;
      if (deleted % 10 === 0) {
        console.log(`  Deleted ${deleted}/${oldFiles.length}`);
      }
    }
  }
  
  console.log(`✅ Deleted ${deleted} files`);
}

async function main() {
  await analyzeStorage();
  
  const shouldClean = process.argv.includes('--clean');
  if (shouldClean) {
    const days = parseInt(process.argv.find(arg => arg.startsWith('--days='))?.split('=')[1] || '90');
    await cleanOldAttachments(days);
    console.log('\n📊 Storage after cleanup:');
    await analyzeStorage();
  } else {
    console.log('\n💡 Run with --clean flag to delete old files');
    console.log('   Example: npx tsx scripts/clean_storage.ts --clean --days=90');
  }
}

main().catch(console.error);
```

**Usage:**
```bash
# Analyze storage
npx tsx scripts/clean_storage.ts

# Clean files older than 90 days
npx tsx scripts/clean_storage.ts --clean --days=90

# Clean files older than 30 days
npx tsx scripts/clean_storage.ts --clean --days=30
```

---

## ✅ Success Criteria

- [ ] Storage usage < 700 MB (30% buffer)
- [ ] No files older than 180 days
- [ ] All videos < 50 MB or moved to R2
- [ ] Upload size limits enforced
- [ ] Auto-cleanup policy active

**Estimated Storage Reduction:** 40-70%  
**Estimated Time:** 2-3 hours implementation
