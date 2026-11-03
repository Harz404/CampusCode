import React, { useRef, useState, useCallback } from "react";
import { Upload, X, File, Image, FileArchive } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
  onFilesChange: (files: File[]) => void;
  className?: string;
  label?: string;
  description?: string;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <Image className="h-4 w-4 text-blue-500" />;
  if (type.includes("zip") || type.includes("archive")) return <FileArchive className="h-4 w-4 text-amber-500" />;
  return <File className="h-4 w-4 text-[var(--muted-foreground)]" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  accept,
  multiple = true,
  maxSize = 50,
  maxFiles = 10,
  onFilesChange,
  className,
  label = "Upload Files",
  description = "Drag & drop files here, or click to browse",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      setError(null);
      const arr = Array.from(incoming);

      const oversized = arr.find((f) => f.size > maxSize * 1024 * 1024);
      if (oversized) {
        setError(`File "${oversized.name}" exceeds ${maxSize}MB limit`);
        return;
      }

      const newFiles = multiple ? [...files, ...arr].slice(0, maxFiles) : arr.slice(0, 1);
      setFiles(newFiles);
      onFilesChange(newFiles);
    },
    [files, maxSize, maxFiles, multiple, onFilesChange]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    processFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          dragActive
            ? "border-[var(--primary)] bg-[var(--primary)]/5"
            : "border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/30"
        )}
      >
        <Upload className={`h-8 w-8 mx-auto mb-3 ${dragActive ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`} />
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">{description}</p>
        <p className="text-[10px] text-[var(--muted-foreground)] mt-2">
          Max {maxSize}MB per file {multiple ? `• Up to ${maxFiles} files` : ""}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => processFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="flex items-center gap-3 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)]">
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{file.name}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                className="p-1 rounded hover:bg-[var(--muted)] transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

