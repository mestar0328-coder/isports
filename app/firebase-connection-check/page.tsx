"use client";

import { useState } from "react";
import { checkFirebaseConnection, type FirebaseConnectionReport } from "@/lib/firebase-connection-check";

export default function FirebaseConnectionCheckPage() {
  const [report, setReport] = useState<FirebaseConnectionReport | null>(null);

  function runCheck() {
    setReport(checkFirebaseConnection());
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 text-slate-900">
      <h1 className="text-2xl font-semibold">Firebase connection check</h1>
      <p className="mt-2 text-sm text-slate-600">
        Temporary setup check. It initializes the client SDK only and does not migrate application data.
      </p>
      <button
        type="button"
        onClick={runCheck}
        className="mt-6 rounded border border-slate-300 px-4 py-2 text-sm"
      >
        Run check
      </button>
      {report ? <Report report={report} /> : null}
    </main>
  );
}

function Report({ report }: { report: FirebaseConnectionReport }) {
  return (
    <section className="mt-6 space-y-3 text-sm">
      <p>Initialized: {report.initialized ? "yes" : "no"}</p>
      <p>Project ID: {report.projectId ?? "unavailable"}</p>
      <p>Firebase app count: {report.appCount}</p>
      <p>Duplicate initialization: {report.duplicateInitialization ? "yes" : "no"}</p>
      {report.error ? <p>Error: {report.error}</p> : null}
      <ul className="space-y-2">
        {report.services.map((service) => (
          <li key={service.name}>
            {service.name}: {service.accessible ? "accessible" : "not accessible"}. {service.detail}
          </li>
        ))}
      </ul>
    </section>
  );
}
