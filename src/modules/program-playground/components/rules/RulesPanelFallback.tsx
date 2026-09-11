import { CircularLoader } from '@dhis2/ui'
import i18n from '@dhis2/d2-i18n'

export function RulesPanelFallback() {
    return (
        <aside
            className="flex h-full w-[404px] min-w-[320px] max-w-[min(92vw,480px)] flex-col items-center justify-center border-s border-dhis2-grey-400 bg-dhis2-grey-100"
            aria-label={i18n.t('Loading rules panel')}
            role="status"
        >
            <CircularLoader small />
        </aside>
    )
}
