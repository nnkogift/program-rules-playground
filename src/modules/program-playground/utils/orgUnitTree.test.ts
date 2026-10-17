import {
    getAncestorPaths,
    getSelectableIds,
    getTreeRoots,
    searchProgramOrgUnits,
} from './orgUnitTree'

const PROGRAM_ORG_UNITS = [
    {
        id: 'Child000001',
        displayName: 'Ngelehun CHC',
        path: '/Root0000001/Dist0000001/Child000001',
    },
    {
        id: 'Child000002',
        displayName: 'Njala CHC',
        path: '/Root0000001/Dist0000002/Child000002',
    },
]

describe('orgUnitTree', () => {
    it('uses accessible org units that are ancestors of program units as roots', () => {
        expect(
            getTreeRoots(PROGRAM_ORG_UNITS, ['Root0000001', 'Other000001'])
        ).toEqual(['Root0000001'])
    })

    it('falls back to the program units when no accessible root leads to them', () => {
        expect(getTreeRoots(PROGRAM_ORG_UNITS, ['Other000001'])).toEqual([
            'Child000001',
            'Child000002',
        ])
    })

    it('only treats program org units as selectable', () => {
        const selectable = getSelectableIds(PROGRAM_ORG_UNITS)
        expect(selectable.has('Child000001')).toBe(true)
        expect(selectable.has('Dist0000001')).toBe(false)
    })

    it('searches by name case-insensitively and ignores blank terms', () => {
        expect(searchProgramOrgUnits(PROGRAM_ORG_UNITS, ' njala ')).toEqual([
            PROGRAM_ORG_UNITS[1],
        ])
        expect(searchProgramOrgUnits(PROGRAM_ORG_UNITS, '  ')).toEqual([])
    })

    it('lists every ancestor path once', () => {
        expect(getAncestorPaths(PROGRAM_ORG_UNITS).sort()).toEqual([
            '/Root0000001',
            '/Root0000001/Dist0000001',
            '/Root0000001/Dist0000002',
        ])
    })
})
