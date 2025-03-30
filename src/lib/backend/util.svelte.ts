export function convertToConfig<T>(
    input: Record<string, unknown>,
    defaults: {
        [K in keyof T]: T[K]
    },
): T {
    const result = { ...defaults }

    for (const key in defaults) {
        if (key in input) {
            const inputValue = input[key]
            const defaultValue = defaults[key]

            // Check if the types match
            if (
                typeof inputValue === typeof defaultValue ||
                (Array.isArray(inputValue) && Array.isArray(defaultValue)) ||
                (inputValue === null && defaultValue === null) ||
                (inputValue instanceof Date && defaultValue instanceof Date)
            ) {
                ;(result as any)[key] = inputValue
            }
        }
    }

    const resultState = $state(result)
    return resultState
}
