import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'
import type { OtherImportError } from '@/modules/program-playground/utils/parseRuleValidationReport'

type OtherImportErrorsProps = {
    errors: OtherImportError[]
}

// The importer wraps uids and values in backticks, which read as noise here.
const formatMessage = (message: string) => message.replaceAll('`', '')

/** Importer errors the server reported that no program rule generated. */
export function OtherImportErrors({ errors }: OtherImportErrorsProps) {
    if (errors.length === 0) {
        return null
    }
    return (
        <NoticeBox error title={i18n.t('Other import errors')}>
            <ul className="m-0 pl-4">
                {errors.map((error) => (
                    <li key={`${error.code ?? ''}:${error.message}`}>
                        {error.code ? (
                            <code className="mr-1 rounded bg-neutral-100 px-1 text-xs">
                                {error.code}
                            </code>
                        ) : null}
                        {formatMessage(error.message)}
                    </li>
                ))}
            </ul>
        </NoticeBox>
    )
}
