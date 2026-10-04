import type * as React from "react"
import { Input } from "@/components/ui/input"
import { formatNumberInput } from "@/lib/utils"

export function MoneyInput({
  defaultValue,
  ...props
}: Omit<
  React.ComponentProps<typeof Input>,
  "defaultValue" | "inputMode" | "onInput" | "pattern" | "placeholder"
> & {
  defaultValue?: number | string
}) {
  return (
    <Input
      inputMode="numeric"
      onInput={(event) => {
        event.currentTarget.value = formatNumberInput(event.currentTarget.value)
      }}
      pattern="[0-9.]*"
      placeholder="0"
      {...props}
      defaultValue={formatNumberInput(defaultValue)}
    />
  )
}
