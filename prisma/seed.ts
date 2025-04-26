// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs'; // Node.js File System module
import path from 'path'; // Node.js Path module

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding tokens from file...`);

  // --- 1. Read the token file ---
  const filePath = path.join(__dirname, 'tokens.txt'); // Assumes tokens.txt is in the same dir as seed.ts
  let tokenCodesFromFile: string[] = [];

  try {
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    tokenCodesFromFile = fileContent
                          .split(/\r?\n/) // Split by newline (handles Windows/Unix endings)
                          .map(line => line.trim()) // Remove leading/trailing whitespace
                          .filter(line => line.length > 0); // Filter out empty lines
    console.log(`Read ${tokenCodesFromFile.length} token codes from ${filePath}`);
  } catch (error) {
     console.error(`Error reading token file at ${filePath}:`, error);
     throw new Error(`Could not read token file.`); // Stop seeding if file fails
  }


  // --- 2. Check for existing tokens to prevent duplicates ---
  const existingTokens = await prisma.token.findMany({
    where: {
      token_code: {
        in: tokenCodesFromFile
      }
    },
    select: { token_code: true }
  });
  const existingTokenCodes = new Set(existingTokens.map(t => t.token_code));
  console.log(`Found ${existingTokenCodes.size} tokens already in the database.`);

  // --- 3. Filter out tokens that already exist ---
  const tokensToCreate = tokenCodesFromFile
                          .filter(code => !existingTokenCodes.has(code))
                          .map(code => ({ // Map to the structure Prisma needs
                            token_code: code,
                            is_valid: true, // Set default validity (adjust if needed)
                            // is_used defaults to false from schema
                          }));

  if (tokensToCreate.length === 0) {
    console.log("No new tokens from the file to add.");
  } else {
    console.log(`Attempting to create ${tokensToCreate.length} new tokens...`);

    // --- 4. Insert new tokens ---
    // Using createMany for potential efficiency if inserting a lot,
    // but it might not return individual created records easily depending on DB/Prisma version.
    // Looping with create might be better for logging each one. Let's loop for clarity.
    let createdCount = 0;
    let failedCount = 0;
    for (const tokenData of tokensToCreate) {
      try {
        await prisma.token.create({
          data: tokenData,
        });
        // console.log(`Created token: ${tokenData.token_code}`); // Can be verbose
        createdCount++;
      } catch (error: any) {
         // Log individual failures but continue if possible
        console.error(`Failed to create token ${tokenData.token_code}: ${error.message || error}`);
        failedCount++;
      }
    }
    console.log(`Successfully created ${createdCount} tokens.`);
    if (failedCount > 0) {
         console.warn(`Failed to create ${failedCount} tokens (check logs above).`);
    }
  }

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1); // Exit with error code if something major failed
  })
  .finally(async () => {
    console.log("Disconnecting Prisma Client...");
    await prisma.$disconnect(); // IMPORTANT: Always disconnect
  });