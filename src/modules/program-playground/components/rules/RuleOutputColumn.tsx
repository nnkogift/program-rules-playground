import { useMemo } from 'react'
import i18n from '@dhis2/d2-i18n'
import { IconDimensionIndicator16, IconMessages16 } from '@dhis2/ui'
import {
    createLabelLookup,
    type RuleDevtoolsMetadata,
} from '@nnkogift/dhis2-form-utils-devtools'
import { useFormFeedback } from '@nnkogift/dhis2-form-utils-hooks'
import { RuleOutputCard } from './RuleOutputCard'

type RuleOutputColumnProps = {
    metadata: RuleDevtoolsMetadata
}

export function RuleOutputColumn({ metadata }: RuleOutputColumnProps) {
    const labelLookup = useMemo(() => createLabelLookup(metadata), [metadata])
    const feedback = useFormFeedback()
    const items = Object.values(feedback)
    const feedbackItems = items.filter((item) => item.location === 'feedback')
    const indicatorItems = items.filter(
        (item) => item.location === 'indicators'
    )

    return (
        <div className="flex w-[300px] shrink-0 flex-col gap-3">
            <RuleOutputCard
                variant="feedback"
                icon={<IconMessages16 aria-hidden="true" />}
                iconColorClassName="text-dhis2-purple-500"
                title={i18n.t('Feedback')}
                items={feedbackItems}
                labelLookup={labelLookup}
                emptyMessage={i18n.t(
                    'No feedback rules are firing in this form.'
                )}
            />
            <RuleOutputCard
                variant="indicator"
                icon={<IconDimensionIndicator16 aria-hidden="true" />}
                iconColorClassName="text-dhis2-blue-700"
                title={i18n.t('Indicators')}
                items={indicatorItems}
                labelLookup={labelLookup}
                emptyMessage={i18n.t(
                    'No indicator rules are firing in this form.'
                )}
            />
        </div>
    )
}
