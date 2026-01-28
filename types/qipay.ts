export type QipayDevice = {
  id: string;
  ntagUid: string;
  aesKey: string;
  sunEnabled: boolean;
  lastCounter: number;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  merchantId: string;
  merchant?: {
    id: string;
    name: string;
    code: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type QipayTapLog = {
  id: string;
  ntagUid: string;
  counter: number;
  cmac: string;
  status: "SUCCESS" | "FAILED" | "REPLAYED";
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
};
