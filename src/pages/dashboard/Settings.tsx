import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { useMyProfile } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'

export default function Settings() {
  const { data: profile } = useMyProfile()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [resetSent, setResetSent] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePasswordReset() {
    if (!user?.email) return
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetSent(true)
  }

  async function handleDeleteAccount() {
    if (!user) return
    setDeleting(true)
    setError(null)
    try {
      // Deletes the profile row; ON DELETE CASCADE removes businesses, social
      // links, portfolio, experience, cards, QR configs and analytics events.
      const { error: err } = await supabase.from('profiles').delete().eq('id', user.id)
      if (err) throw err
      await supabase.auth.signOut()
      navigate('/', { replace: true })
    } catch (err) {
      setError(friendlyError(err, 'Your profile could not be deleted. Please try again.'))
      setDeleting(false)
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Settings</h1>
        <p className="mt-1 text-sm text-navy-500">Manage your account security and data.</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold text-navy-800">Account</h2>
        <Input label="Login Email" value={user?.email ?? ''} disabled />
        <Input label="Username" value={profile?.username ?? ''} disabled hint="Change this from My Profile" />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-navy-800">Password</h2>
        {resetSent ? (
          <Alert tone="success">Check your inbox for a password reset link.</Alert>
        ) : (
          <p className="text-sm text-navy-500">We&apos;ll email you a secure link to set a new password.</p>
        )}
        <Button variant="outline" className="self-start" onClick={handlePasswordReset}>
          Send password reset email
        </Button>
      </Card>

      <Card className="flex flex-col gap-3 border-red-200">
        <h2 className="font-semibold text-red-700">Danger zone</h2>
        <p className="text-sm text-navy-500">
          Deleting your account permanently removes your profile, businesses, cards, QR codes and analytics. This
          can&apos;t be undone.
        </p>
        <Button variant="danger" className="self-start" onClick={() => setConfirmOpen(true)}>
          Delete my account
        </Button>
      </Card>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete your account?">
        <p className="text-sm text-navy-500">
          Type <span className="font-semibold text-navy-800">DELETE</span> to confirm. This action is permanent.
        </p>
        <Input className="mt-4" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={confirmText !== 'DELETE'} loading={deleting} onClick={handleDeleteAccount}>
            Permanently delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
