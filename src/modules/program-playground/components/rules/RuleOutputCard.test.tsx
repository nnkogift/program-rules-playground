import { render, screen } from '@testing-library/react'
import { useRuleEffectTrace } from '@nnkogift/dhis2-form-utils-hooks'
import { RuleOutputCard } from './RuleOutputCard'

jest.mock('@nnkogift/dhis2-form-utils-hooks', () => ({
    useRuleEffectTrace: jest.fn(),
}))
jest.mock('@nnkogift/dhis2-form-utils-rules', () => ({
    feedbackItemKey: (item: { content: string }) => `key:${item.content}`,
}))

const mockedTrace = jest.mocked(useRuleEffectTrace)

const labelLookup = {
    resolveRuleName: (ruleId: string) => `Rule ${ruleId}`,
    resolveFieldName: (fieldId: string) => fieldId,
} as never

function renderCard(items: unknown[], variant: 'feedback' | 'indicator') {
    return render(
        <RuleOutputCard
            icon={<i />}
            iconColorClassName="text-red"
            title="Feedback"
            items={items as never}
            labelLookup={labelLookup}
            emptyMessage="Nothing here"
            variant={variant}
        />
    )
}

describe('RuleOutputCard', () => {
    beforeEach(() => {
        mockedTrace.mockReturnValue(undefined as never)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('shows the empty message and a zero count without items', () => {
        renderCard([], 'feedback')

        expect(screen.getByText('Nothing here')).toBeTruthy()
        expect(screen.getByText('0')).toBeTruthy()
    })

    it('renders each item and the count', () => {
        renderCard(
            [
                { type: 'text', content: 'Heads up', value: 'Be careful' },
                { type: 'keyvalue', content: 'BMI', value: '22' },
            ],
            'feedback'
        )

        expect(screen.getByText('Be careful')).toBeTruthy()
        expect(screen.getByText('22')).toBeTruthy()
        expect(screen.getByText('2')).toBeTruthy()
        expect(screen.queryByText('Nothing here')).toBeNull()
    })

    it('names the rule behind an item when it can be traced', () => {
        mockedTrace.mockReturnValue({
            ruleId: 'r1',
            ruleActionType: 'DISPLAYTEXT',
        } as never)

        renderCard(
            [{ type: 'text', content: 'Heads up', value: 'x' }],
            'feedback'
        )

        expect(screen.getByText('DISPLAYTEXT · Rule r1')).toBeTruthy()
    })

    it.each([
        ['text', 'DISPLAYTEXT'],
        ['keyvalue', 'DISPLAYKEYVALUEPAIR'],
    ])('falls back to the default action for %s items', (type, actionType) => {
        renderCard([{ type, content: 'c', value: 'v' }], 'indicator')

        expect(screen.getByText(actionType)).toBeTruthy()
    })
})
