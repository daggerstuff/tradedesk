import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page not found</h2>
        <p className="text-gray-500 mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/dashboard" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
