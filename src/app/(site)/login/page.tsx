import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale } from "@/lib/prefs";
import { AuthForm } from "@/components/site/AuthForm";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  const locale = await getLocale();
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Suspense fallback={null}>
        <AuthForm mode="login" locale={locale} />
      </Suspense>
    </div>
  );
}
