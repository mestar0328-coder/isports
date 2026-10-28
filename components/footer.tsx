export default function Footer() {
return (
<footer className="border-t border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
<div>
<p className="text-sm font-semibold text-slate-700">
© 2026 <span className="font-extrabold text-blue-600">iSports</span>.
All rights reserved.
</p>

      <p className="mt-2 text-sm text-slate-500">
        Sports. Players. Teams. Analytics.
      </p>
    </div>

    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
      <span className="h-2 w-2 rounded-full bg-green-500" />
      <span>Built for sports excellence</span>
    </div>
  </div>
</footer>

);
}