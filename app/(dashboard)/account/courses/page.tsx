import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { BookOpen, Award, ExternalLink, FileCheck } from 'lucide-react'

const LEARN_URL = process.env.NEXT_PUBLIC_LEARN_URL || 'https://learn.onsiteclub.ca'

export const metadata = {
  title: 'Certificates | OnSite Club',
}

export default async function CoursesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: credentials } = await supabase
    .from('learn_credentials')
    .select('*')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  const credList = credentials || []

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
          <p className="text-gray-500 mt-1">Your earned credentials and certificates</p>
        </div>
        <a
          href={LEARN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
        >
          Go to Learn
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Credentials List */}
      {credList.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {credList.map(cred => (
            <div key={cred.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  {cred.credential_type === 'badge' ? (
                    <Award className="w-5 h-5 text-orange-600" />
                  ) : (
                    <FileCheck className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{cred.title}</p>
                  <p className="text-sm text-gray-400">
                    {cred.issued_at ? formatDate(cred.issued_at) : 'Pending'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700 capitalize">
                {cred.credential_type}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No certificates yet</h3>
          <p className="text-gray-400 mb-6">
            Complete courses on OnSite Learn to earn certificates and badges
          </p>
          <a
            href={LEARN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
          >
            Start Learning
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  )
}
