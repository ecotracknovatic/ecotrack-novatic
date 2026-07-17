export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string; // pending | in_progress | completed (plain text, suggested)
  completed_at: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectGoal {
  id: string;
  project_id: string;
  goal_type: "objective" | "outcome";
  description: string;
  is_achieved: boolean;
  created_at: string;
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  activity_date: string;
  status: string; // planned | in_progress | completed | cancelled (plain text)
  created_at: string;
}

export interface ProjectTeamMember {
  id: string;
  project_id: string;
  user_id: string;
  role_on_project: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

export interface ProjectBudgetEntry {
  id: string;
  project_id: string;
  category: string;
  description: string | null;
  amount: number;
  entry_type: "expense" | "income";
  entry_date: string;
  created_at: string;
}

export interface ProjectFundingSource {
  id: string;
  project_id: string;
  source_name: string;
  amount: number;
  received_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  title: string;
  storage_path: string;
  doc_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface ProjectProgress {
  milestoneTotal: number;
  milestoneCompleted: number;
  completionPercentage: number;
  treeCount: number;
  treesAlive: number;
  survivalRate: number | null;
  budgetTotal: number | null;
  budgetSpent: number;
  fundingReceived: number;
}

export const MILESTONE_STATUS_OPTIONS = ["pending", "in_progress", "completed"];
export const ACTIVITY_STATUS_OPTIONS = ["planned", "in_progress", "completed", "cancelled"];
