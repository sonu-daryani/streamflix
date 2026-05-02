import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CmsClientPage from "@/components/CmsClientPage";
import { CMS_SESSION_COOKIE, isCmsSessionValid } from "@/lib/cmsAuth";

export default async function CmsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CMS_SESSION_COOKIE)?.value;
  const isAuthenticated = await isCmsSessionValid(token);

  if (!isAuthenticated) {
    redirect("/cms/login?next=/cms");
  }

  return <CmsClientPage />;
}
