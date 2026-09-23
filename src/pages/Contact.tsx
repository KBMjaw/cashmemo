import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useSeo } from '@/hooks/useSeo'

export default function Contact() {
  useSeo({ title: 'Contact | One-Tap', description: 'Get in touch with the One-Tap team.' })
  const [sent, setSent] = useState(false)

  return (
    <div className="container-app max-w-lg py-20">
      <h1 className="text-4xl font-bold text-navy-900">Contact us</h1>
      <p className="mt-3 text-navy-500">Questions, feedback, or need help with your account? We&apos;d love to hear from you.</p>
      <Card className="mt-8">
        {sent ? (
          <Alert tone="success">Thanks for reaching out — we&apos;ll get back to you shortly.</Alert>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              setSent(true)
            }}
          >
            <Input label="Name" required />
            <Input label="Email" type="email" required />
            <Textarea label="Message" required />
            <Button type="submit" className="self-start">
              Send message
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
