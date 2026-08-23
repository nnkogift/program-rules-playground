import type { ReactNode } from 'react'
import i18n from '@dhis2/d2-i18n'
import type { DevtoolsLabelLookup } from '@nnkogift/dhis2-form-utils-devtools'
import { useRuleEffectTrace } from '@nnkogift/dhis2-form-utils-hooks'
import {
    type FeedbackItem,
    feedbackItemKey,
} from '@nnkogift/dhis2-form-utils-rules'

type RuleOutputCardVariant = 'feedback' | 'indicator'

type RuleOutputCardProps = {
    icon: ReactNode
    iconColorClassName: string
    title: string
    items: FeedbackItem[]
    labelLookup: DevtoolsLabelLookup
    emptyMessage: string
    variant: RuleOutputCardVariant
}

// A qualifier chip has no data source yet in FeedbackItem — this stays
// undefined until the rule engine surfaces one, per the design's intent
// that it never be derived client-side.
type IndicatorQualifier = { label: string } | undefined

function RuleOutputRow({
    item,
    labelLookup,
    variant,
}: {
    item: FeedbackItem
    labelLookup: DevtoolsLabelLookup
    variant: RuleOutputCardVariant
}) {
    const ruleEffect = useRuleEffectTrace(feedbackItemKey(item))
    const ruleName = ruleEffect
        ? labelLookup.resolveRuleName(ruleEffect.ruleId)
        : null
    const actionType =
        ruleEffect?.ruleActionType ??
        (item.type === 'text' ? 'DISPLAYTEXT' : 'DISPLAYKEYVALUEPAIR')
    const qualifier: IndicatorQualifier = undefined

    return (
        <div className="flex flex-col gap-1 border-b border-dhis2-grey-200 px-3 py-[11px] last:border-b-0">
            <span className="text-xs leading-snug text-dhis2-grey-600">
                {item.content}
            </span>
            <div className="flex flex-wrap items-baseline gap-2">
                <span
                    className={
                        variant === 'indicator'
                            ? 'text-lg font-medium leading-tight tabular-nums text-dhis2-grey-900'
                            : 'text-sm font-medium leading-snug text-dhis2-grey-900 [text-wrap:pretty]'
                    }
                >
                    {item.value}
                </span>
                {qualifier ? (
                    <span className="rounded bg-dhis2-green-100 px-1.5 py-0.5 text-[11px] font-medium text-dhis2-green-900">
                        {qualifier.label}
                    </span>
                ) : null}
            </div>
            <span className="text-[11px] leading-snug text-dhis2-grey-600">
                {ruleName
                    ? i18n.t('{{actionType}} · {{ruleName}}', {
                          actionType,
                          ruleName,
                      })
                    : actionType}
            </span>
        </div>
    )
}

export function RuleOutputCard({
    icon,
    iconColorClassName,
    title,
    items,
    labelLookup,
    emptyMessage,
    variant,
}: RuleOutputCardProps) {
    return (
        <section className="overflow-hidden rounded-[3px] border border-dhis2-grey-300 bg-white shadow-[0_1px_2px_rgba(33,41,52,0.06)]">
            <header className="flex items-center gap-2 border-b border-dhis2-grey-200 px-3 py-2.5">
                <span className={`shrink-0 ${iconColorClassName}`}>{icon}</span>
                <h3 className="m-0 flex-1 text-[13px] font-bold uppercase tracking-[.04em] text-dhis2-grey-700">
                    {title}
                </h3>
                <span className="rounded bg-dhis2-grey-200 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-dhis2-grey-700">
                    {items.length}
                </span>
            </header>
            <div className="flex flex-col">
                {items.map((item) => (
                    <RuleOutputRow
                        key={feedbackItemKey(item)}
                        item={item}
                        labelLookup={labelLookup}
                        variant={variant}
                    />
                ))}
                {items.length === 0 ? (
                    <p className="m-0 px-3 py-3.5 text-xs leading-snug text-dhis2-grey-600">
                        {emptyMessage}
                    </p>
                ) : null}
            </div>
        </section>
    )
}
