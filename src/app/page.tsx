import { HomeShell } from "@/components/home-shell";
import { getInstitutionRows } from "@/lib/knowledge-base";

export default async function Home() {
  const institutions = await getInstitutionRows();

  return <HomeShell institutions={institutions} />;
}
