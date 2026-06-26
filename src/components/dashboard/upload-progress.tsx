"use client"

import { useState, useEffect, useRef } from "react"
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"

interface UploadProgressProps {
  isUploading: boolean
  fileName?: string
  onComplete?: () => void
}

export function UploadProgress({ isUploading, fileName, onComplete }: UploadProgressProps) {
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [stage, setStage] = useState<'uploading' | 'processing' | 'complete'>('uploading')
  const [mounted, setMounted] = useState(false)
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const stuckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fix hydration issues by only rendering after component is mounted
  useEffect(() => {
    setMounted(true)
    return () => {
      // Clean up timeouts on unmount
      if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current)
      if (stuckTimeoutRef.current) clearTimeout(stuckTimeoutRef.current)
      if (completionTimeoutRef.current) clearTimeout(completionTimeoutRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Reset progress when isUploading changes
  useEffect(() => {
    if (isUploading) {
      console.log("Upload started, resetting progress")
      setProgress(0)
      setStage('uploading')
      setCompleted(false)
    }
  }, [isUploading])

  // Handle progress updates
  useEffect(() => {
    if (!mounted) return

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (isUploading && !completed) {
      console.log("Starting progress simulation")
      
      // Simulate progress
      intervalRef.current = setInterval(() => {
        setProgress((prevProgress) => {
          console.log(`Current progress: ${prevProgress}%, stage: ${stage}`)
          
          // Uploading phase (0-70%)
          if (prevProgress < 70 && stage === 'uploading') {
            return prevProgress + 5
          } 
          // Processing phase (70-95%)
          else if (prevProgress >= 70 && prevProgress < 95 && stage === 'processing') {
            return prevProgress + 1
          }
          // Hold at 95% until complete
          else if (prevProgress >= 95 && stage === 'processing') {
            return 95
          }
          // Complete (100%)
          else if (stage === 'complete') {
            return 100
          }
          // Switch to processing at 70%
          else if (prevProgress >= 70 && stage === 'uploading') {
            setStage('processing')
            return prevProgress
          }
          return prevProgress
        })
      }, 300)

      // Set a timeout to switch to processing stage after 3 seconds
      processingTimeoutRef.current = setTimeout(() => {
        console.log("Switching to processing stage")
        setStage('processing')
        
        // Set a timeout to detect if we're stuck at processing
        stuckTimeoutRef.current = setTimeout(() => {
          console.log("Upload appears to be stuck in processing, forcing completion")
          setStage('complete')
          setProgress(100)
          setCompleted(true)
          
          // Call onComplete after a short delay
          if (onComplete) {
            completionTimeoutRef.current = setTimeout(onComplete, 500)
          }
        }, 120000) // If stuck in processing for 2 minutes, force completion
      }, 3000)
    } else if (!isUploading && !completed && progress > 0) {
      // Upload was cancelled or failed
      setProgress(0)
      setStage('uploading')
    } else if (completed) {
      // Upload completed
      // No action needed, interval already cleared
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isUploading, completed, mounted, stage, onComplete])

  // Handle completion
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mounted) return

    if (isUploading && progress >= 95 && stage === 'processing') {
      // Set a timeout to complete the upload after reaching 95%
      const timeout = setTimeout(() => {
        console.log("Progress reached 95%, completing upload")
        setStage('complete')
        setProgress(100)
        setCompleted(true)
        
        // Call onComplete after a short delay
        if (onComplete) {
          setTimeout(onComplete, 500)
        }
      }, 2000)

      return () => clearTimeout(timeout)
    }
  }, [isUploading, stage, completed, mounted, onComplete])

  if (!mounted) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center">
          {stage === 'uploading' && <span>Uploading {fileName}...</span>}
          {stage === 'processing' && <span>Extracting ZIP and organizing files...</span>}
          {stage === 'complete' && <span>Upload complete!</span>}
        </div>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      {(stage === 'uploading' || stage === 'processing') && (
        <div className="flex items-center justify-center pt-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-xs text-muted-foreground">
            {stage === 'uploading' ? 'Uploading to server...' : 'Processing files...'}
          </span>
        </div>
      )}
    </div>
  )
} 