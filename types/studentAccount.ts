export type StudentGender =
  | "Male"
  | "Female"
  | "Other"
  | "Prefer not to say";

export interface StudentAccount {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: StudentGender;
  profilePhotoDataUrl?: string;
  mobileNumber: string;
  email: string;
  address: {
    state: string;
    district: string;
    mandal: string;
    villageTown: string;
  };
  securityQuestion: string;
  securityAnswerHash: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  accountStatus: "Active" | "Inactive";
}
