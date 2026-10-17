import { useRef, useState } from 'react'

export type ValidationResult = 'valid' | 'invalid' | 'failed'

/**
 * Runs the form's validation-only pass and tracks its outcome. When the form
 * is invalid, focus moves to the issue summary (attach `issueSummaryRef`).
 */
export function useFormValidation(onValidate?: () => Promise<boolean>) {
    const [result, setResult] = useState<ValidationResult>()
    const [failure, setFailure] = useState<string>()
    const issueSummaryRef = useRef<HTMLDivElement>(null)

    const validate = async () => {
        if (!onValidate) {
            return
        }
        setResult(undefined)
        setFailure(undefined)
        try {
            const valid = await onValidate()
            setResult(valid ? 'valid' : 'invalid')
            if (!valid) {
                // Wait for the summary to render before moving focus to it.
                requestAnimationFrame(() => issueSummaryRef.current?.focus())
            }
        } catch (error) {
            setFailure(error instanceof Error ? error.message : String(error))
            setResult('failed')
        }
    }

    return { result, failure, issueSummaryRef, validate }
}
