import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Other' },
]

export function ReportProfileModal({ userId, open, onClose }: { userId: string; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState('spam')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const { error: err } = await supabase
        .from('profile_reports')
        .insert({ reported_user_id: userId, reason, details: details || null })
      if (err) throw err
      setDone(true)
    } catch (err) {
      setError(friendlyError(err, 'Could not submit your report. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Report this profile">
      {done ? (
        <Alert tone="success">Thanks — our team will review this profile.</Alert>
      ) : (
        <div className="flex flex-col gap-4">
          {error && <Alert tone="error">{error}</Alert>}
          <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          <Textarea label="Additional details (optional)" value={details} onChange={(e) => setDetails(e.target.value)} />
          <Button onClick={submit} loading={submitting} className="self-end">
            Submit report
          </Button>
        </div>
      )}
    </Modal>
  )
}
