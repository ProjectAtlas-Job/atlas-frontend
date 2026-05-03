type DashboardSectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function DashboardSectionPage({ params }: DashboardSectionPageProps) {
  const { section } = await params;
  const title = section
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    <div className="space-y-3">
      <h2 className="text-3xl font-semibold text-slate-950">{title}</h2>
      <p className="text-sm text-slate-600">Placeholder view for {title}. Sprint 8 only.</p>
    </div>
  );
}
