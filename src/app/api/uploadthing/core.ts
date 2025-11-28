import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/lib/db";
import { extractPdfText, processPdfForRAG } from "@/lib/rag";
import { generateSummary } from "@/lib/summarizer";

// Process PDF for RAG in the background
async function processPdfForRAGBackground(fileId: string, fileUrl: string) {
  try {
    console.log(`[RAG_BACKGROUND] Starting RAG processing for file: ${fileId}`)
    const pdfText = await extractPdfText(fileUrl)
    
    if (pdfText && pdfText.trim().length > 0) {
      // Process for RAG (create embeddings)
      await processPdfForRAG(fileId, pdfText)
      
      // Generate summary
      const summary = await generateSummary(pdfText)
      await db.file.update({
        where: { id: fileId },
        data: { summary },
      })
      
      console.log(`[RAG_BACKGROUND] Successfully processed file: ${fileId}`)
    }
  } catch (error) {
    console.error(`[RAG_BACKGROUND] Error processing file ${fileId}:`, error)
  }
}

// createUploadthing automatically reads UPLOADTHING_TOKEN from environment variables
// The token should be a base64-encoded JSON: { apiKey: string, appId: string, regions: string[] }
// Get it from: https://uploadthing.com/dashboard -> API Keys -> Generate Token
// If you have old format (sk_live_...), you need to generate a new token from the dashboard
const f = createUploadthing();

export const ourFileRouter = {
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      try {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user || !user.id) {
          console.error("UploadThing middleware: Unauthorized - no user")
          throw new Error("Unauthorized");
        }

        console.log("UploadThing middleware: User authenticated:", user.id)
        return { userId: user.id };
      } catch (error) {
        console.error("UploadThing middleware error:", error)
        throw error
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log("Upload complete for userId:", metadata.userId);
        // Use ufsUrl instead of url (deprecated in v9)
        const fileUrl = file.ufsUrl || file.url;
        console.log("File URL:", fileUrl);

        const createdFile = await db.file.create({
          data: {
            key: file.key,
            name: file.name,
            userId: metadata.userId,
            url: fileUrl,
            uploadStatus: "SUCCESS",
          },
        });

        console.log("File created in database:", createdFile.id)
        
        // Process PDF for RAG in the background (don't await to avoid blocking)
        processPdfForRAGBackground(createdFile.id, fileUrl).catch((error) => {
          console.error("Error processing PDF for RAG:", error)
        })
        
        return { uploadedBy: metadata.userId };
      } catch (error) {
        console.error("Error in onUploadComplete:", error)
        throw error
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
