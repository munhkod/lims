export type UserRole = "admin" | "lab_manager" | "analyst" | "client";
export type SampleStatus = "pending" | "in_progress" | "completed" | "approved" | "rejected";
export type AnalysisStatus = "in_progress" | "completed" | "approved" | "rejected";
export type PriorityLevel = "low" | "normal" | "high";
export type EquipmentStatus = "active" | "maintenance" | "retired";
export type FileType = "document" | "image" | "report" | "certificate" | "other";

export interface Organization {
  id: string;
  name: string;
  reg_number: string;
  address?: string;
  phone?: string;
  email?: string;
  contact_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  name: string;
  phone?: string;
  role: UserRole;
  org_id?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface Equipment {
  id: string;
  name: string;
  code: string;
  equipment_type: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  status: EquipmentStatus;
  last_calibrated?: string;
  next_calibration?: string;
  created_at: string;
}

export interface Sample {
  id: string;
  sample_id: string;
  org_id: string;
  sample_type: string;
  analysis_type: string;
  date_received: string;
  date_required?: string;
  status: SampleStatus;
  priority: PriorityLevel;
  assigned_analyst?: string;
  registered_by: string;
  notes?: string;
  temperature?: number;
  quantity?: string;
  created_at: string;
  updated_at: string;
  organization?: Organization;
  analyst?: Profile;
}

export interface Analysis {
  id: string;
  sample_id: string;
  analyst_id: string;
  method: string;
  start_time?: string;
  end_time?: string;
  status: AnalysisStatus;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  reject_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  sample?: Sample;
  analyst?: Profile;
  approver?: Profile;
  result?: Result;
  equipment?: Equipment[];
}

export interface Result {
  id: string;
  analysis_id: string;
  parameter: string;
  value: string;
  unit?: string;
  standard?: string;
  limit_value?: string;
  is_compliant?: boolean;
  remarks?: string;
  created_at: string;
}

export interface LimsFile {
  id: string;
  name: string;
  storage_path: string;
  file_type: FileType;
  mime_type?: string;
  size_bytes?: number;
  sample_id?: string;
  analysis_id?: string;
  uploaded_by: string;
  is_public: boolean;
  tags?: string[];
  created_at: string;
  uploader?: Profile;
}

export interface AuditLog {
  id: string;
  action: string;
  user_id?: string;
  target_id?: string;
  target_type?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
  user?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body?: string;
  type?: string;
  ref_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Omit<Organization, "id" | "created_at" | "updated_at">; Update: Partial<Organization> };
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at" | "updated_at">; Update: Partial<Profile> };
      equipment: { Row: Equipment; Insert: Omit<Equipment, "id" | "created_at">; Update: Partial<Equipment> };
      samples: { Row: Sample; Insert: Omit<Sample, "id" | "created_at" | "updated_at">; Update: Partial<Sample> };
      analyses: { Row: Analysis; Insert: Omit<Analysis, "id" | "created_at" | "updated_at">; Update: Partial<Analysis> };
      results: { Row: Result; Insert: Omit<Result, "id" | "created_at">; Update: Partial<Result> };
      files: { Row: LimsFile; Insert: Omit<LimsFile, "id" | "created_at">; Update: Partial<LimsFile> };
      audit_logs: { Row: AuditLog; Insert: Omit<AuditLog, "id" | "created_at">; Update: never };
      notifications: { Row: Notification; Insert: Omit<Notification, "id" | "created_at">; Update: Partial<Notification> };
    };
  };
}
