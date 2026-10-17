import { useEffect, useRef } from 'react'

// Matches the interactive element every D2*Field widget ultimately renders:
// InputField/TextAreaField-based widgets render <input>/<textarea>, the custom
// SingleSelectField renders this data-test'd div. A <fieldset> (the radio-group
// render hint) is excluded — its own <legend> already names the group natively.
const WIDGET_TARGET_SELECTOR =
    'input, textarea, [data-test="dhis2-uicore-select-input"]'

// The widget has its own `fieldConfig.label` blanked (see RuleAwareField) so it
// doesn't render a second, visually duplicate label — the row's label is the
// only visible one. @dhis2/ui's field components don't accept an
// aria-label/aria-labelledby prop, so once the label is blanked they render no
// accessible name at all for the underlying input. Restore it by wiring
// aria-labelledby to the label element directly on whichever interactive
// element the widget actually rendered.
export function useWidgetAriaLabel(labelId: string) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container || container.querySelector('fieldset')) {
            return
        }
        container
            .querySelector<HTMLElement>(WIDGET_TARGET_SELECTOR)
            ?.setAttribute('aria-labelledby', labelId)
    })

    return containerRef
}
