import type { Ref } from 'react'
import i18n from '@dhis2/d2-i18n'
import { IconAdd16, Tooltip } from '@dhis2/ui'

type AddEventIconButtonProps = {
    onAdd: () => void
}

export function AddEventIconButton({ onAdd }: AddEventIconButtonProps) {
    return (
        <Tooltip content={i18n.t('Add event')}>
            {(referenceProps) => (
                <button
                    {...referenceProps}
                    ref={referenceProps.ref as Ref<HTMLButtonElement>}
                    type="button"
                    aria-label={i18n.t('Add event')}
                    onClick={(event) => {
                        event.stopPropagation()
                        onAdd()
                    }}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-dhis2-grey-700 hover:bg-dhis2-grey-300 hover:text-dhis2-grey-900"
                >
                    <IconAdd16 aria-hidden="true" />
                </button>
            )}
        </Tooltip>
    )
}
