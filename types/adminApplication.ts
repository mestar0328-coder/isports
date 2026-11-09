export type AdminApplicationStatus = "Pending" | "Approved" | "Rejected";
 
export type AdminApplication = {
  id: string;
  fullName: string;
  gender: "Male" | "Female" | "Other" | "Prefer not to say";
  profilePhotoDataUrl?: string;
  officialEmail: string;
  mobileNumber: string;
  designation: string;
  staffId: string;
  collegeName: string;
  department: string;
  officeAddress: string;
  staffIdProofDataUrl: string;
  staffIdProofFileName: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  status: AdminApplicationStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
};

 