'use client'

import { Button, Input, Label } from '@grocery-savings/ui-web'
import { preferencesAtom } from '@grocery-savings/utils/atoms'
import {
  preferencesSchema,
  type DietaryRestrictionInput,
  type PreferencesInput,
} from '@grocery-savings/utils/schemas'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const DIETARY_OPTIONS: { value: DietaryRestrictionInput; label: string }[] = [
  { value: 'dairy_free', label: 'Dairy-free' },
  { value: 'gluten_free', label: 'Gluten-free' },
  { value: 'no_fish', label: 'No fish' },
  { value: 'no_pork', label: 'No pork' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'nut_free', label: 'Nut-free' },
]

type FormState = {
  zip: string
  radiusMiles: string
  householdSize: string
  dietaryRestrictions: DietaryRestrictionInput[]
  budgetPerServing: string
  minDiscountPercent: string
}

type FieldErrors = Partial<Record<keyof PreferencesInput, string>>

export function PreferencesForm() {
  const router = useRouter()
  const [stored, setStored] = useAtom(preferencesAtom)

  const [form, setForm] = useState<FormState>(() => ({
    zip: stored?.zip ?? '',
    radiusMiles: String(stored?.radiusMiles ?? 10),
    householdSize: String(stored?.householdSize ?? 4),
    dietaryRestrictions: stored?.dietaryRestrictions ?? [],
    budgetPerServing: String(stored?.budgetPerServing ?? 4),
    minDiscountPercent: String(stored?.minDiscountPercent ?? 25),
  }))
  const [errors, setErrors] = useState<FieldErrors>({})

  const toggleRestriction = (value: DietaryRestrictionInput) => {
    setForm((prev) => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(value)
        ? prev.dietaryRestrictions.filter((r) => r !== value)
        : [...prev.dietaryRestrictions, value],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const candidate = {
      zip: form.zip,
      radiusMiles: Number(form.radiusMiles),
      householdSize: Number(form.householdSize),
      dietaryRestrictions: form.dietaryRestrictions,
      budgetPerServing: Number(form.budgetPerServing),
      minDiscountPercent: Number(form.minDiscountPercent),
    }

    const result = preferencesSchema.safeParse(candidate)
    if (!result.success) {
      const fieldErrors: FieldErrors = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof PreferencesInput
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setStored(result.data)
    router.push('/plan/results')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="zip">ZIP code</Label>
        <Input
          id="zip"
          inputMode="numeric"
          placeholder="45208"
          value={form.zip}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, zip: e.target.value }))
          }
        />
        {errors.zip && <p className="text-sm text-destructive">{errors.zip}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="radiusMiles">Search radius (miles)</Label>
          <Input
            id="radiusMiles"
            type="number"
            min={1}
            max={50}
            value={form.radiusMiles}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, radiusMiles: e.target.value }))
            }
          />
          {errors.radiusMiles && (
            <p className="text-sm text-destructive">{errors.radiusMiles}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="householdSize">Household size</Label>
          <Input
            id="householdSize"
            type="number"
            min={1}
            max={12}
            value={form.householdSize}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, householdSize: e.target.value }))
            }
          />
          {errors.householdSize && (
            <p className="text-sm text-destructive">{errors.householdSize}</p>
          )}
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Dietary restrictions</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DIETARY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                value={option.value}
                checked={form.dietaryRestrictions.includes(option.value)}
                onChange={() => toggleRestriction(option.value)}
                className="h-4 w-4"
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors.dietaryRestrictions && (
          <p className="text-sm text-destructive">
            {errors.dietaryRestrictions}
          </p>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="budgetPerServing">Budget per serving</Label>
          <Input
            id="budgetPerServing"
            type="number"
            step={0.5}
            min={0}
            value={form.budgetPerServing}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                budgetPerServing: e.target.value,
              }))
            }
          />
          {errors.budgetPerServing && (
            <p className="text-sm text-destructive">
              {errors.budgetPerServing}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="minDiscountPercent">Minimum discount</Label>
          <Input
            id="minDiscountPercent"
            type="number"
            min={0}
            max={90}
            value={form.minDiscountPercent}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                minDiscountPercent: e.target.value,
              }))
            }
          />
          {errors.minDiscountPercent && (
            <p className="text-sm text-destructive">
              {errors.minDiscountPercent}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Find deals &amp; meals
      </Button>
    </form>
  )
}
