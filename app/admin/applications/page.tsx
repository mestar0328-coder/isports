"use client";
 
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getAdminApplications,
  reviewAdminApplication,
} from "@/data/adminApplicationStorage";
import type {
  AdminApplication,
  AdminApplicationStatus,
} from "@/types/adminApplication";
 
type AdminSession = { role?: string; username?: string; email?: string };
 
const statusStyles: Record<AdminApplicationStatus, string> = {
  Pending: "border-amber-700 bg-amber-950/40 text-amber-300",
  Approved: "border-green-700 bg-green-950/40 text-green-300",
  Rejected: "border-red-700 bg-red-950/40 text-red-300",
};
 
export default function AdminApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [selected, setSelected] = useState<AdminApplication | null>(null);
  const [filter, setFilter] = useState<"All" | AdminApplicationStatus>("Pending");
  const [search, setSearch] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reviewer, setReviewer] = useState("admin");
 
  useEffect(() => {
    const raw = localStorage.getItem("isports_user");
    if (!raw) {
      router.replace("/admin/login");
      return;
    }
    try {
      const session = JSON.parse(raw) as AdminSession;
      if (session.role !== "admin") {
        router.replace("/admin/login");
        return;
      }
      setReviewer(session.username || session.email || "admin");
      setApplications(getAdminApplications());
    } catch {
      localStorage.removeItem("isports_user");
      router.replace("/admin/login");
    }
  }, [router]);
 
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesStatus = filter === "All" || application.status === filter;
      const matchesQuery =
        !query ||
        application.fullName.toLowerCase().includes(query) ||
        application.officialEmail.toLowerCase().includes(query) ||
        application.staffId.toLowerCase().includes(query) ||
        application.collegeName.toLowerCase().includes(query) ||
        application.department.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [applications, filter, search]);
 
  const counts = {
    total: applications.length,
    pending: applications.filter((item) => item.status === "Pending").length,
    approved: applications.filter((item) => item.status === "Approved").length,
    rejected: applications.filter((item) => item.status === "Rejected").length,
  };
 
  function refreshApplications() {
    setApplications(getAdminApplications());
  }
 
  function handleReview(status: "Approved" | "Rejected") {
    if (!selected) return;
    if (status === "Rejected" && !reviewNote.trim()) {
      setError("Enter a reason before rejecting this application.");
      return;
    }
    const action = status === "Approved" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${action} ${selected.fullName}'s application?`)) {
      return;
    }
    const result = reviewAdminApplication(selected.id, status, reviewer, reviewNote);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setSelected(result.application);
    setError("");
    setSuccess(`Application ${status.toLowerCase()} successfully.`);
    refreshApplications();
  }
 
  function openApplication(application: AdminApplication) {
    setSelected(application);
    setReviewNote(application.reviewNote || "");
    setError("");
    setSuccess("");
  }
 
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-purple-400">Admin Management</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Admin Application Review</h1>
            <p className="mt-2 text-gray-400">Review staff applications and record an approval decision.</p>
          </div>
          <Link href="/admin" className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800">Back to Admin Dashboard</Link>
        </div>
 
        <div className="mb-6 rounded-xl border border-amber-700 bg-amber-950/30 p-4 text-sm text-amber-200">
          Development-mode review: this page reads and updates the same browser's localStorage. Approval records a decision only; it does not activate admin login credentials or create a secure admin account.
        </div>
 
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Summary label="Total Applications" value={counts.total} />
          <Summary label="Pending" value={counts.pending} />
          <Summary label="Approved" value={counts.approved} />
          <Summary label="Rejected" value={counts.rejected} />
        </div>
 
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, Staff ID, college..." className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-purple-500" />
          <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white">
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="All">All statuses</option>
          </select>
          <button onClick={refreshApplications} type="button" className="rounded-lg border border-gray-700 px-4 py-3 hover:bg-gray-800">Refresh</button>
        </div>
 
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-400">
            No applications match this filter.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-gray-800/70 text-gray-300">
                  <tr>
                    <th className="px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">Staff / College</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((application) => (
                    <tr key={application.id} className="border-t border-gray-800">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-white">{application.fullName}</p>
                        <p className="mt-1 text-gray-400">{application.officialEmail}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p>{application.staffId}</p>
                        <p className="mt-1 text-gray-400">{application.collegeName}</p>
                      </td>
                      <td className="px-4 py-4 text-gray-300">{new Date(application.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-4"><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[application.status]}`}>{application.status}</span></td>
                      <td className="px-4 py-4"><button type="button" onClick={() => openApplication(application)} className="rounded-lg bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-500">Review</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
 
        {selected && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="review-title">
            <div className="my-5 w-full max-w-3xl rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow-2xl sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="review-title" className="text-2xl font-bold">Application Details</h2>
                  <p className="mt-1 text-sm text-gray-400">{selected.fullName} · {selected.status}</p>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="rounded-lg border border-gray-700 px-3 py-2 text-sm hover:bg-gray-800">Close</button>
              </div>
 
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Detail label="Full Name" value={selected.fullName} />
                <Detail label="Gender" value={selected.gender} />
                <Detail label="Official Email" value={selected.officialEmail} />
                <Detail label="Mobile Number" value={selected.mobileNumber} />
                <Detail label="Designation" value={selected.designation} />
                <Detail label="Staff ID" value={selected.staffId} />
                <Detail label="College" value={selected.collegeName} />
                <Detail label="Department" value={selected.department} />
                <div className="sm:col-span-2"><Detail label="Office Address" value={selected.officeAddress} /></div>
                <Detail label="Submitted At" value={new Date(selected.createdAt).toLocaleString()} />
                {selected.reviewedAt && <Detail label="Reviewed At" value={new Date(selected.reviewedAt).toLocaleString()} />}
                {selected.reviewedBy && <Detail label="Reviewed By" value={selected.reviewedBy} />}
              </div>
 
              <div className="mt-5 flex flex-wrap gap-3">
                {selected.profilePhotoDataUrl && <a href={selected.profilePhotoDataUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-purple-300 hover:bg-gray-800">Open Profile Photo</a>}
                <a href={selected.staffIdProofDataUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-purple-300 hover:bg-gray-800">Open Staff ID Proof ({selected.staffIdProofFileName})</a>
              </div>
 
              {selected.status === "Pending" ? (
                <>
                  <label htmlFor="reviewNote" className="mt-6 block text-sm font-medium text-gray-300">Review note / rejection reason</label>
                  <textarea id="reviewNote" rows={3} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Add an optional note. A reason is required for rejection." className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none focus:border-purple-500" />
                  <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => handleReview("Rejected")} className="rounded-lg border border-red-700 px-5 py-3 font-semibold text-red-300 hover:bg-red-950/50">Reject Application</button>
                    <button type="button" onClick={() => handleReview("Approved")} className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-500">Approve Application</button>
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-lg border border-gray-700 bg-gray-950 p-4 text-sm text-gray-300">
                  <p className="font-semibold">Review decision: {selected.status}</p>
                  {selected.reviewNote && <p className="mt-2 whitespace-pre-wrap">{selected.reviewNote}</p>}
                  <p className="mt-2 text-xs text-gray-500">This application has already been reviewed. Status changes are disabled in this phase.</p>
                </div>
              )}
              {error && <p role="alert" className="mt-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
              {success && <p role="status" className="mt-4 rounded-lg border border-green-800 bg-green-950/40 p-3 text-sm text-green-300">{success}</p>}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
 
function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-gray-800 bg-gray-900 p-5"><p className="text-sm text-gray-400">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>;
}
 
function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-gray-800 bg-gray-950 p-3"><p className="text-xs uppercase tracking-wide text-gray-500">{label}</p><p className="mt-1 break-words text-sm text-gray-200">{value}</p></div>;
}
