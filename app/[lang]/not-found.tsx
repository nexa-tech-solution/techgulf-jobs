import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="font-mono text-5xl font-bold text-primary">404</p>
      <h1 className="mt-3 text-xl font-semibold">Page not found</h1>
      <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-on-primary">Back to jobs</Link>
    </div>
  );
}
