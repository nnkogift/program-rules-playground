import i18n from '@dhis2/d2-i18n'
import { parseDhis2Error } from './parseDhis2Error'

export function formatDhis2Error(error: unknown): string {
    const parsed = parseDhis2Error(error)
    const errorReports = parsed.details?.response?.errorReports

    if (errorReports && errorReports.length > 0) {
        return errorReports
            .map((report) => report.message)
            .filter(Boolean)
            .join(' ')
    }

    if (parsed.details?.response?.message) {
        return parsed.details.response.message
    }

    if (parsed.message) {
        return parsed.message
    }

    return i18n.t('An unexpected error occurred')
}
