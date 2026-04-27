"use client";

import { AlertCircle, FileArchive, Loader2, Upload, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  abortSubmissionUpload,
  computeChunkPlan,
  initSubmissionUpload,
  SUBMISSION_FILE_LIMITS,
  uploadSubmissionChunk,
  type ChunkUploadPurpose,
} from "@/lib/submissions-api";

export type ZipUploaderMode = "stage" | "daily";

export interface ZipUploaderProps {
  challengeId: string;
  mode: ZipUploaderMode;
  /** Required when mode === "stage" */
  stageId?: string;
  purpose: ChunkUploadPurpose;
  disabled?: boolean;
  className?: string;
  /** Called after init with session id — parent can track for finalize */
  onSessionReady?: (sessionId: string) => void;
  /** Bytes uploaded so far (all chunks done, not yet finalized) */
  onProgress?: (percent: number) => void;
  /** All chunks uploaded successfully; parent must call completeStageUpload / completeDailyUpload */
  onChunksComplete?: (sessionId: string) => void;
  /** Reset internal state after parent finalizes */
  resetKey?: number | string;
}

export function ZipUploader({
  challengeId,
  mode,
  stageId,
  purpose,
  disabled,
  className,
  onSessionReady,
  onProgress,
  onChunksComplete,
  resetKey,
}: ZipUploaderProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [percent, setPercent] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setFile(null);
    setSessionId(null);
    setPercent(0);
    setError(null);
    setUploading(false);
  }, [resetKey, challengeId, stageId, purpose]);

  const validateAndSetFile = (f: File | null) => {
    setError(null);
    if (!f) {
      setFile(null);
      return;
    }
    const lower = f.name.toLowerCase();
    if (!lower.endsWith(".zip")) {
      setError("Please choose a .zip file.");
      return;
    }
    if (f.size > SUBMISSION_FILE_LIMITS.MAX_BYTES) {
      setError("File must be 128 MB or smaller.");
      return;
    }
    if (mode === "stage" && !stageId) {
      setError("Missing stage.");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || uploading) return;
    const f = e.dataTransfer.files?.[0] ?? null;
    validateAndSetFile(f);
  };

  const startUpload = async () => {
    if (!file || disabled) return;
    if (mode === "stage" && !stageId) {
      toast.error("Missing stage");
      return;
    }
    setUploading(true);
    setError(null);
    setPercent(0);
    let activeSessionId: string | null = null;
    try {
      const chunkSize = SUBMISSION_FILE_LIMITS.DEFAULT_CHUNK_BYTES;
      const { totalChunks } = computeChunkPlan(file.size, chunkSize);
      const session = await initSubmissionUpload({
        challengeId,
        purpose,
        stageId: mode === "stage" ? stageId : undefined,
        originalFileName: file.name,
        mimeType: file.type || "application/zip",
        totalSize: file.size,
        chunkSize,
        totalChunks,
      });
      activeSessionId = session.id;
      setSessionId(session.id);
      onSessionReady?.(session.id);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        const prog = await uploadSubmissionChunk(session.id, i, chunk);
        const p = prog.progressPercent;
        setPercent(p);
        onProgress?.(p);
      }
      onChunksComplete?.(session.id);
      toast.success("File uploaded. Complete the form below to submit.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg);
      toast.error(msg);
      if (activeSessionId) {
        try {
          await abortSubmissionUpload(activeSessionId);
        } catch {
          /* ignore */
        }
      }
      setSessionId(null);
    } finally {
      setUploading(false);
    }
  };

  const cancelPick = () => {
    setFile(null);
    setError(null);
    setPercent(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          "rounded-lg border border-dashed border-cs-border bg-muted/20 p-6 text-center transition-colors",
          disabled && "pointer-events-none opacity-50",
          !disabled && "hover:border-cs-primary/50",
        )}
      >
        <FileArchive className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Drag & drop a .zip here, or choose a file (max 128 MB).
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => validateAndSetFile(e.target.files?.[0] ?? null)}
        />
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 size-4" />
            Choose zip
          </Button>
          {file ? (
            <>
              <Button
                type="button"
                size="sm"
                disabled={uploading || disabled}
                onClick={() => void startUpload()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  "Upload file"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={cancelPick}
              >
                <X className="mr-1 size-4" />
                Clear
              </Button>
            </>
          ) : null}
        </div>
        {file ? (
          <p className="mt-3 font-mono text-xs text-cs-heading">
            {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
          </p>
        ) : null}
      </div>
      {uploading || percent > 0 ? (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-cs-primary transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{percent}%</p>
        </div>
      ) : null}
      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
}
