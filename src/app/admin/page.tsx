import { redirect } from 'next/navigation'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { db } from '@/lib/db'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function AdminPage() {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user || !user.id) {
    redirect('/auth-callback?origin=admin')
  }

  const dbUser = await db.user.findFirst({
    where: { id: user.id },
  })

  if (!dbUser || dbUser.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return <AdminDashboard />
}

