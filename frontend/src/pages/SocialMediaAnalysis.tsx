import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import CaseSelector, { useCaseSelector } from '../components/CaseSelector'
import { api } from '../api/client'

interface AppArtifact {
  id: string
  application_name: string
  account_identifier: string
  artifact_summary: string
  timestamp: string
  source_artifact: string
  is_encrypted_unavailable: boolean
}

export default function SocialMediaAnalysis() {
  const { cases, selected, setSelected } = useCaseSelector()
  const [apps, setApps] = useState<AppArtifact[]>([])

  useEffect(() => {
    if (!selected) return
    api.get('/api/social', { params: { investigation_id: selected } }).then((res) => setApps(res.data))
  }, [selected])

  return (
    <Layout title="Social Media & Application Analysis" subtitle="Supported application artifacts from authorized forensic extractions">
      <CaseSelector cases={cases} selected={selected} onChange={setSelected} />

      <DataTable<AppArtifact>
        rowKey={(a) => a.id}
        emptyLabel="No application/social artifacts imported for this case yet."
        rows={apps}
        columns={[
          { header: 'Application', render: (a) => a.application_name },
          { header: 'Account', render: (a) => a.account_identifier },
          { header: 'Summary', render: (a) => a.artifact_summary },
          { header: 'Timestamp', render: (a) => new Date(a.timestamp).toLocaleString() },
          { header: 'Availability', render: (a) => a.is_encrypted_unavailable
            ? <span className="text-amber-400">Encrypted / unavailable</span>
            : <span className="text-emerald-400">Available</span> },
        ]}
      />
    </Layout>
  )
}
