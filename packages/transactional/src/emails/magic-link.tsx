import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface MagicLinkEmailProps {
  appName?: string
  magicLinkUrl?: string
  expiryMinutes?: number
}

export function MagicLinkEmail({
  appName = 'Golden',
  magicLinkUrl = 'https://example.com/auth/callback',
  expiryMinutes = 15,
}: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sign in to {appName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Sign in to {appName}</Heading>
          <Text style={text}>
            Click the button below to sign in. This link will expire in{' '}
            {expiryMinutes} minutes.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={magicLinkUrl}>
              Sign In
            </Button>
          </Section>
          <Text style={smallText}>
            If you didn't request this email, you can safely ignore it.
          </Text>
          <Text style={smallText}>
            Or copy and paste this URL into your browser:{' '}
            <Link href={magicLinkUrl} style={link}>
              {magicLinkUrl}
            </Link>
          </Text>
          <Text style={footer}>
            Best,
            <br />
            The {appName} Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default MagicLinkEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  marginBottom: '64px',
  borderRadius: '8px',
}

const h1 = {
  color: '#0c4a6e',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 20px',
}

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const smallText = {
  color: '#737373',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
}

const buttonContainer = {
  margin: '24px 0',
}

const button = {
  backgroundColor: '#0284c7',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
}

const link = {
  color: '#0284c7',
  textDecoration: 'underline',
}

const footer = {
  color: '#737373',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '32px 0 0',
}
