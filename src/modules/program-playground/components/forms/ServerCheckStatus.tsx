import i18n from '@dhis2/d2-i18n'
import { CircularLoader, IconCheckmarkCircle16, IconWarning16 } from '@dhis2/ui'
import type { ReactNode } from 'react'
import { OtherImportErrors } from './OtherImportErrors'
import type { ServerVerificationState } from '@/modules/program-playground/hooks/useServerVerification'

type ServerCheckStatusProps = {
    state: ServerVerificationState
}

type StatusLine = {
    icon: ReactNode
    text: string
    tone: string
}

function describe(state: ServerVerificationState): StatusLine | undefined {
    switch (state.phase) {
        case 'loading':
            return {
                icon: <CircularLoader extrasmall />,
                text: i18n.t('Verifying with server…'),
                tone: 'text-dhis2-grey-900',
            }
        case 'done': {
            const ruleCount = state.report.verification.entries.length
            const otherCount = state.report.otherErrors.length
            if (ruleCount === 0 && otherCount === 0) {
                return {
                    icon: <IconCheckmarkCircle16 />,
                    text: i18n.t('Server found no rule errors or warnings.'),
                    tone: 'text-dhis2-green-900',
                }
            }
            return {
                icon: <IconWarning16 />,
                text: i18n.t(
                    'Server reported {{ruleCount}} from rules and {{otherCount}} other errors.',
                    { ruleCount, otherCount }
                ),
                tone: 'text-dhis2-grey-900',
            }
        }
        default:
            return undefined
    }
}

/**
 * Status, import errors and the dry-run caveat, kept as one compact block that
 * sits beside the dialog's action buttons. The live region stays mounted so
 * assistive tech announces each change.
 */
export function ServerCheckStatus({ state }: ServerCheckStatusProps) {
    const line = describe(state)

    return (
        <div className="flex max-w-[380px] flex-col gap-1 text-left">
            <div
                role="status"
                aria-live="polite"
                className="flex flex-col gap-1"
            >
                {line ? (
                    <p
                        className={`m-0 flex items-start gap-1.5 text-sm font-medium leading-5 ${line.tone}`}
                    >
                        <span aria-hidden="true" className="mt-0.5 shrink-0">
                            {line.icon}
                        </span>
                        <span>{line.text}</span>
                    </p>
                ) : null}
                {state.phase === 'done' ? (
                    <OtherImportErrors errors={state.report.otherErrors} />
                ) : null}
            </div>
            <p className="m-0 text-xs leading-4 text-dhis2-grey-700">
                {i18n.t(
                    "The dry run doesn't report notifications, so notification rows stay Simulated."
                )}
            </p>
        </div>
    )
}
