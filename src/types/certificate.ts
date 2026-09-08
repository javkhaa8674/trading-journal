// src/types/certificate.ts
export type Certificate = {
  id: string;
  user_id: string;
  name: string;
  prop_firm_name: string;
  certificate_type: string;
  challenge_level: string;
  certificate_url?: string | null;
  created_at: string;
  updated_at: string;
};

export const CERTIFICATE_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "rapid", label: "Rapid" },
  { value: "elite", label: "Elite" },
  { value: "high_stakes", label: "High Stakes" },
  { value: "bootcamp", label: "Bootcamp" },
  { value: "aggressive", label: "Aggressive" },
  { value: "royal", label: "Royal" },
];

export const CHALLENGE_LEVELS = [
  { value: "phase_1", label: "Phase 1" },
  { value: "phase_2", label: "Phase 2" },
  { value: "phase_3", label: "Phase 3" },
  { value: "verification", label: "Verification" },
  { value: "level_1", label: "Level 1" },
  { value: "level_2", label: "Level 2" },
  { value: "level_3", label: "Level 3" },
  { value: "level_4", label: "Level 4" },
  { value: "level_5", label: "Level 5" },
];
