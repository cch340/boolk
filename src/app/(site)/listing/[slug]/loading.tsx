import { Skeleton } from "@/components/ui";

export default function ListingLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      <Skeleton className="mb-3 h-8 w-2/3" />
      <Skeleton className="mb-6 h-4 w-1/3" />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <Skeleton className="aspect-[16/10] w-full" />
          <div className="mt-3 grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full" />
            ))}
          </div>
          <Skeleton className="mt-8 h-6 w-40" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
        </div>
        <Skeleton className="hidden h-96 w-full lg:block" />
      </div>
    </div>
  );
}
