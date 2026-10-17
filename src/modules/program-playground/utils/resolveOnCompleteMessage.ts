type OnCompleteFieldState =
    | { errorOnComplete?: string | null; warningOnComplete?: string | null }
    | null
    | undefined

export type OnCompleteMessage = {
    kind: 'error' | 'warning'
    text: string
}

// Errors take precedence over warnings; both only surface once the event is
// being completed.
export function resolveOnCompleteMessage(
    status: string | undefined,
    fieldState: OnCompleteFieldState
): OnCompleteMessage | null {
    if (status !== 'COMPLETED' || !fieldState) {
        return null
    }
    if (fieldState.errorOnComplete) {
        return { kind: 'error', text: fieldState.errorOnComplete }
    }
    if (fieldState.warningOnComplete) {
        return { kind: 'warning', text: fieldState.warningOnComplete }
    }
    return null
}
