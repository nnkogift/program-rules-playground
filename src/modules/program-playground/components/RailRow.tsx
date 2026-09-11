import type { ReactNode } from 'react'

type RailRowProps = {
    icon?: ReactNode
    label: string
    meta: string
    indent?: boolean
    selected: boolean
    onClick: () => void
    action?: ReactNode
}

export function RailRow({
    icon,
    label,
    meta,
    indent = false,
    selected,
    onClick,
    action,
}: RailRowProps) {
    return (
        <div
            role="button"
            tabIndex={0}
            aria-current={selected ? 'true' : undefined}
            onClick={onClick}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onClick()
                }
            }}
            className={`relative flex cursor-pointer flex-col gap-1 py-2.5 ${
                indent ? 'pl-11 pr-4' : 'pl-[19px] pr-4'
            } ${selected ? 'bg-dhis2-teal-100' : ''}`}
        >
            <div
                className={`absolute inset-y-0 left-0 w-[3px] ${
                    selected ? 'bg-dhis2-teal-600' : 'bg-transparent'
                }`}
            />
            <div className="flex min-w-0 items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    {icon ? (
                        <span
                            className={
                                selected
                                    ? 'shrink-0 text-dhis2-teal-600'
                                    : 'shrink-0 text-dhis2-grey-600'
                            }
                        >
                            {icon}
                        </span>
                    ) : null}
                    <span
                        className={`min-w-0 truncate text-sm font-medium leading-5 ${
                            selected
                                ? 'text-dhis2-teal-900'
                                : 'text-dhis2-grey-800'
                        }`}
                    >
                        {label}
                    </span>
                </div>
                {action}
            </div>
            <div className={indent ? 'pl-0' : 'pl-6'}>
                <span className="text-xs text-dhis2-grey-600">{meta}</span>
            </div>
        </div>
    )
}
