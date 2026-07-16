import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale } from "@/lib/prefs";
import { AuthForm } from "@/components/site/AuthForm";

export const metadata: Metadata = { title: "Sign up" };

export default async function RegisterPage() {
  const locale = await getLocale();
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Suspense fallback={null}>
        <AuthForm mode="register" locale={locale} />
      </Suspense>
    </div>
  );
}
