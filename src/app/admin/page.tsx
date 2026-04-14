import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { authOptions } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <section className="mx-auto max-w-6xl">
        <AdminDashboard />
      </section>
    </main>
  );
}
