export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  description: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export type ContractStatus = "draft" | "active" | "completed" | "cancelled";

export interface Contract {
  id: string;
  projectId: string;
  title: string;
  contractor: string;
  client: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  notes: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: number;
  createdAt: string;
  updatedAt: string;
}
