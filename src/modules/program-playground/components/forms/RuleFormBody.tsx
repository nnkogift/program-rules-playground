import type { createLabelLookup } from '@nnkogift/dhis2-form-utils-devtools'
import { type ComponentProps, type ReactNode, useState } from 'react'
import { GhostToggleButton } from '@/modules/program-playground/components/rules/GhostToggleButton'
import { RuleDisplayProvider } from '@/modules/program-playground/components/rules/RuleDisplayContext'
import { RuleOutputColumn } from '@/modules/program-playground/components/rules/RuleOutputColumn'

type RuleFormBodyProps = {
    rulesMetadata: ComponentProps<typeof RuleOutputColumn>['metadata']
    labelLookup: ReturnType<typeof createLabelLookup>
    /** The metadata-driven fields; rendered with rule-hidden ghosts when enabled. */
    fields: ReactNode
    /** Rendered under the fields (banners, action buttons). */
    children?: ReactNode
}

/**
 * Shared layout of the registration and event forms: the ghost toggle, the
 * fields column and the sticky rule output sidebar.
 */
export function RuleFormBody({
    rulesMetadata,
    labelLookup,
    fields,
    children,
}: RuleFormBodyProps) {
    const [ghostsEnabled, setGhostsEnabled] = useState(true)

    return (
        <>
            <GhostToggleButton
                enabled={ghostsEnabled}
                onToggle={() => {
                    setGhostsEnabled((current) => !current)
                }}
            />
            <div className="flex flex-1 flex-row-reverse items-start gap-5 pt-4">
                <div className="sticky top-0 shrink-0">
                    <RuleOutputColumn metadata={rulesMetadata} />
                </div>
                <div className="flex min-w-130 flex-1 flex-col gap-dp16">
                    <RuleDisplayProvider
                        ghostsEnabled={ghostsEnabled}
                        labelLookup={labelLookup}
                    >
                        {fields}
                    </RuleDisplayProvider>
                    {children}
                </div>
            </div>
        </>
    )
}
