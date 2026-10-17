import { render, screen, within } from '@testing-library/react'
import type { ProgramStageMetadata } from '@nnkogift/dhis2-form-utils-metadata'
import { EventFormFields } from './EventFormFields'

jest.mock(
    '@/modules/program-playground/components/rules/RuleAwareField',
    () => ({
        RuleAwareField: ({
            field,
        }: {
            field: { config: { dataElement: { id: string } } }
        }) => <div data-testid={`field-${field.config.dataElement.id}`} />,
    })
)
jest.mock('./FormSectionCard', () => ({
    defaultSectionTitle: (name?: string) => name,
    FormSectionCard: ({
        sectionId,
        children,
    }: {
        sectionId: string
        children: React.ReactNode
    }) => <section data-testid={`section-${sectionId}`}>{children}</section>,
}))

function buildMetadata(
    sections: Array<{ id: string; dataElements: Array<{ id: string }> }>
) {
    return {
        programStageDataElements: ['a', 'b', 'c'].map((id) => ({
            dataElement: { id },
        })),
        programStageSections: sections.map((section, index) => ({
            ...section,
            displayName: section.id,
            sortOrder: index,
        })),
    } as unknown as ProgramStageMetadata
}

describe('EventFormFields', () => {
    it('places fields inside their sections and the rest after them', () => {
        render(
            <EventFormFields
                metadata={buildMetadata([
                    { id: 's1', dataElements: [{ id: 'a' }, { id: 'b' }] },
                ])}
            />
        )

        const section = screen.getByTestId('section-s1')
        expect(within(section).getByTestId('field-a')).toBeTruthy()
        expect(within(section).getByTestId('field-b')).toBeTruthy()
        expect(within(section).queryByTestId('field-c')).toBeNull()
        expect(screen.getByTestId('field-c')).toBeTruthy()
    })

    it('renders every field flat when the stage has no sections', () => {
        render(<EventFormFields metadata={buildMetadata([])} />)

        expect(screen.getAllByTestId(/^field-/)).toHaveLength(3)
        expect(screen.queryByTestId(/^section-/)).toBeNull()
    })
})
