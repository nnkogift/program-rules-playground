import { renderHook } from '@testing-library/react'
import { useDataQuery } from '@dhis2/app-runtime'
import { useAccessibleOrgUnits } from './useAccessibleOrgUnits'

jest.mock('@dhis2/app-runtime', () => ({
    useDataQuery: jest.fn(),
}))

const mockedUseDataQuery = jest.mocked(useDataQuery)

describe('useAccessibleOrgUnits', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    it('returns no org units while data has not resolved', () => {
        mockedUseDataQuery.mockReturnValue({ data: undefined } as never)

        const { result } = renderHook(() => useAccessibleOrgUnits())

        expect(result.current.orgUnits).toEqual([])
    })

    it('returns no org units when the response does not match the schema', () => {
        mockedUseDataQuery.mockReturnValue({
            data: { me: { organisationUnits: [{ id: 1 }] } },
        } as never)

        const { result } = renderHook(() => useAccessibleOrgUnits())

        expect(result.current.orgUnits).toEqual([])
    })

    it('merges the three org unit lists, dedupes by id and sorts by name', () => {
        mockedUseDataQuery.mockReturnValue({
            data: {
                me: {
                    organisationUnits: [
                        { id: 'b', displayName: 'Bravo' },
                        { id: 'a', displayName: 'Alpha' },
                    ],
                    dataViewOrganisationUnits: [
                        { id: 'a', displayName: 'Alpha' },
                        { id: 'c', displayName: 'Charlie' },
                    ],
                    teiSearchOrganisationUnits: [
                        { id: 'c', displayName: 'Charlie' },
                    ],
                },
            },
        } as never)

        const { result } = renderHook(() => useAccessibleOrgUnits())

        expect(result.current.orgUnits.map((orgUnit) => orgUnit.id)).toEqual([
            'a',
            'b',
            'c',
        ])
    })

    it('drops entries without an id', () => {
        mockedUseDataQuery.mockReturnValue({
            data: {
                me: {
                    organisationUnits: [
                        { id: '', displayName: 'Nameless' },
                        { id: 'a', displayName: 'Alpha' },
                    ],
                },
            },
        } as never)

        const { result } = renderHook(() => useAccessibleOrgUnits())

        expect(result.current.orgUnits).toEqual([
            { id: 'a', displayName: 'Alpha' },
        ])
    })

    it('passes the query result through', () => {
        mockedUseDataQuery.mockReturnValue({
            data: undefined,
            loading: true,
        } as never)

        const { result } = renderHook(() => useAccessibleOrgUnits())

        expect(result.current.loading).toBe(true)
    })
})
