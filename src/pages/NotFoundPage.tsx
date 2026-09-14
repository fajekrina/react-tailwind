export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-slate-900">404 — Page Not Found</h1>
        <p className="mt-2 text-sm text-slate-500">Check merchantId and pageKey in URL. Example: /merchant_demo/home</p>
        <a href="/merchant_demo/home" className="mt-4 inline-block rounded bg-[#6c8cff] px-4 py-2 text-sm text-white">Go Home</a>
      </div>
    </div>
  )
}
