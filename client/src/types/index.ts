// ============================================================
// CampusCode — TypeScript Type Definitions
// ============================================================

// ── Enums ──────────────────────────────────────────────────

export type UserRole = 'student' | 'client' | 'admin';
export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'archived';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProductStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
export type OrderStatus = 'pending' | 'completed' | 'refunded' | 'disputed';
export type SolutionRequestStatus = 'open' | 'in_progress' | 'completed' | 'closed' | 'cancelled';
export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type ContractStatus = 'created' | 'active' | 'in_review' | 'completed' | 'disputed' | 'cancelled';
export type MilestoneStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'revision_requested';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type NotificationType = 'proposal' | 'contract' | 'payment' | 'review' | 'message' | 'system' | 'match' | 'purchase';
export type StudentLevel = 'beginner' | 'contributor' | 'builder' | 'expert' | 'top_developer';
export type LicenseType = 'MIT' | 'Commercial' | 'Personal Use' | 'Educational' | 'Custom';
export type BudgetRange = '5000-10000' | '10000-25000' | '25000-50000' | '50000+' | 'custom';
export type SolutionType = 'web' | 'mobile' | 'ai_ml' | 'automation' | 'api' | 'data_analytics' | 'desktop' | 'ui_ux' | 'other';

// ── Core Models ────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  studentProfile?: StudentProfile | null;
  clientProfile?: ClientProfile | null;
}

export interface StudentProfile {
  id?: string;
  userId?: string;
  college: string;
  degree: string;
  graduationYear: number;
  skills: string[];
  github?: string;
  linkedin?: string;
  bio: string;
  level: StudentLevel;
  badges: Badge[];
  rating: number;
  reviewCount: number;
  totalSales: number;
  totalEarnings: number;
  completedProjects: number;
  portfolioUrl?: string;
}

export interface ClientProfile {
  id?: string;
  userId?: string;
  organization: string;
  website?: string;
  description: string;
  profileType: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  totalSpent: number;
  projectsPosted: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string | Date;
}

// ── Project Management ─────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  ownerId: string;
  owner?: User;
  technologies: string[];
  category: string;
  progress: number;
  deadline?: string;
  members: ProjectMember[];
  tasks: Task[];
  milestones: ProjectMilestone[];
  githubRepo?: string;
  isPublished: boolean;
  productId?: string;
  contractId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectMember {
  id?: string;
  userId?: string;
  user?: User;
  role: string;
  joinedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  labels: string[];
  assigneeId?: string;
  assignee?: User;
  creatorId?: string;
  dueDate?: string;
  attachments?: string[];
  subtasks?: SubTask[];
  comments?: Comment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  author?: User;
  content: string;
  createdAt: string;
}

export interface ProjectMilestone {
  id?: string;
  title: string;
  description: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
}

// ── Software Marketplace ───────────────────────────────────

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  price: number;
  isFree: boolean;
  status: ProductStatus;
  sellerId: string;
  seller?: User;
  projectId?: string;
  technologies: string[];
  tags: string[];
  features: string[];
  requirements: string[];
  installationGuide?: string;
  documentation?: string;
  version: string;
  changelog?: { version: string; date: string; changes: string[] }[];
  reviews?: ProductReview[];
  license: LicenseType | string;
  includes?: string[];
  qualityScore?: QualityScore;
  demoUrl?: string;
  githubUrl?: string;
  driveUrl?: string;
  downloadUrl?: string;
  screenshots: string[];
  rating: number;
  reviewCount: number;
  salesCount: number;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReview {
  id: string;
  userId: string;
  user?: User;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface QualityScore {
  documentation: number;
  codeQuality: number;
  demoAvailability: number;
  readme: number;
  testing: number;
  overall: number;
}

// ── Solution Request Marketplace ───────────────────────────

export interface SolutionRequest {
  id: string;
  title: string;
  description: string;
  problemStatement: string;
  category: string;
  solutionType: SolutionType | string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: SolutionRequestStatus;
  clientId: string;
  client?: User;
  budgetMin?: number;
  budgetMax?: number;
  isFixedPrice: boolean;
  deadline?: string;
  preferredTechnologies: string[];
  requiredFeatures: string[];
  expectedDeliverables: string[];
  attachments: string[];
  proposals?: Proposal[];
  proposalCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Proposals & Contracts ──────────────────────────────────

export interface Proposal {
  id: string;
  solutionRequestId: string;
  solutionRequest?: SolutionRequest;
  studentId: string;
  student?: User;
  content: string;
  price: number;
  estimatedDelivery: number; // in days
  milestones: ProposalMilestone[];
  technologies: string[];
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalMilestone {
  id?: string;
  title: string;
  description: string;
  amount: number;
  durationDays: number;
  estimatedDays?: number;
}

export interface Contract {
  id: string;
  solutionRequestId: string;
  solutionRequest?: SolutionRequest;
  proposalId: string;
  proposal?: Proposal;
  studentId: string;
  student?: User;
  clientId: string;
  client?: User;
  projectId?: string;
  project?: Project;
  totalAmount: number;
  platformFee: number;
  studentEarnings: number;
  status: ContractStatus;
  startDate: string;
  endDate?: string;
  expectedEndDate?: string;
  milestones: ContractMilestone[];
  reviews?: Review[];
  createdAt: string;
  updatedAt: string;
}

export interface ContractMilestone {
  id?: string;
  title: string;
  description: string;
  amount: number;
  status: MilestoneStatus;
  dueDate?: string;
  completedAt?: string;
  approvedAt?: string;
}

export type ContractMilestoneItem = ContractMilestone;

// ── Reviews & Ratings ──────────────────────────────────────

export interface Review {
  id: string;
  contractId: string;
  reviewerId: string;
  reviewer?: User;
  revieweeId: string;
  reviewee?: User;
  communication: number;
  quality: number;
  delivery: number;
  professionalism: number;
  overall: number;
  content: string;
  isVerified: boolean;
  createdAt: string;
}

// ── Messaging ──────────────────────────────────────────────

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message | null;
  projectId?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  attachmentUrl?: string;
  isRead: boolean;
  createdAt: string;
}

// ── Payments & Transactions ────────────────────────────────

export interface Transaction {
  id: string;
  type: 'payment' | 'payout' | 'refund' | 'commission';
  amount: number;
  status: PaymentStatus;
  userId?: string;
  fromUserId?: string;
  toUserId?: string;
  fromUser?: User;
  toUser?: User;
  orderId?: string;
  contractId?: string;
  milestoneId?: string;
  description: string;
  createdAt: string;
}

export interface Wallet {
  balance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  totalEarned: number;
}

// ── Notifications ──────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// ── Analytics ──────────────────────────────────────────────

export interface DashboardStats {
  activeProjects: number;
  pendingTasks: number;
  totalEarnings: number;
  activeContracts: number;
  totalSales: number;
  profileViews: number;
  proposalAcceptanceRate: number;
  averageRating: number;
}

