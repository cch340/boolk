import { getSessionUser } from "@/lib/auth";
import { HeaderClient } from "./HeaderClient";

export async function SiteHeader() {
  const user = await getSessionUser();
  return <HeaderClient user={user} />;
}
