import { PROGRAM_TYPE } from '@/shared/types/program'
import { resolveProgramListItem } from './resolveProgramListItem'

const base = {
    id: 'p1',
    displayName: 'Malaria',
    shortName: 'Mal',
    programType: PROGRAM_TYPE.WITH_REGISTRATION,
}

describe('resolveProgramListItem', () => {
    it('maps the raw item and counts stages and rules', () => {
        expect(
            resolveProgramListItem({
                ...base,
                code: 'MAL',
                lastUpdated: '2024-01-02T00:00:00.000',
                programStages: [{ id: 's1' }, { id: 's2' }],
                programRules: [{ id: 'r1' }],
            })
        ).toEqual({
            id: 'p1',
            displayName: 'Malaria',
            code: 'MAL',
            shortName: 'Mal',
            programType: PROGRAM_TYPE.WITH_REGISTRATION,
            lastUpdated: '2024-01-02T00:00:00.000',
            stageCount: 2,
            ruleCount: 1,
        })
    })

    it('defaults optional fields', () => {
        expect(resolveProgramListItem(base)).toMatchObject({
            code: '',
            lastUpdated: '',
            stageCount: 0,
            ruleCount: 0,
        })
    })
})
