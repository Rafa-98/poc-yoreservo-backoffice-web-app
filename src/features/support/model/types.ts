export type SupportTicketType = "FEEDBACK" | "BUG_REPORT";

export type SupportTicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export interface SupportTicketUser {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  role: string;
}

export interface SupportTicketItem {
  id: string;
  ticketCode: string;
  userId: string;
  type: SupportTicketType;
  category: string;
  rating: number | null;
  subject: string | null;
  description: string;
  reservationCode: string | null;
  attachmentUrl: string | null;
  diagnosticInfo: Record<string, unknown> | null;
  adminNotes: string | null;
  lastUpdatedByEmail: string | null;
  lastUpdatedAt: string | null;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  user: SupportTicketUser | null;
}

export interface SupportTicketsKpis {
  totalCount: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  feedbackCount: number;
  bugReportCount: number;
  averageRating: number | null;
}

export interface SupportTicketsData {
  kpis: SupportTicketsKpis;
  items: SupportTicketItem[];
}

