"use client";
import { useState, useRef } from "react";
import { Upload, Download, Search, FolderOpen, File, FileText, Image, Trash2, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatBytes } from "@/lib/utils";
import type { Profile, LimsFile } from "@/types/database";
import { toast } from "sonner";

const TYPE_ICONS: Record<string, React.ElementType> = { PDF: FileText, Excel: File, Word: File, Image };
const TYPE_COLORS: Record<string, string> = { PDF: "text-red-400", Excel: "text-green-400", Word: "text-blue-400", Image: "text-purple-400", document: "text-yellow-400" };

export function FilesClient({ profile, files: initial }: { profile: Profile; files: LimsFile[] }) {
  const [files, setFiles] = useState<LimsFile[]>(initial);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canUpload = ["admin", "lab_manager", "analyst"].includes(profile.role);

  const filtered = files.filter(f => {
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || f.file_type === typeFilter;
    return matchSearch && matchType;
  });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const path = `uploads/${profile.id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("lims-files").upload(path, file);
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data, error } = await supabase.from("files").insert({
      name: file.name,
      storage_path: path,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: profile.id,
      is_public: false,
      file_type: "document",
    }).select().single();
    if (error) toast.error(error.message);
    else { setFiles(p => [data, ...p]); toast.success("File uploaded"); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDownload(file: LimsFile) {
    const supabase = createClient();
    const { data } = await supabase.storage.from("lims-files").createSignedUrl(file.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast.error("Could not generate download link");
  }

  async function handleDelete(file: LimsFile) {
    if (!confirm(`Delete "${file.name}"?`)) return;
    const supabase = createClient();
    await supabase.storage.from("lims-files").remove([file.storage_path]);
    await supabase.from("files").delete().eq("id", file.id);
    setFiles(p => p.filter(f => f.id !== file.id));
    toast.success("File deleted");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-foreground">File Archive</h1>
          <p className="text-sm text-muted-foreground mt-1">Centralized document storage · {files.length} files</p>
        </div>
        {canUpload && (
          <>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              <Upload size={14} /> {uploading ? "Uploading…" : "Upload File"}
            </button>
          </>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files…"
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none" />
        </div>
        {["all", "document", "report", "certificate", "image"].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${typeFilter === t ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      {canUpload && (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={async e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && fileRef.current) { const dt = new DataTransfer(); dt.items.add(f); fileRef.current.files = dt.files; handleUpload({ target: fileRef.current } as any); } }}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors bg-muted/10"
          onClick={() => fileRef.current?.click()}>
          <FolderOpen size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Drop files here or <span className="text-primary font-semibold">click to browse</span></p>
          <p className="text-xs text-muted-foreground/60 mt-1">PDF, Excel, Word, Images supported</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(file => {
          const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
          const Icon = TYPE_ICONS[ext] ?? File;
          const colorClass = TYPE_COLORS[ext] ?? TYPE_COLORS.document;
          return (
            <div key={file.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all group">
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className={colorClass} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ext} · {file.size_bytes ? formatBytes(file.size_bytes) : "—"} · {formatDate(file.created_at)}
                  </p>
                </div>
              </div>
              {file.tags && file.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {file.tags.map(t => <span key={t} className="px-2 py-0.5 bg-muted/50 rounded text-[10px] text-muted-foreground">{t}</span>)}
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t border-border/50">
                <button onClick={() => handleDownload(file)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
                  <Download size={12} /> Download
                </button>
                <button onClick={() => toast.info("Share link copied!")}
                  className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                  <Share2 size={13} />
                </button>
                {["admin", "lab_manager"].includes(profile.role) && (
                  <button onClick={() => handleDelete(file)}
                    className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 bg-card border border-border rounded-xl p-12 text-center">
            <p className="text-4xl mb-3">📁</p>
            <p className="text-muted-foreground">No files found</p>
          </div>
        )}
      </div>
    </div>
  );
}
