import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-md">
        <h1 className="text-2xl font-bold text-slate-800">Account provisioning</h1>
        <p className="mt-4 text-sm text-slate-600">
          Accounts are created by a school administrator. Contact your school if
          you need access.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-block rounded-md bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
        >
          Return to sign in
        </Link>
      </div>
    </main>
  );
}
