import i18n from '@dhis2/d2-i18n'
import type { OtherImportError } from '@/modules/program-playground/utils/parseRuleValidationReport'

type OtherImportErrorsProps = {
    errors: OtherImportError[]
}

// The importer wraps uids and values in backticks, which read as noise here.
const formatMessage = (message: string) => message.replaceAll('`', '')

/** Importer errors no program rule generated, collapsed so they don't push the actions around. */
export function OtherImportErrors({ errors }: OtherImportErrorsProps) {
    if (errors.length === 0) {
        return null
    }
    return (
        <details className="text-xs text-dhis2-red-800" open>
            <summary className="cursor-pointer font-medium">
                {i18n.t('Other import errors ({{count}})', {
                    count: errors.length,
                })}
            </summary>
            <ul className="m-0 mt-1 max-h-32 list-none overflow-auto p-0">
                {errors.map((error) => (
                    <li
                        key={`${error.code ?? ''}:${error.message}`}
                        className="py-0.5 leading-4"
                    >
                        {error.code ? (
                            <code className="mr-1 rounded bg-dhis2-red-100 px-1">
                                {error.code}
                            </code>
                        ) : null}
                        {formatMessage(error.message)}
                    </li>
                ))}
            </ul>
        </details>
    )
}
