import { fireEvent, render, screen } from '@testing-library/react'
import { CompletionBanner } from './CompletionBanner'
import type { CompletionIssue } from '@/modules/program-playground/utils/completionIssues'

const error: CompletionIssue = {
    key: 'error:a',
    kind: 'error',
    fieldId: 'a',
    label: 'Weight',
    message: 'Too heavy',
}
const warning: CompletionIssue = {
    key: 'warning:b',
    kind: 'warning',
    message: 'Check the chart',
}

describe('CompletionBanner', () => {
    it('blocks completion when there is an error', () => {
        const onBackToEditing = jest.fn()
        render(
            <CompletionBanner
                issues={[error, warning]}
                onBackToEditing={onBackToEditing}
                onCompleteAnyway={jest.fn()}
            />
        )
        expect(screen.getByRole('alert')).toBeTruthy()
        expect(screen.getByText('Too heavy', { exact: false })).toBeTruthy()
        expect(
            screen.queryByRole('button', { name: 'Complete anyway' })
        ).toBeNull()
        fireEvent.click(screen.getByRole('button', { name: 'Back to editing' }))
        expect(onBackToEditing).toHaveBeenCalled()
    })

    it('offers Complete anyway for warnings only', () => {
        const onCompleteAnyway = jest.fn()
        render(
            <CompletionBanner
                issues={[warning]}
                onBackToEditing={jest.fn()}
                onCompleteAnyway={onCompleteAnyway}
            />
        )
        fireEvent.click(screen.getByRole('button', { name: 'Complete anyway' }))
        expect(onCompleteAnyway).toHaveBeenCalled()
    })

    it('links field issues to the field and leaves field-less ones as text', () => {
        const scrollIntoView = jest.fn()
        Element.prototype.scrollIntoView = scrollIntoView
        document.body.insertAdjacentHTML(
            'beforeend',
            '<div data-field-id="a"><input /></div>'
        )
        render(
            <CompletionBanner
                issues={[error, warning]}
                onBackToEditing={jest.fn()}
                onCompleteAnyway={jest.fn()}
            />
        )
        fireEvent.click(screen.getByRole('button', { name: 'Weight' }))
        expect(scrollIntoView).toHaveBeenCalled()
        expect(document.activeElement?.tagName).toBe('INPUT')
        expect(
            screen.queryByRole('button', { name: 'Check the chart' })
        ).toBeNull()
    })
})
