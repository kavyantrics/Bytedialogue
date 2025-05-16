'use client'

import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { useToast } from './ui/use-toast'
import { useResizeDetector } from 'react-resize-detector'
import { Button } from './ui/button'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Input } from './ui/input'
import { cn } from '@/lib/utils'

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.mjs'

interface PdfRendererProps {
  url: string
  fileId: string
}

const PdfRenderer = ({ url, fileId }: PdfRendererProps) => {
  const { toast } = useToast()
  const [numPages, setNumPages] = useState<number>()
  const [currPage, setCurrPage] = useState<number>(1)
  const [scale, setScale] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [renderedScale, setRenderedScale] = useState<number | null>(null)
  const isLoading = renderedScale !== scale

  const { width, ref } = useResizeDetector()

  // Cleanup function to handle component unmounting
  useEffect(() => {
    return () => {
      // Reset any pending operations
      setRenderedScale(null)
    }
  }, [])

  const CustomPage = () => {
    return (
      <>
        {isLoading && renderedScale ? (
          <Page
            width={width ? width : 1}
            pageNumber={currPage}
            scale={scale}
            rotate={rotation}
            key={'@' + renderedScale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        ) : null}

        <Page
          className={cn(isLoading ? 'hidden' : '')}
          width={width ? width : 1}
          pageNumber={currPage}
          scale={scale}
          rotate={rotation}
          key={'@' + scale}
          loading={
            <div className="flex justify-center">
              <Loader2 className="my-24 h-6 w-6 animate-spin" />
            </div>
          }
          onRenderSuccess={() => setRenderedScale(scale)}
          onRenderError={(error) => {
            // Only show error toast for non-cancellation errors
            if (!error.message?.includes('cancelled')) {
              console.error('Page render error:', error)
              toast({
                title: 'Error rendering page',
                description: 'Please try again',
                variant: 'destructive',
              })
            }
          }}
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </>
    )
  }

  return (
    <div className="w-full bg-white rounded-md shadow flex flex-col items-center">
      <div className="h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <Button
            disabled={currPage <= 1}
            onClick={() => {
              setCurrPage((prev) => (prev - 1 > 1 ? prev - 1 : 1))
              setRenderedScale(null)
            }}
            variant="ghost"
            aria-label="previous page"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5">
            <Input
              className={cn(
                'w-12 h-8',
                currPage > numPages! ? 'text-red-500' : ''
              )}
              value={currPage}
              onChange={(e) => {
                const rawValue = e.target.value
                const page = Number(rawValue)

                if (!rawValue || isNaN(page)) {
                  setCurrPage(1)
                } else {
                  const clamped = Math.max(1, Math.min(page, numPages!))
                  setCurrPage(clamped)
                }

                setRenderedScale(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setCurrPage(currPage > numPages! ? numPages! : currPage < 1 ? 1 : currPage)
                  setRenderedScale(null)
                }
              }}
            />
            <p className="text-zinc-700 text-sm space-x-1">
              <span>/</span>
              <span>{numPages ?? 'x'}</span>
            </p>
          </div>

          <Button
            disabled={numPages === undefined || currPage === numPages}
            onClick={() => {
              setCurrPage((prev) =>
                prev + 1 > numPages! ? numPages! : prev + 1
              )
              setRenderedScale(null)
            }}
            variant="ghost"
            aria-label="next page"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-x-2">
          <Button
            onClick={() => {
              setScale((prev) => (prev - 0.1 > 0.5 ? prev - 0.1 : 0.5))
              setRenderedScale(null)
            }}
            variant="ghost"
            aria-label="zoom out"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => {
              setScale((prev) => (prev + 0.1 < 2 ? prev + 0.1 : 2))
              setRenderedScale(null)
            }}
            variant="ghost"
            aria-label="zoom in"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => {
              setRotation((prev) => (prev + 90) % 360)
              setRenderedScale(null)
            }}
            variant="ghost"
            aria-label="rotate 90 degrees"
          >
            <ChevronUp className="h-4 w-4 rotate-90" />
          </Button>
        </div>
      </div>

      <div className="flex-1 w-full max-h-screen">
        <div ref={ref}>
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
            <CustomPage />
          </Document>
        </div>
      </div>
    </div>
  )
}

export default PdfRenderer