import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="glass-zen w-full max-w-md rounded-3xl p-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[#5f7e72]">Veda AI</p>
        <h1 className="mt-3 font-heading text-4xl text-[#1c2d26]">Sign In</h1>
        <p className="mt-4 text-sm text-[#355145]">Google login is required for verified enquiries.</p>

        <Link
          href="/api/auth/signin/google"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#2b5e4e] px-6 text-white"
        >
          Continue with Google
        </Link>
      </section>
    </main>
  );
}
