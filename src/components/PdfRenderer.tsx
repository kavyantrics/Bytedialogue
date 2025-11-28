'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { useToast } from './ui/use-toast'
import { useResizeDetector } from 'react-resize-detector'
import { Button } from './ui/button'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.mjs'

interface PdfRendererProps {
  url: string
  fileId: string
}

const PdfRenderer = ({ url, fileId }: PdfRendererProps) => {
  const { toast } = useToast()
  const [numPages, setNumPages] = useState<number>()
  const [scale, setScale] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)

  const { width, ref } = useResizeDetector()

  return (
    <div className="w-full bg-white rounded-md shadow flex flex-col items-center">
      <div className="h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <p className="text-zinc-700 text-sm">
            <span className="font-medium">{numPages ?? '...'}</span>
            <span className="ml-1">pages</span>
          </p>
        </div>

        <div className="space-x-2">
          <Button
            onClick={() => {
              setScale((prev) => (prev - 0.1 > 0.5 ? prev - 0.1 : 0.5))
            }}
            variant="ghost"
            aria-label="zoom out"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => {
              setScale((prev) => (prev + 0.1 < 2 ? prev + 0.1 : 2))
            }}
            variant="ghost"
            aria-label="zoom in"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => {
              setRotation((prev) => (prev + 90) % 360)
            }}
            variant="ghost"
            aria-label="rotate 90 degrees"
          >
            <ChevronUp className="h-4 w-4 rotate-90" />
          </Button>
        </div>
      </div>

      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden">
        <div ref={ref} className="flex flex-col items-center py-4">
          <Document
            loading={
              <div className="flex justify-center">
                <Loader2 className="my-24 h-6 w-6 animate-spin" />
              </div>
            }
            onLoadError={(error) => {
              console.error('PDF Load Error:', error)
              toast({
                title: 'Error loading PDF',
                description: 'Please try again later',
                variant: 'destructive',
              })
            }}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            file={url}
            className="max-h-full"
          >
            {numPages && (
              <div className="space-y-4">
                {new Array(numPages).fill(0).map((_, i) => (
                  <div key={i} className="shadow-sm border border-zinc-200 rounded">
                    <Page
                      width={width ? width : 1}
                      pageNumber={i + 1}
                      scale={scale}
                      rotate={rotation}
                      loading={
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                        </div>
                      }
                      onRenderError={(error) => {
                        // Only show error toast for non-cancellation errors
                        if (!error.message?.includes('cancelled')) {
                          console.error('Page render error:', error)
                        }
                      }}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </div>
                ))}
              </div>
            )}
          </Document>
        </div>
      </div>
    </div>
  )
}

export default PdfRenderer