import { ReactNode } from 'react'
import { TopNavbar } from '../../components/top-navbar'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNavbar />
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  )
}
