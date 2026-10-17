import { renderHook } from '@testing-library/react'
import { useDataQuery } from '@dhis2/app-runtime'
import { useProgramOrgUnits } from './useProgramOrgUnits'

jest.mock('@dhis2/app-runtime', () => ({
    useDataQuery: jest.fn(),
}))

const mockedUseDataQuery = jest.mocked(useDataQuery)

describe('useProgramOrgUnits', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    it('queries the program by id', () => {
        mockedUseDataQuery.mockReturnValue({ data: undefined } as never)

        renderHook(() => useProgramOrgUnits('prog1'))

        expect(mockedUseDataQuery.mock.calls[0][0]).toMatchObject({
            program: { resource: 'programs', id: 'prog1' },
        })
    })

    it('returns no org units before data resolves', () => {
        mockedUseDataQuery.mockReturnValue({
            data: undefined,
            loading: true,
        } as never)

        const { result } = renderHook(() => useProgramOrgUnits('prog1'))

        expect(result.current.orgUnits).toEqual([])
        expect(result.current.loading).toBe(true)
        expect(result.current.error).toBeUndefined()
    })

    it('returns the program org units sorted by name', () => {
        mockedUseDataQuery.mockReturnValue({
            data: {
                program: {
                    organisationUnits: [
                        { id: 'b', displayName: 'Bravo', path: '/b' },
                        { id: 'a', displayName: 'Alpha', path: '/a' },
                    ],
                },
            },
        } as never)

        const { result } = renderHook(() => useProgramOrgUnits('prog1'))

        expect(result.current.orgUnits.map((orgUnit) => orgUnit.id)).toEqual([
            'a',
            'b',
        ])
    })

    it('returns no org units when the program has none', () => {
        mockedUseDataQuery.mockReturnValue({
            data: { program: {} },
        } as never)

        const { result } = renderHook(() => useProgramOrgUnits('prog1'))

        expect(result.current.orgUnits).toEqual([])
    })

    it('surfaces the query error', () => {
        const error = new Error('boom')
        mockedUseDataQuery.mockReturnValue({ error } as never)

        const { result } = renderHook(() => useProgramOrgUnits('prog1'))

        expect(result.current.error).toBe(error)
    })

    it('surfaces a schema error when the response is malformed', () => {
        mockedUseDataQuery.mockReturnValue({
            data: { program: { organisationUnits: [{ id: 1 }] } },
        } as never)

        const { result } = renderHook(() => useProgramOrgUnits('prog1'))

        expect(result.current.orgUnits).toEqual([])
        expect(result.current.error).toBeTruthy()
    })
})
