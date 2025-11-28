import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/lib/db";

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
        return { uploadedBy: metadata.userId };
      } catch (error) {
        console.error("Error in onUploadComplete:", error)
        throw error
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
