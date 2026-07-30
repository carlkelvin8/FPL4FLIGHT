const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabase = createClient(
  "https://tgzdztunswklbzbvbuxg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnemR6dHVuc3drbGJ6YnZidXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MDYzNTIsImV4cCI6MjA5OTM4MjM1Mn0.OFhI8gOk2cgErnhvSSzqySd7Y5zdxJPun5k_bzc9DZg"
);

const AIP_DIR = path.join(__dirname, "apps/mobile/assets/aip/AIP_Manual_20260709");
const BUCKET = "aip-docs";

async function uploadAll() {
  // Get all PDFs recursively
  function getPDFs(dir, prefix = "") {
    const results = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...getPDFs(fullPath, prefix ? `${prefix}/${item}` : item));
      } else if (item.endsWith(".pdf")) {
        results.push({ fullPath, key: prefix ? `${prefix}/${item}` : item });
      }
    }
    return results;
  }

  const pdfs = getPDFs(AIP_DIR);
  console.log(`Found ${pdfs.length} PDFs to upload...`);

  let uploaded = 0;
  let failed = 0;
  const manifest = [];

  for (const pdf of pdfs) {
    const fileBuffer = fs.readFileSync(pdf.fullPath);
    const storagePath = pdf.key.replace(/\s+/g, "_").replace(/[[\]()]/g, "");
    
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, { contentType: "application/pdf", upsert: true });

    if (error) {
      console.log(`✗ ${pdf.key}: ${error.message}`);
      failed++;
    } else {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      manifest.push({ name: path.basename(pdf.key, ".pdf"), path: pdf.key, url: urlData.publicUrl });
      uploaded++;
      if (uploaded % 10 === 0) console.log(`  Uploaded ${uploaded}/${pdfs.length}...`);
    }
  }

  console.log(`\n✅ Done! Uploaded: ${uploaded}, Failed: ${failed}`);
  
  // Save manifest
  fs.writeFileSync(
    path.join(__dirname, "apps/mobile/src/features/aip/manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
  console.log("Manifest saved to apps/mobile/src/features/aip/manifest.json");
}

uploadAll();
