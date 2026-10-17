const FOCUSABLE_SELECTOR = 'input, textarea, [tabindex]'

/** Scrolls the rendered field into view and focuses its control; false when it is not on screen. */
export function focusField(fieldId: string): boolean {
    const container = Array.from(
        document.querySelectorAll<HTMLElement>('[data-field-id]')
    ).find((element) => element.dataset.fieldId === fieldId)
    if (!container) {
        return false
    }
    container.scrollIntoView({ block: 'center' })
    container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus({
        preventScroll: true,
    })
    return true
}
