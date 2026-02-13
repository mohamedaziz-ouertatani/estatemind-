import { PrismaClient } from "@prisma/client";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function importAllScrapedFiles(directoryPath: string) {
  console.log(`📂 Scanning directory: ${directoryPath}\n`);

  try {
    const files = readdirSync(directoryPath)
      .filter((file) => file.endsWith(".json"))
      .map((file) => join(directoryPath, file))
      .filter((file) => statSync(file).isFile());

    console.log(`Found ${files.length} JSON files to import:\n`);
    files.forEach((file) => console.log(`  - ${file}`));
    console.log("");

    for (const file of files) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Processing: ${file}`);
      console.log("=".repeat(60) + "\n");

      try {
        execSync(`ts-node scripts/import-scraped-data.ts "${file}"`, {
          stdio: "inherit",
        });
      } catch (error) {
        console.error(`❌ Failed to import ${file}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL FILES PROCESSED");
    console.log("=".repeat(60));
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(
    "❌ Usage: ts-node scripts/import-all-scraped.ts <directory-path>",
  );
  console.error(
    "Example: ts-node scripts/import-all-scraped.ts scrapers/data/bronze",
  );
  process.exit(1);
}

const directoryPath = args[0];

importAllScrapedFiles(directoryPath)
  .then(() => {
    console.log("\n✅ All imports completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Batch import failed:", error);
    process.exit(1);
  });
