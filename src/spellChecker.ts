export type Language = { name: string; code: string; longCode: string; }

export type Suggestion = {
    message: string
    shortMessage: string
    replacements: string[]
    offset: number
    length: number
    typeName: string
}

export interface SpellChecker {
    check(text: string, languages: string[]): Promise<Suggestion[]>
    getLanguages(): Promise<Language[]>
}