import type { TrackerProgramMetadata } from '@nnkogift/dhis2-form-utils-hooks'
import { z } from 'zod'

export const trackerRegistrationValuesSchema = z
    .record(z.string(), z.string())
    .and(
        z.object({
            orgUnit: z.string(),
            enrolledAt: z.string(),
            occurredAt: z.string().optional(),
        })
    )

export const eventFormValuesSchema = z.record(z.string(), z.string()).and(
    z.object({
        orgUnit: z.string(),
        occurredAt: z.string(),
    })
)

export type TrackerRegistrationValues = z.infer<
    typeof trackerRegistrationValuesSchema
>
export type EventFormValues = z.infer<typeof eventFormValuesSchema>

export const EVENT_SYSTEM_FIELD_KEYS = new Set(['orgUnit', 'occurredAt'])

export type EventSubmissionInput = {
    values: EventFormValues | Record<string, unknown>
    programId: string
    programStageId: string
}

export function buildEventPayload({
    values,
    programId,
    programStageId,
}: EventSubmissionInput) {
    const orgUnit = String(values.orgUnit ?? '')
    const occurredAt = String(values.occurredAt ?? '')
    const dataValues = Object.entries(values)
        .filter(
            ([fieldId, value]) =>
                !EVENT_SYSTEM_FIELD_KEYS.has(fieldId) &&
                value !== '' &&
                value !== null &&
                value !== undefined
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
                status: 'ACTIVE' as const,
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
    values: TrackerRegistrationValues
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
            ([fieldId, value]) =>
                teaIds.has(fieldId) &&
                value !== '' &&
                value !== null &&
                value !== undefined
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
