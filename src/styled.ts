export const styled = (parts: TemplateStringsArray, ...values: any[]) =>
    parts.map((part, i) => `${part}${values[i] || ''}`).join('');