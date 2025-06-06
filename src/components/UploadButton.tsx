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

  const { startUpload } = useUploadThing('pdfUploader', {
    onClientUploadComplete: () => {
      toast.success('Upload complete!')
      setIsUploading(false)
      setUploadProgress(0)
    },
    onUploadError: (error: Error) => {
      toast.error(`ERROR! ${error?.message}`)
      setIsUploading(false)
    setUploadProgress(0)
    },
  })

  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
        setIsUploading(true)
      setUploadProgress(0)

      try {
        const res = await startUpload(acceptedFiles)
        if (!res) {
          throw new Error('No response from upload')
        }
        const [fileResponse] = res
        if (!fileResponse) {
          throw new Error('No file response')
        }
        setUploadProgress(100)
      } catch (error) {
        console.error('Upload error:', error)
        toast.error('Upload failed')
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
