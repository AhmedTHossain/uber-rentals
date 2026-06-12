import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Login is unified at /login. Forward here (preserving callbackUrl) so any old
// links/bookmarks to the renter login still work.
export default async function RenterLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login");
}
