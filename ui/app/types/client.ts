export type InteractionType = 'Meeting' | 'Call' | 'Email' | 'Follow-up' | 'Review';
export type InteractionStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export interface ActionItem {
  text: string;
  owner?: string;
  dueDate?: string;
  status?: string;
}

export interface ClientInteraction {
  id: string;
  clientName: string;
  contactPerson: string;
  interactionType: InteractionType;
  date: string;
  notes: string;
  actionItems: string | ActionItem[];
  status: InteractionStatus;
  createdAt: string;
}

export interface ClientInfo {
  id: string;
  name: string;
  primaryContact?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
