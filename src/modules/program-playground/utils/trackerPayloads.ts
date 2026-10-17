import type { TrackerProgramMetadata } from '@nnkogift/dhis2-form-utils-hooks'
import { z } from 'zod'

// Form widgets hold typed values (numbers, booleans, nulls, and NaN for an
// emptied numeric input), not only strings. They are stringified when the
// payload is built, and empty ones are dropped there.
const ORG_UNIT_REQUIRED_MESSAGE =
    'Select an organisation unit before saving or verifying'

const formValueSchema = z.union([
    z.string(),
    z.number(),
    z.nan(),
    z.boolean(),
    z.null(),
])

function isEmptyValue(value: unknown) {
    return (
        value === '' ||
        value === null ||
        value === undefined ||
        (typeof value === 'number' && Number.isNaN(value))
    )
}

export const trackerRegistrationValuesSchema = z
    .record(z.string(), formValueSchema)
    .and(
        z.object({
            orgUnit: z.string().min(1, ORG_UNIT_REQUIRED_MESSAGE),
            enrolledAt: z.string(),
            occurredAt: z.string().optional(),
        })
    )

export const eventFormValuesSchema = z.record(z.string(), formValueSchema).and(
    z.object({
        orgUnit: z.string().min(1, ORG_UNIT_REQUIRED_MESSAGE),
        occurredAt: z.string(),
    })
)

// The form hooks constrain their form values to strings, so the form-facing
// types stay string-based. The schemas above are wider because they validate
// what the widgets actually hold at submit time.
export type TrackerRegistrationValues = Record<string, string> & {
    orgUnit: string
    enrolledAt: string
    occurredAt?: string
}
export type EventFormValues = Record<string, string> & {
    orgUnit: string
    occurredAt: string
}
type ParsedRegistrationValues = z.infer<typeof trackerRegistrationValuesSchema>

export const EVENT_SYSTEM_FIELD_KEYS = new Set([
    'orgUnit',
    'occurredAt',
    'status',
])

/**
 * The form's zod resolver only knows the data elements / attributes, so the
 * values it hands to `handleSubmit` lack the system fields (orgUnit, dates).
 * Those are read back from the form's raw values instead.
 */
export function withSystemFieldValues<T extends Record<string, unknown>>(
    values: T,
    rawValues: Record<string, unknown>,
    systemKeys: readonly string[]
): T {
    const systemValues = Object.fromEntries(
        systemKeys
            .filter((key) => rawValues[key] !== undefined)
            .map((key) => [key, rawValues[key]])
    )

    return { ...values, ...systemValues }
}

export type EventStatus = 'ACTIVE' | 'COMPLETED'

export type EventSubmissionInput = {
    values: EventFormValues | Record<string, unknown>
    programId: string
    programStageId: string
    status?: EventStatus
}

export function buildEventPayload({
    values,
    programId,
    programStageId,
    status = 'ACTIVE',
}: EventSubmissionInput) {
    const orgUnit = String(values.orgUnit ?? '')
    const occurredAt = String(values.occurredAt ?? '')
    const dataValues = Object.entries(values)
        .filter(
            ([fieldId, value]) =>
                !EVENT_SYSTEM_FIELD_KEYS.has(fieldId) && !isEmptyValue(value)
        )
        .map(([dataElement, value]) => ({
            dataElement,
            value: String(value),
        }))

    return {
        events: [
            {
                program: programId,
                programStage: programStageId,
                orgUnit,
                occurredAt,
                status,
                ...(status === 'COMPLETED'
                    ? { completedAt: new Date().toISOString() }
                    : {}),
                dataValues,
            },
        ],
    }
}

export function buildTrackerRegistrationPayload({
    values,
    metadata,
    programId,
}: {
    values: ParsedRegistrationValues
    metadata: TrackerProgramMetadata
    programId: string
}) {
    const teaIds = new Set(
        metadata.programTrackedEntityAttributes.map(
            ({ trackedEntityAttribute }) => trackedEntityAttribute.id
        )
    )

    const attributes = Object.entries(values)
        .filter(
            ([fieldId, value]) => teaIds.has(fieldId) && !isEmptyValue(value)
        )
        .map(([attribute, value]) => ({
            attribute,
            value: String(value),
        }))

    return {
        trackedEntities: [
            {
                orgUnit: values.orgUnit,
                trackedEntityType: metadata.trackedEntityType.id,
                attributes,
                enrollments: [
                    {
                        program: programId,
                        orgUnit: values.orgUnit,
                        status: 'ACTIVE' as const,
                        enrolledAt: values.enrolledAt,
                        ...(metadata.displayIncidentDate && values.occurredAt
                            ? { occurredAt: values.occurredAt }
                            : {}),
                    },
                ],
            },
        ],
    }
}
