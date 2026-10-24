import i18n from '@dhis2/d2-i18n'
import { IconViewOff16 } from '@dhis2/ui'

type GhostToggleButtonProps = {
    enabled: boolean
    onToggle: () => void
}

export function GhostToggleButton({
    enabled,
    onToggle,
}: GhostToggleButtonProps) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={enabled}
            className={`inline-flex w-fit shrink-0 items-center gap-1.5 self-end rounded px-2.5 py-1.5 text-[13px] ${
                enabled
                    ? 'bg-dhis2-teal-100 text-dhis2-teal-900 shadow-[inset_0_0_0_1px_#4db6ac]'
                    : 'bg-dhis2-grey-100 text-dhis2-grey-900 shadow-[inset_0_0_0_1px_#a0adba]'
            }`}
            title={i18n.t(
                'Shows a placeholder where a rule hid a field or section.'
            )}
        >
            <IconViewOff16 aria-hidden="true" />
            {i18n.t('Show hidden fields')}
        </button>
    )
}
