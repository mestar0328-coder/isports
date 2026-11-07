"use client";
 
import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createAdminApplication } from "@/data/adminApplicationStorage";
import type { AdminApplication } from "@/types/adminApplication";
 
type DevelopmentOtp = { email: string; code: string; expiresAt: number };
 
const inputClass =
  "w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-purple-500";
const labelClass = "mb-2 block text-sm font-medium text-gray-300";
 
async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 120000,
      hash: "SHA-256",
    },
    key,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
 
function makeSalt(): string {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
 
async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Unable to read file."));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}
 
export default function AdminRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<AdminApplication["gender"]>("Male");
  const [profilePhotoDataUrl, setProfilePhotoDataUrl] = useState("");
  const [officialEmail, setOfficialEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState<DevelopmentOtp | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [designation, setDesignation] = useState("");
  const [staffId, setStaffId] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [department, setDepartment] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [proofDataUrl, setProofDataUrl] = useState("");
  const [proofFileName, setProofFileName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedDeclaration, setAcceptedDeclaration] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
 
  function changeEmail(value: string) {
    setOfficialEmail(value);
    setOtp(null);
    setOtpInput("");
    setOtpVerified(false);
    setNotice("");
  }
 
  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setProfilePhotoDataUrl("");
    setError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Profile photo must be JPG, PNG or WEBP.");
      event.target.value = "";
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("Profile photo must be 1 MB or smaller.");
      event.target.value = "";
      return;
    }
    try {
      setProfilePhotoDataUrl(await readFileAsDataUrl(file));
    } catch {
      setError("Unable to read the profile photo.");
    }
  }
 
  async function handleProof(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setProofDataUrl("");
    setProofFileName("");
    setError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      setError("Staff ID proof must be JPG, PNG, WEBP or PDF.");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Staff ID proof must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }
    try {
      setProofDataUrl(await readFileAsDataUrl(file));
      setProofFileName(file.name);
    } catch {
      setError("Unable to read the Staff ID proof.");
    }
  }
 
  function generateOtp() {
    setError("");
    setNotice("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(officialEmail.trim())) {
      setError("Enter a valid official email address first.");
      return;
    }
    const random = new Uint32Array(1);
    window.crypto.getRandomValues(random);
    const code = String(random[0] % 1000000).padStart(6, "0");
    setOtp({
      email: officialEmail.trim().toLowerCase(),
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    setOtpInput("");
    setOtpVerified(false);
    setNotice("Development OTP generated for testing. No email or SMS has been sent.");
  }
 
  function verifyOtp() {
    setError("");
    if (!otp || otp.email !== officialEmail.trim().toLowerCase()) {
      setError("Generate a new OTP for this official email.");
      return;
    }
    if (Date.now() > otp.expiresAt) {
      setOtp(null);
      setOtpVerified(false);
      setError("OTP expired. Generate a new development OTP.");
      return;
    }
    if (otpInput.trim() !== otp.code) {
      setError("Incorrect OTP.");
      return;
    }
    setOtpVerified(true);
    setNotice("Official email OTP verified for this browser session.");
  }
 
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
 
    if (!otpVerified || !otp || otp.email !== officialEmail.trim().toLowerCase()) {
      setError("Verify your official email with the development OTP.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!proofDataUrl || !proofFileName) {
      setError("Upload your Staff ID / Employee ID proof.");
      return;
    }
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }
    if (!acceptedTerms || !acceptedDeclaration) {
      setError("Accept both the Terms & Conditions and the staff declaration.");
      return;
    }
 
    setBusy(true);
    try {
      const salt = makeSalt();
      const passwordHash = await hashPassword(password, salt);
      const application: AdminApplication = {
        id: `admin-app-${window.crypto.randomUUID()}`,
        fullName: fullName.trim(),
        gender,
        ...(profilePhotoDataUrl ? { profilePhotoDataUrl } : {}),
        officialEmail: officialEmail.trim().toLowerCase(),
        mobileNumber,
        designation: designation.trim(),
        staffId: staffId.trim(),
        collegeName: collegeName.trim(),
        department: department.trim(),
        officeAddress: officeAddress.trim(),
        staffIdProofDataUrl: proofDataUrl,
        staffIdProofFileName: proofFileName,
        passwordHash,
        passwordSalt: salt,
        createdAt: new Date().toISOString(),
        status: "Pending",
      };
      const result = createAdminApplication(application);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.push(`/admin/login?applicationSubmitted=1&email=${encodeURIComponent(application.officialEmail)}`);
    } catch {
      setError("Application could not be saved. Check browser storage and Web Crypto support.");
    } finally {
      setBusy(false);
    }
  }
 
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-400">iSports Administration</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Admin Application Registration</h1>
          <p className="mt-3 text-gray-400">Submit your staff details for administrator access review.</p>
        </header>
 
        <div className="mb-6 rounded-xl border border-amber-700 bg-amber-950/40 p-4 text-sm text-amber-200">
          <strong>Local development mode:</strong> This application is saved in this browser only.
          OTP is a testing code, not a real email/SMS. Submission does not grant admin access;
          an authorized administrator must review and approve it in a later phase.
        </div>
 
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-7">
            <h2 className="text-xl font-bold">1. Personal Information</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" id="fullName">
                <input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} autoComplete="name" />
              </Field>
              <Field label="Gender" id="gender">
                <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as AdminApplication["gender"])} className={inputClass}>
                  <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                </select>
              </Field>
              <Field label="Profile Photo (JPG/PNG/WEBP, max 1 MB)" id="profilePhoto">
                <input id="profilePhoto" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} className="block w-full text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-700 file:px-3 file:py-2 file:text-white" />
                {profilePhotoDataUrl && <p className="mt-2 text-xs text-green-400">Profile photo selected.</p>}
              </Field>
            </div>
          </section>
 
          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-7">
            <h2 className="text-xl font-bold">2. Contact & Email Verification</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Official Email" id="officialEmail">
                <input id="officialEmail" type="email" required value={officialEmail} onChange={(e) => changeEmail(e.target.value)} className={inputClass} autoComplete="email" />
              </Field>
              <Field label="Mobile Number" id="mobileNumber">
                <input id="mobileNumber" type="tel" required maxLength={10} value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} className={inputClass} inputMode="numeric" />
              </Field>
              <div className="sm:col-span-2">
                <button type="button" onClick={generateOtp} className="rounded-lg border border-purple-500 px-4 py-2 text-sm font-semibold text-purple-300 hover:bg-purple-500/10">Generate Development OTP</button>
                {otp && <div className="mt-3 rounded-lg border border-gray-700 bg-gray-950 p-3 text-sm">
                  <p className="text-gray-300">Testing OTP: <strong className="tracking-widest text-white">{otp.code}</strong></p>
                  <p className="mt-1 text-xs text-gray-500">Valid for 5 minutes in this page session.</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input aria-label="Enter OTP" inputMode="numeric" maxLength={6} value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter 6-digit OTP" className={inputClass} />
                    <button type="button" onClick={verifyOtp} className="rounded-lg bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500">Verify OTP</button>
                  </div>
                  {otpVerified && <p className="mt-2 text-sm text-green-400">Email verified.</p>}
                </div>}
              </div>
            </div>
          </section>
 
          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-7">
            <h2 className="text-xl font-bold">3. Professional Information</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Designation" id="designation"><input id="designation" required value={designation} onChange={(e) => setDesignation(e.target.value)} className={inputClass} /></Field>
              <Field label="Staff ID / Employee ID" id="staffId"><input id="staffId" required value={staffId} onChange={(e) => setStaffId(e.target.value)} className={inputClass} /></Field>
              <Field label="College Name" id="collegeName"><input id="collegeName" required value={collegeName} onChange={(e) => setCollegeName(e.target.value)} className={inputClass} /></Field>
              <Field label="Department" id="department"><input id="department" required value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} /></Field>
              <div className="sm:col-span-2">
                <Field label="Office Address" id="officeAddress"><textarea id="officeAddress" required rows={3} value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} className={inputClass} /></Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Staff ID / Employee ID Proof (JPG/PNG/WEBP/PDF, max 2 MB)" id="staffProof">
                  <input id="staffProof" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required onChange={handleProof} className="block w-full text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-700 file:px-3 file:py-2 file:text-white" />
                  {proofFileName && <p className="mt-2 text-xs text-green-400">Selected: {proofFileName}</p>}
                </Field>
              </div>
            </div>
          </section>
 
          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-7">
            <h2 className="text-xl font-bold">4. Account Security</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Password (minimum 8 characters)" id="password"><input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} autoComplete="new-password" /></Field>
              <Field label="Confirm Password" id="confirmPassword"><input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} autoComplete="new-password" /></Field>
            </div>
            <div className="mt-5 space-y-3 text-sm text-gray-300">
              <label className="flex items-start gap-3"><input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1" /><span>I have read and accept the Terms & Conditions and iSports administrator usage rules.</span></label>
              <label className="flex items-start gap-3"><input type="checkbox" checked={acceptedDeclaration} onChange={(e) => setAcceptedDeclaration(e.target.checked)} className="mt-1" /><span>I confirm that the staff details and uploaded identity proof are accurate and belong to me.</span></label>
            </div>
          </section>
 
          {error && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</p>}
          {notice && <p role="status" className="rounded-lg border border-blue-800 bg-blue-950/40 px-4 py-3 text-sm text-blue-200">{notice}</p>}
 
          <button type="submit" disabled={busy} className="w-full rounded-lg bg-purple-600 px-5 py-3 font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Submitting Application..." : "Submit Admin Application"}
          </button>
          <p className="text-center text-sm text-gray-400">Already have administrator access? <Link href="/admin/login" className="font-semibold text-purple-300 hover:text-purple-200">Admin Login</Link></p>
        </form>
        <p className="mt-6 text-center"><Link href="/" className="text-sm text-gray-500 hover:text-white">Back to Home</Link></p>
      </div>
    </main>
  );
}
 
function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return <div><label htmlFor={id} className={labelClass}>{label}</label>{children}</div>;
}
