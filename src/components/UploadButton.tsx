'use client'

import { useState } from 'react'
import { useUploadThing } from '@/lib/uploadthing'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Cloud, File, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { Progress } from './ui/progress'

export default function UploadButton() {
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const router = useRouter()

  const { startUpload, isUploading: uploadThingUploading } = useUploadThing('pdfUploader', {
    onClientUploadComplete: (res) => {
      console.log('Upload complete:', res)
      toast.success('Upload complete!')
      setIsUploading(false)
      setUploadProgress(0)
      router.refresh()
    },
    onUploadError: (error: Error) => {
      console.error('Upload error:', error)
      toast.error(`Upload failed: ${error?.message || 'Unknown error'}`)
      setIsUploading(false)
      setUploadProgress(0)
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress)
    },
  })

  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (!acceptedFiles || acceptedFiles.length === 0) {
        toast.error('No files selected')
        return
      }

      setIsUploading(true)
      setUploadProgress(0)

      try {
        console.log('Starting upload for files:', acceptedFiles.map(f => f.name))
        
        // Check if user is authenticated by verifying the upload route
        const uploadRes = await startUpload(acceptedFiles)
        
        // startUpload can return null if the upload fails silently
        // The onUploadError callback should handle errors, but we check here too
        if (!uploadRes) {
          console.error('startUpload returned null - this usually means authentication failed or UploadThing route is not accessible')
          throw new Error('Upload failed: No response from server. If you see "Invalid token" errors, your UPLOADTHING_TOKEN format is incorrect. UploadThing v7 requires a base64-encoded JSON token. Get a new token from https://uploadthing.com/dashboard -> API Keys. See UPLOADTHING_TOKEN_FIX.md for details.')
        }
        
        const [fileResponse] = uploadRes
        if (!fileResponse) {
          throw new Error('Upload completed but no file data received')
        }
        
        console.log('Upload successful:', fileResponse)
        setUploadProgress(100)
        // Note: onClientUploadComplete will handle the rest (toast, refresh, etc.)
      } catch (error) {
        console.error('Upload error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        toast.error(`Upload failed: ${errorMessage}`)
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
  })

  return (
    <div {...getRootProps()} className="w-full">
            <label
        htmlFor="dropzone-file"
        className="flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Cloud className="h-6 w-6 text-zinc-500 mb-2" />
          <p className="mb-2 text-sm text-zinc-700">
            <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
          <p className="text-xs text-zinc-500">PDF (up to 4MB)</p>
              </div>

              {acceptedFiles && acceptedFiles[0] ? (
          <div className="max-w-xs bg-white flex items-center rounded-md overflow-hidden outline outline-[1px] outline-zinc-200 divide-x divide-zinc-200">
            <div className="px-3 py-2 h-full grid place-items-center">
              <File className="h-4 w-4 text-blue-500" />
                  </div>
            <div className="px-3 py-2 h-full text-sm truncate">
                    {acceptedFiles[0].name}
                  </div>
                </div>
              ) : null}

              {isUploading ? (
          <div className="w-full mt-4 max-w-xs mx-auto">
                  <Progress
              indicatorColor={uploadProgress === 100 ? 'bg-green-500' : ''}
                    value={uploadProgress}
              className="h-1 w-full bg-zinc-200"
                  />
                  {uploadProgress === 100 ? (
              <div className="flex gap-1 items-center justify-center text-sm text-zinc-700 text-center pt-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing...
                    </div>
                  ) : null}
                </div>
              ) : null}

              <input
                {...getInputProps()}
          type="file"
          id="dropzone-file"
          className="hidden"
              />
            </label>
          </div>
  )
}
