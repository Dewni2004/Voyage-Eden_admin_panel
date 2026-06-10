import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const baseTables = ['articles', 'reviews', 'itineraries', 'hotels', 'categories'];
const languages = ['_en', '_de', '_es', '_it'];

async function cleanup() {
  console.log("Starting cleanup...");
  
  for (const baseTable of baseTables) {
    console.log(`\nChecking table: ${baseTable}`);
    
    // 1. Get all IDs from base table
    const { data: baseData, error: baseError } = await supabase.from(baseTable).select('id');
    if (baseError) {
      if (baseError.code === '42P01') {
        console.log(`Table ${baseTable} does not exist. Skipping.`);
        continue;
      }
      console.error(`Error fetching ${baseTable}:`, baseError.message);
      continue;
    }
    
    const baseIds = new Set(baseData.map(item => item.id));
    console.log(`Found ${baseIds.size} valid records in ${baseTable}`);

    // 2. Check each language table
    for (const lang of languages) {
      const langTable = `${baseTable}${lang}`;
      
      const { data: langData, error: langError } = await supabase.from(langTable).select('id');
      if (langError) {
         if (langError.code === '42P01') {
            continue; // Table doesn't exist
         }
         console.error(`Error fetching ${langTable}:`, langError.message);
         continue;
      }
      
      const orphanedIds = langData.filter(item => !baseIds.has(item.id)).map(item => item.id);
      
      if (orphanedIds.length > 0) {
        console.log(`Found ${orphanedIds.length} orphaned records in ${langTable}. Deleting...`);
        
        for (const id of orphanedIds) {
          const { error: deleteError } = await supabase.from(langTable).delete().eq('id', id);
          if (deleteError) {
            console.error(`Failed to delete ${id} from ${langTable}:`, deleteError.message);
          }
        }
        console.log(`Successfully deleted orphaned records from ${langTable}.`);
      } else {
        console.log(`No orphaned records in ${langTable}.`);
      }
    }
  }
  
  console.log("\nCleanup finished!");
}

cleanup();
