type Dhis2ErrorReport = {
    message?: string
}

type Dhis2ErrorDetails = {
    httpStatusCode?: number
    response?: {
        message?: string
        errorReports?: Dhis2ErrorReport[]
    }
}

export type Dhis2Error = {
    message?: string
    details?: Dhis2ErrorDetails
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

function parseErrorReport(value: unknown): Dhis2ErrorReport {
    if (!isRecord(value)) {
        return {}
    }
    return {
        message: typeof value.message === 'string' ? value.message : undefined,
    }
}

function parseResponse(value: unknown): Dhis2ErrorDetails['response'] {
    if (!isRecord(value)) {
        return undefined
    }
    return {
        message: typeof value.message === 'string' ? value.message : undefined,
        errorReports: Array.isArray(value.errorReports)
            ? value.errorReports.map(parseErrorReport)
            : undefined,
    }
}

function parseDetails(value: unknown): Dhis2ErrorDetails | undefined {
    if (!isRecord(value)) {
        return undefined
    }
    return {
        httpStatusCode:
            typeof value.httpStatusCode === 'number'
                ? value.httpStatusCode
                : undefined,
        response: parseResponse(value.response),
    }
}

/** Narrows a caught `unknown` DHIS2 API error into a typed shape via property checks, never a blind cast. */
export function parseDhis2Error(error: unknown): Dhis2Error {
    if (!isRecord(error)) {
        return {}
    }
    return {
        message: typeof error.message === 'string' ? error.message : undefined,
        details: parseDetails(error.details),
    }
}
