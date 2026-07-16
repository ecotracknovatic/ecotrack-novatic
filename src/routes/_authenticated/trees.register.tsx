import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { BatchRegistrationForm } from "@/components/trees/BatchRegistrationForm";

export const Route = createFileRoute("/_authenticated/trees/register")({
  head: () => ({ meta: [{ title: "Register trees — EcoTrack Novatic" }] }),
  component: RegisterTrees,
});

function RegisterTrees() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk tree registration"
        description="Register up to 5,000 trees of one species in a single, atomic submission."
      />
      <div className="mx-auto max-w-2xl">
        <BatchRegistrationForm />
      </div>
    </div>
  );
}
