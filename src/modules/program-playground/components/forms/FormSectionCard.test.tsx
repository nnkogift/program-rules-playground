import { render, screen } from '@testing-library/react'
import {
    useSectionRuleEffect,
    useSectionState,
} from '@nnkogift/dhis2-form-utils-hooks'
import { RuleDisplayProvider } from '@/modules/program-playground/components/rules/RuleDisplayContext'
import { defaultSectionTitle, FormSectionCard } from './FormSectionCard'

jest.mock('@nnkogift/dhis2-form-utils-hooks', () => ({
    useSectionState: jest.fn(),
    useSectionRuleEffect: jest.fn(),
}))
jest.mock(
    '@/modules/program-playground/components/rules/HiddenSectionPlaceholder',
    () => ({
        HiddenSectionPlaceholder: ({ ruleName }: { ruleName: string }) => (
            <div data-testid="placeholder">{ruleName}</div>
        ),
    })
)

const mockedState = jest.mocked(useSectionState)
const mockedEffect = jest.mocked(useSectionRuleEffect)

const labelLookup = {
    resolveRuleName: (ruleId: string) => `Rule ${ruleId}`,
    resolveFieldName: (fieldId: string) => fieldId,
}

function renderCard(ghostsEnabled = true, props = {}) {
    return render(
        <RuleDisplayProvider
            ghostsEnabled={ghostsEnabled}
            labelLookup={labelLookup as never}
        >
            <FormSectionCard sectionId="sec1" {...props}>
                <span>child</span>
            </FormSectionCard>
        </RuleDisplayProvider>
    )
}

describe('FormSectionCard', () => {
    beforeEach(() => {
        mockedState.mockReturnValue({ hidden: false } as never)
        mockedEffect.mockReturnValue(undefined as never)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders the title, note and children', () => {
        renderCard(true, { title: 'Vitals', note: '3 fields' })

        expect(screen.getByText('Vitals')).toBeTruthy()
        expect(screen.getByText('3 fields')).toBeTruthy()
        expect(screen.getByText('child')).toBeTruthy()
    })

    it('omits the title and note when not given', () => {
        renderCard()

        expect(screen.queryByRole('heading')).toBeNull()
    })

    it('renders nothing for a hidden section when ghosts are disabled', () => {
        mockedState.mockReturnValue({ hidden: true } as never)

        const { container } = renderCard(false)

        expect(container.innerHTML).toBe('')
    })

    it('shows a placeholder naming the rule instead of children for a hidden section', () => {
        mockedState.mockReturnValue({ hidden: true } as never)
        mockedEffect.mockReturnValue({ ruleId: 'r1' } as never)

        renderCard()

        expect(screen.getByTestId('placeholder').textContent).toBe('Rule r1')
        expect(screen.queryByText('child')).toBeNull()
    })

    it('falls back to a generic rule name', () => {
        mockedState.mockReturnValue({ hidden: true } as never)

        renderCard()

        expect(screen.getByTestId('placeholder').textContent).toBe('a rule')
    })
})

describe('defaultSectionTitle', () => {
    it('prefers the display name', () => {
        expect(defaultSectionTitle('Vitals')).toBe('Vitals')
    })

    it('falls back to "Section"', () => {
        expect(defaultSectionTitle()).toBe('Section')
    })
})
