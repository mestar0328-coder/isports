"use client";
 
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createStudentAccount } from "@/data/studentAccountStorage";
import type { StudentAccount } from "@/types/studentAccount";
 
const SECURITY_QUESTIONS = [
  "What was the name of your first school?",
  "What is the name of the town where you were born?",
  "What was your childhood nickname?",
  "What is the name of your favourite teacher?",
];
 
type OtpState = {
  email: string;
  code: string;
  expiresAt: number;
};
 
async function hashValue(value: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(value),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
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
 
function createSalt(): string {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
 
export default function StudentRegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<StudentAccount["gender"]>("Male");
  const [profilePhotoDataUrl, setProfilePhotoDataUrl] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otp, setOtp] = useState<OtpState | null>(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [stateName, setStateName] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [villageTown, setVillageTown] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
 
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
 
  function handleEmailChange(value: string) {
    setEmail(value);
    setOtp(null);
    setOtpInput("");
    setOtpVerified(false);
    setNotice("");
  }
 
  async function handlePhotoChange(file?: File) {
    setError("");
    setProfilePhotoDataUrl("");
 
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Profile photo must be JPG, PNG or WEBP.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("Profile photo must be 1 MB or smaller.");
      return;
    }
 
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfilePhotoDataUrl(reader.result);
      } else {
        setError("Unable to read the selected photo.");
      }
    };
    reader.onerror = () => setError("Unable to read the selected photo.");
    reader.readAsDataURL(file);
  }
 
  function generateDevelopmentOtp() {
    setError("");
    setNotice("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address before generating the development OTP.");
      return;
    }
 
    const random = new Uint32Array(1);
    window.crypto.getRandomValues(random);
    const code = String(random[0] % 1000000).padStart(6, "0");
    setOtp({
      email: email.trim().toLowerCase(),
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    setOtpInput("");
    setOtpVerified(false);
    setNotice("Local development OTP generated. It is displayed below for testing only; no email or SMS was sent.");
  }
 
  function verifyDevelopmentOtp() {
    setError("");
    if (!otp || otp.email !== email.trim().toLowerCase()) {
      setError("Generate a new development OTP for this email address.");
      return;
    }
    if (Date.now() > otp.expiresAt) {
      setOtp(null);
      setOtpVerified(false);
      setError("The development OTP has expired. Generate a new one.");
      return;
    }
    if (otpInput.trim() !== otp.code) {
      setError("The OTP does not match.");
      return;
    }
    setOtpVerified(true);
    setNotice("Development OTP verified for this browser session.");
  }
 
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
 
    if (!otpVerified || !otp || otp.email !== email.trim().toLowerCase()) {
      setError("Verify the email using the local development OTP before registering.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError("Enter a valid 10-digit Indian mobile number.");
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
    if (securityAnswer.trim().length < 2) {
      setError("Enter an answer for your security question.");
      return;
    }
    if (!acceptedTerms) {
      setError("Accept the Terms & Conditions to continue.");
      return;
    }
 
    setIsSubmitting(true);
    try {
      const salt = createSalt();
      const [passwordHash, securityAnswerHash] = await Promise.all([
        hashValue(password, salt),
        hashValue(securityAnswer.trim().toLowerCase(), salt),
      ]);
 
      const account: StudentAccount = {
        id: `student-${window.crypto.randomUUID()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        gender,
        ...(profilePhotoDataUrl ? { profilePhotoDataUrl } : {}),
        mobileNumber,
        email: email.trim().toLowerCase(),
        address: {
          state: stateName.trim(),
          district: district.trim(),
          mandal: mandal.trim(),
          villageTown: villageTown.trim(),
        },
        securityQuestion,
        securityAnswerHash,
        passwordHash,
        passwordSalt: salt,
        createdAt: new Date().toISOString(),
        accountStatus: "Active",
      };
 
      const result = createStudentAccount(account);
      if (!result.success) {
        setError(result.message);
        return;
      }
 
      router.push(
        `/student/login?registered=1&email=${encodeURIComponent(account.email)}`
      );
    } catch {
      setError("Registration could not be completed in this browser. Check that Web Crypto is available and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }
 
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            iSports Account
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Student Registration
          </h1>
          <p className="mt-3 text-gray-400">
            Create your student account to access sports events and results.
          </p>
        </header>
 
        <div className="mb-6 rounded-xl border border-amber-700 bg-amber-950/40 p-4 text-sm text-amber-200">
          <strong>Local development mode:</strong> Accounts are stored only in this browser.
          The OTP shown below is a testing code; no real email or SMS is sent.
          Do not use this version for production or real personal data.
        </div>
 
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-7">
            <h2 className="text-xl font-bold">1. Personal Information</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="First Name" id="firstName">
                <input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" className={inputClass} />
              </Field>
              <Field label="Last Name" id="lastName">
                <input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" className={inputClass} />
              </Field>
              <Field label="Date of Birth" id="dateOfBirth">
                <input id="dateOfBirth" type="date" required max={today} value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Gender" id="gender">
                <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as StudentAccount["gender"])} className={inputClass}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select>
              </Field>
              <Field label="Profile Photo (JPG, PNG or WEBP; max 1 MB)" id="profilePhoto">
                <input id="profilePhoto" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handlePhotoChange(e.target.files?.[0])} className={inputClass} />
              </Field>
              {profilePhotoDataUrl && (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profilePhotoDataUrl} alt="Selected profile preview" className="h-16 w-16 rounded-full border border-gray-700 object-cover" />
                  <span className="text-sm text-green-400">Photo selected</span>
                </div>
              )}
            </div>
          </section>
 
          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-7">
            <h2 className="text-xl font-bold">2. Contact Information</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Mobile Number" id="mobileNumber">
                <input id="mobileNumber" type="tel" required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" autoComplete="tel" className={inputClass} />
              </Field>
              <Field label="Email Address" id="email">
                <input id="email" type="email" required value={email} onChange={(e) => handleEmailChange(e.target.value)} placeholder="student@example.com" autoComplete="email" className={inputClass} />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={generateDevelopmentOtp} className="rounded-lg border border-blue-500 px-4 py-2.5 text-sm font-semibold text-blue-300 hover:bg-blue-950">
                Generate Development OTP
              </button>
              {otp && !otpVerified && (
                <>
                  <input aria-label="Enter OTP" inputMode="numeric" maxLength={6} value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit OTP" className={`${inputClass} max-w-40`} />
                  <button type="button" onClick={verifyDevelopmentOtp} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-500">
                    Verify OTP
                  </button>
                </>
              )}
              {otpVerified && <span className="self-center text-sm font-semibold text-green-400">Email OTP verified (development)</span>}
            </div>
            {otp && !otpVerified && (
              <p className="mt-3 rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-200">
                Development-only OTP: <strong className="font-mono text-lg tracking-widest">{otp.code}</strong>
                <span className="mt-1 block text-xs text-amber-300">Expires in 5 minutes. This code is displayed only for local testing.</span>
              </p>
            )}
          </section>
 
          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-7">
            <h2 className="text-xl font-bold">3. Address</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="State" id="state">
                <input id="state" required value={stateName} onChange={(e) => setStateName(e.target.value)} autoComplete="address-level1" className={inputClass} />
              </Field>
              <Field label="District" id="district">
                <input id="district" required value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Mandal" id="mandal">
                <input id="mandal" required value={mandal} onChange={(e) => setMandal(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Village / Town" id="villageTown">
                <input id="villageTown" required value={villageTown} onChange={(e) => setVillageTown(e.target.value)} autoComplete="address-level2" className={inputClass} />
              </Field>
            </div>
          </section>
 
          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-7">
            <h2 className="text-xl font-bold">4. Account Security</h2>
            <div className="mt-5 grid gap-4">
              <Field label="Security Question" id="securityQuestion">
                <select id="securityQuestion" value={securityQuestion} onChange={(e) => setSecurityQuestion(e.target.value)} className={inputClass}>
                  {SECURITY_QUESTIONS.map((question) => <option key={question}>{question}</option>)}
                </select>
              </Field>
              <Field label="Security Answer" id="securityAnswer">
                <input id="securityAnswer" required value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} autoComplete="off" className={inputClass} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Password (minimum 8 characters)" id="password">
                  <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={inputClass} />
                </Field>
                <Field label="Confirm Password" id="confirmPassword">
                  <input id="confirmPassword" type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className={inputClass} />
                </Field>
              </div>
            </div>
          </section>
 
          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-7">
            <h2 className="text-xl font-bold">5. Terms & Conditions</h2>
            <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-gray-300">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 h-4 w-4 accent-blue-600" />
              <span>I confirm that the information provided is accurate and agree to the iSports account terms and privacy notice.</span>
            </label>
          </section>
 
          {error && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">{error}</p>}
          {notice && <p role="status" className="rounded-lg border border-blue-800 bg-blue-950/30 p-4 text-sm text-blue-200">{notice}</p>}
 
          <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-blue-600 px-5 py-4 font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? "Creating Account..." : "Register Account"}
          </button>
 
          <p className="text-center text-sm text-gray-400">
            Already registered?{" "}
            <Link href="/student/login" className="font-semibold text-blue-400 hover:text-blue-300">
              Student Login
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
 
const inputClass =
  "w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-blue-500";
 
function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-300">
        {label}
      </label>
      {children}
    </div>
  );
}

 