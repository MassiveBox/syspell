import {Language, Suggestion} from "@/spellChecker";
import {SpellChecker} from "@/spellChecker";

type LanguageToolSuggestion = {
    message: string
    shortMessage: string
    replacements: Array<{
        value: string
        type: string
    }>
    offset: number
    length: number
    context: {
        text: string
        offset: number
        length: number
    }
    sentence: string
    type: {
        typeName: string
    }
    rule: {
        id: string
        description: string
        issueType: string
        category: {
            id: string
            name: string
        }
        isPremium: boolean
        confidence: number
    }
    ignoreForIncompleteSentence: boolean
    contextForSureMatch: number
}
interface HTTPError extends Error {
    status?: number;
}
export type LanguageToolSettings = {
    server: string
    username: string
    apiKey: string
    picky: boolean
    motherTongue: string
    preferredVariants: string
}

export class LanguageTool implements SpellChecker {

    private settings: LanguageToolSettings;

    constructor(settings: LanguageToolSettings) {
        this.settings = settings
    }

    public async check(text: string, languages: string[]): Promise<Suggestion[]> {

        const language = languages.length > 0 ? languages[0] : 'auto';

        const body = new URLSearchParams({
            text: text,
            language: language,
            level: this.settings.picky ? 'picky' : 'default',
            motherTongue: this.settings.motherTongue == '' ? window.navigator.language : this.settings.motherTongue,
        });

        if(this.settings.username != '') {
            body.append('username', this.settings.username);
        }
        if(this.settings.apiKey) {
            body.append('apiKey', this.settings.apiKey);
        }
        if(language == 'auto') {
            body.append('preferredVariants', this.settings.preferredVariants)
        }

        const res = await fetch(this.settings.server + 'v2/check', {method: 'POST', body});
        if(res.status != 200) {
            const err = new Error('Network error') as HTTPError
            err.status  = res.status;
            throw err
        }

        const suggestions: LanguageToolSuggestion[] = (await res.json()).matches;
        return suggestions.map((suggestion) => {
            const ret: Suggestion  = {
                message: suggestion.message,
                shortMessage: suggestion.shortMessage,
                replacements: suggestion.replacements.map((replacement) => {
                    return replacement.value
                }),
                offset: suggestion.offset,
                length: suggestion.length,
                typeName: suggestion.type.typeName
            }
            return ret
        });

    }

    public async getLanguages(): Promise<Language[]> {
        const res = await fetch(this.settings.server + 'v2/languages', {method: 'GET'});
        return await res.json();
    }


}