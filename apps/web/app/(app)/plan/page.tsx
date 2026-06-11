import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@grocery-savings/ui-web'

import { PreferencesForm } from '../components/preferences-form'

export default function PlanPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Plan your meals</CardTitle>
          <CardDescription>
            Tell us where you shop and what you eat. We&apos;ll find this
            week&apos;s deals near you and turn them into meal ideas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm />
        </CardContent>
      </Card>
    </div>
  )
}
