import { redirect } from 'next/navigation'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { db } from '@/lib/db'
import AdminDashboardWrapper from '@/components/admin/AdminDashboardWrapper'

export default async function AdminPage() {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user || !user.id) {
    redirect('/auth-callback?origin=admin')
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
  })

  if (!dbUser || (dbUser as { role?: string }).role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return <AdminDashboardWrapper />
}

