export type PortingStatus = 
  | 'submitted'
  | 'processing'
  | 'approved'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface PortingRequest {
  id: string;
  userId: string;
  currentNumber: string;
  currentCarrier: string;
  accountNumber: string;
  pin: string;
  authorizedName: string;
  billingAddress: Address;
  status: PortingStatus;
  estimatedCompletion: Date;
  actualCompletion?: Date;
  documents: PortingDocument[];
  statusHistory: PortingStatusUpdate[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PortingDocument {
  id: string;
  type: 'bill' | 'authorization' | 'identification' | 'other';
  filename: string;
  url: string;
  uploadedAt: Date;
}

export interface PortingStatusUpdate {
  status: PortingStatus;
  message: string;
  timestamp: Date;
  updatedBy: string;
}