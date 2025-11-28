import { db } from '@/lib/db'
import { getUserSubscriptionPlan } from '@/lib/stripe'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import PdfRenderer from '@/components/PdfRenderer'
import ChatWrapper from '@/components/chat/ChatWrapper'

interface PageProps {
  params: Promise<{
    fileid: string
  }>
}

const Page = async ({ params }: PageProps) => {
  const { fileid } = await params

  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user || !user.id)
    redirect(`/auth-callback?origin=dashboard/${fileid}`)

  const file = await db.file.findFirst({
    where: {
      id: fileid,
      userId: user.id,
    },
  })

  if (!file || !file.id) notFound()

  const plan = await getUserSubscriptionPlan()

  return (
    <div className='flex-1 justify-between flex flex-col h-[calc(100vh-3.5rem)]'>
      <div className='mx-auto w-full max-w-8xl grow lg:flex xl:px-2 h-full overflow-hidden'>
        {/* Left sidebar & main wrapper - PDF Viewer with independent scroll */}
        <div className='flex-1 xl:flex h-full overflow-hidden'>
          <div className='px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6 h-full overflow-hidden flex flex-col'>
            {/* PDF area with its own scroll container */}
            <div className='h-full overflow-y-auto overflow-x-hidden'>
              <Suspense fallback={
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                </div>
              }>
                <PdfRenderer url={file.url} fileId={file.id} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Right sidebar - Chat with independent scroll */}
        <div className='shrink-0 flex-[0.75] border-t border-gray-200 lg:w-96 lg:border-l lg:border-t-0 h-full overflow-hidden flex flex-col'>
          <Suspense fallback={
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          }>
            <ChatWrapper isSubscribed={plan.isSubscribed} fileId={file.id} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default Page
