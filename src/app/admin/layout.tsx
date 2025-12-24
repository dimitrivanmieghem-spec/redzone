// Layout Admin - Force dynamic rendering pour éviter le cache
// Design harmonisé avec RedZone : fond gris très sombre, typographie bold

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0b] pb-24 md:pb-0">
      {children}
    </div>
  );
}
