"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatBytes } from "@/lib/utils";
import toast from "react-hot-toast";

interface FileUploadProps {
  bucket?: string;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
  onUpload?: (path: string, name: string) => void;
  className?: string;
}

export function FileUpload({
  bucket = "lims-files",
  folder = "general",
  accept = "*/*",
  maxSizeMB = 20,
  onUpload,
  className,
}: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<{ name: string; size: number; path: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const uploadFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File must be under ${maxSizeMB}MB`);
      return;
    }
    setUploading(true);
    const path = `${folder}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    setUploading(false);
    if (error) { toast.error(`Upload failed: ${error.message}`); return; }
    setUploaded({ name: file.name, size: file.size, path });
    onUpload?.(path, file.name);
    toast.success("File uploaded successfully");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
          dragging ? "border-teal-400 bg-teal-400/5" : "border-slate-700 hover:border-slate-500 hover:bg-white/[0.02]"
        )}>
        <input ref={inputRef} type="file" accept={accept} className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-3xl">📁</div>
            <p className="text-sm font-medium text-slate-300">Drop file here or click to browse</p>
            <p className="text-xs text-slate-500">Max {maxSizeMB}MB · {accept}</p>
          </div>
        )}
      </div>

      {uploaded && (
        <div className="flex items-center gap-3 p-3 bg-teal-400/5 border border-teal-400/20 rounded-lg">
          <span className="text-xl">✅</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{uploaded.name}</p>
            <p className="text-xs text-slate-500">{formatFileSize(uploaded.size)}</p>
          </div>
          <button onClick={() => setUploaded(null)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
        </div>
      )}
    </div>
  );
}
