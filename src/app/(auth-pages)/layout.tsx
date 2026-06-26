export default function AuthPagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#14161b]">
      {children}
    </div>
  )
} 