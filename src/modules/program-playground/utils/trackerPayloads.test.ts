import type { TrackerProgramMetadata } from '@nnkogift/dhis2-form-utils-hooks'
import {
    buildEventPayload,
    buildTrackerRegistrationPayload,
} from './trackerPayloads'

describe('trackerPayloads', () => {
    it('builds an event payload from visible values', () => {
        expect(
            buildEventPayload({
                values: {
                    orgUnit: 'OrgUnit12345',
                    occurredAt: '2026-07-02',
                    deAlpha: 'yes',
                    deBeta: '',
                    deGamma: 7,
                },
                programId: 'Program12345',
                programStageId: 'Stage1234567',
            })
        ).toEqual({
            events: [
                {
                    program: 'Program12345',
                    programStage: 'Stage1234567',
                    orgUnit: 'OrgUnit12345',
                    occurredAt: '2026-07-02',
                    status: 'ACTIVE',
                    dataValues: [
                        {
                            dataElement: 'deAlpha',
                            value: 'yes',
                        },
                        {
                            dataElement: 'deGamma',
                            value: '7',
                        },
                    ],
                },
            ],
        })
    })

    it('does not add completedAt for ACTIVE events', () => {
        const { events } = buildEventPayload({
            values: { orgUnit: 'OrgUnit12345', occurredAt: '2026-07-02' },
            programId: 'Program12345',
            programStageId: 'Stage1234567',
            status: 'ACTIVE',
        })

        expect(events[0].status).toBe('ACTIVE')
        expect(events[0]).not.toHaveProperty('completedAt')
    })

    it('posts COMPLETED events with a completedAt timestamp', () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-07-03T10:00:00Z'))

        try {
            const { events } = buildEventPayload({
                values: { orgUnit: 'OrgUnit12345', occurredAt: '2026-07-02' },
                programId: 'Program12345',
                programStageId: 'Stage1234567',
                status: 'COMPLETED',
            })

            expect(events[0]).toMatchObject({
                status: 'COMPLETED',
                completedAt: '2026-07-03T10:00:00.000Z',
            })
        } finally {
            jest.useRealTimers()
        }
    })

    it('never sends a status form value as a data value', () => {
        const { events } = buildEventPayload({
            values: {
                orgUnit: 'OrgUnit12345',
                occurredAt: '2026-07-02',
                status: 'COMPLETED',
                deAlpha: 'yes',
            },
            programId: 'Program12345',
            programStageId: 'Stage1234567',
        })

        expect(events[0].status).toBe('ACTIVE')
        expect(events[0].dataValues).toEqual([
            { dataElement: 'deAlpha', value: 'yes' },
        ])
    })

    it('builds a nested tracker registration payload', () => {
        const metadata: TrackerProgramMetadata = {
            id: 'Program12345',
            displayName: 'Child registration',
            trackedEntityType: { id: 'TrackedEntity1' },
            displayIncidentDate: true,
            selectEnrollmentDatesInFuture: false,
            selectIncidentDatesInFuture: false,
            programTrackedEntityAttributes: [
                {
                    id: 'PTEA0000001',
                    trackedEntityAttribute: {
                        id: 'TeaAlpha1234',
                        displayName: 'First name',
                        formName: 'First name',
                        valueType: 'TEXT',
                        optionSet: undefined,
                        unique: false,
                        generated: false,
                        fieldMask: undefined,
                        confidential: false,
                        orgunitScope: false,
                    },
                    mandatory: true,
                    allowFutureDate: false,
                    searchable: true,
                    displayInList: true,
                    sortOrder: 1,
                    renderType: undefined,
                    renderOptionsAsRadio: false,
                },
            ],
            programRules: [],
            programRuleVariables: [],
            constants: [],
            programSections: [],
        }

        expect(
            buildTrackerRegistrationPayload({
                values: {
                    orgUnit: 'OrgUnit12345',
                    enrolledAt: '2026-07-02',
                    occurredAt: '2026-07-01',
                    TeaAlpha1234: 'Alice',
                    ignoredField: 'skip-me',
                },
                metadata,
                programId: 'Program12345',
            })
        ).toEqual({
            trackedEntities: [
                {
                    orgUnit: 'OrgUnit12345',
                    trackedEntityType: 'TrackedEntity1',
                    attributes: [
                        {
                            attribute: 'TeaAlpha1234',
                            value: 'Alice',
                        },
                    ],
                    enrollments: [
                        {
                            program: 'Program12345',
                            orgUnit: 'OrgUnit12345',
                            status: 'ACTIVE',
                            enrolledAt: '2026-07-02',
                            occurredAt: '2026-07-01',
                        },
                    ],
                },
            ],
        })
    })
})
