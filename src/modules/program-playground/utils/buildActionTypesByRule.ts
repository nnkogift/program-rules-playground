type RuleLike = {
    id?: string
    programRuleActions?: readonly { programRuleActionType: string }[]
}

/** Maps each program rule id to the action types it can produce. */
export function buildActionTypesByRule(
    rules: readonly RuleLike[]
): Map<string, string[]> {
    const byRule = new Map<string, string[]>()
    for (const rule of rules) {
        if (!rule.id) {
            continue
        }
        byRule.set(
            rule.id,
            (rule.programRuleActions ?? []).map(
                (action) => action.programRuleActionType
            )
        )
    }
    return byRule
}
