"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, CheckCircle, AlertCircle, ImageIcon } from "lucide-react"
import { ipfsService } from "@/lib/ipfs"
import Image from "next/image"

interface IPFSUploadProps {
  onUploadComplete?: (ipfsHash: string, ipfsUrl: string) => void
  acceptedFileTypes?: string
  maxFileSize?: number // in MB
  showPreview?: boolean
}

export function IPFSUpload({
  onUploadComplete,
  acceptedFileTypes = "image/*",
  maxFileSize = 10,
  showPreview = true,
}: IPFSUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<{
    hash: string
    url: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Validate file size
    if (selectedFile.size > maxFileSize * 1024 * 1024) {
      setError(`File size must be less than ${maxFileSize}MB`)
      return
    }

    setFile(selectedFile)
    setError(null)
    setUploadResult(null)

    // Create preview for images
    if (showPreview && selectedFile.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setUploading(true)
      setError(null)
      setUploadProgress(0)

      // Simulate progress (IPFS upload doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const hash = await ipfsService.uploadFile(file)
      const url = ipfsService.getIPFSUrl(hash)

      clearInterval(progressInterval)
      setUploadProgress(100)

      setUploadResult({ hash, url })
      onUploadComplete?.(hash, url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setPreview(null)
    setUploadResult(null)
    setError(null)
    setUploadProgress(0)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload to IPFS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!uploadResult ? (
          <>
            <div>
              <Label htmlFor="file-upload">Select File</Label>
              <Input
                id="file-upload"
                type="file"
                accept={acceptedFileTypes}
                onChange={handleFileSelect}
                disabled={uploading}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Max file size: {maxFileSize}MB</p>
            </div>

            {preview && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                <Image src={preview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
              </div>
            )}

            {file && !uploading && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading to IPFS...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleUpload} disabled={!file || uploading} className="flex-1">
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload to IPFS
                  </>
                )}
              </Button>
              {file && (
                <Button variant="outline" onClick={resetUpload} disabled={uploading}>
                  Clear
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>File uploaded successfully to IPFS!</AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div>
                <Label className="text-sm font-medium">IPFS Hash:</Label>
                <div className="p-2 bg-muted rounded font-mono text-sm break-all">{uploadResult.hash}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">IPFS URL:</Label>
                <div className="p-2 bg-muted rounded font-mono text-sm break-all">{uploadResult.url}</div>
              </div>
            </div>

            <Button variant="outline" onClick={resetUpload} className="w-full">
              Upload Another File
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
