import { useCallback, useState, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileUp, FileText, X, CheckCircle2, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PdfUploadProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
}

export function PdfUpload({ onFileSelect, selectedFile }: PdfUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const prevUrlRef = useRef<string | null>(null)

  useEffect(() => {
    // Revoke previous object URL to avoid memory leaks
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)

    if (!selectedFile) {
      setPreviewUrl(null)
      prevUrlRef.current = null
      return
    }
    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
    prevUrlRef.current = url
    return () => {
      URL.revokeObjectURL(url)
      prevUrlRef.current = null
    }
  }, [selectedFile])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
    setIsDragActive(false)
  }, [onFileSelect])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  })

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Agreement PDF
            </CardTitle>
            <CardDescription className="mt-1">Upload the agreement document for LLM extraction</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedFile ? (
          <div className="space-y-3">
            <div
              {...getRootProps()}
              className={cn(
                'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300',
                isDragActive
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300',
                  isDragActive ? 'bg-primary/10 scale-110' : 'bg-muted'
                )}>
                  <FileUp className={cn(
                    'w-8 h-8 transition-colors',
                    isDragActive ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse files
                  </p>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  PDF files only, max 50MB
                </span>
              </div>
            </div>

          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 bg-diff-added rounded-xl animate-fade-in">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onFileSelect(null as unknown as File)
                }}
                className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* PDF preview card */}
            {previewUrl && (
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Document Preview</p>
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title={expanded ? 'Collapse preview' : 'Expand preview'}
                  >
                    {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className={cn(
                  'bg-white rounded-lg border overflow-hidden transition-all duration-300',
                  expanded ? 'h-[600px]' : 'h-64'
                )}>
                  <iframe
                    src={`${previewUrl}#toolbar=0&navpanes=0`}
                    className="w-full h-full"
                    title="PDF Preview"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
