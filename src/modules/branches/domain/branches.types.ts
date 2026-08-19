export interface Branch {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
}

export interface CreateBranchPayload {
  name: string;
  address: string;
}

export interface UpdateBranchPayload {
  name?: string;
  address?: string;
}
