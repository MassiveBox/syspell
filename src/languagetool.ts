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
        return this.languages
    }
    private languages: Language[] = [{"name":"German","code":"de","longCode":"de"},{"name":"German (Germany)","code":"de","longCode":"de-DE"},{"name":"German (Austria)","code":"de","longCode":"de-AT"},{"name":"German (Swiss)","code":"de","longCode":"de-CH"},{"name":"English","code":"en","longCode":"en"},{"name":"English (US)","code":"en","longCode":"en-US"},{"name":"English (Australian)","code":"en","longCode":"en-AU"},{"name":"English (GB)","code":"en","longCode":"en-GB"},{"name":"English (Canadian)","code":"en","longCode":"en-CA"},{"name":"English (New Zealand)","code":"en","longCode":"en-NZ"},{"name":"English (South African)","code":"en","longCode":"en-ZA"},{"name":"Spanish","code":"es","longCode":"es"},{"name":"Spanish (voseo)","code":"es","longCode":"es-AR"},{"name":"French","code":"fr","longCode":"fr"},{"name":"French (Canada)","code":"fr","longCode":"fr-CA"},{"name":"French (Switzerland)","code":"fr","longCode":"fr-CH"},{"name":"French (Belgium)","code":"fr","longCode":"fr-BE"},{"name":"Dutch","code":"nl","longCode":"nl"},{"name":"Dutch (Belgium)","code":"nl","longCode":"nl-BE"},{"name":"Portuguese (Angola preAO)","code":"pt","longCode":"pt-AO"},{"name":"Portuguese (Brazil)","code":"pt","longCode":"pt-BR"},{"name":"Portuguese (Moçambique preAO)","code":"pt","longCode":"pt-MZ"},{"name":"Portuguese (Portugal)","code":"pt","longCode":"pt-PT"},{"name":"Portuguese","code":"pt","longCode":"pt"},{"name":"Arabic","code":"ar","longCode":"ar"},{"name":"Asturian","code":"ast","longCode":"ast-ES"},{"name":"Belarusian","code":"be","longCode":"be-BY"},{"name":"Breton","code":"br","longCode":"br-FR"},{"name":"Catalan","code":"ca","longCode":"ca-ES"},{"name":"Catalan (Valencian)","code":"ca","longCode":"ca-ES-valencia"},{"name":"Catalan (Balearic)","code":"ca","longCode":"ca-ES-balear"},{"name":"Danish","code":"da","longCode":"da-DK"},{"name":"Simple German","code":"de-DE-x-simple-language","longCode":"de-DE-x-simple-language"},{"name":"Greek","code":"el","longCode":"el-GR"},{"name":"Esperanto","code":"eo","longCode":"eo"},{"name":"Persian","code":"fa","longCode":"fa"},{"name":"Irish","code":"ga","longCode":"ga-IE"},{"name":"Galician","code":"gl","longCode":"gl-ES"},{"name":"Italian","code":"it","longCode":"it"},{"name":"Japanese","code":"ja","longCode":"ja-JP"},{"name":"Khmer","code":"km","longCode":"km-KH"},{"name":"Polish","code":"pl","longCode":"pl-PL"},{"name":"Romanian","code":"ro","longCode":"ro-RO"},{"name":"Russian","code":"ru","longCode":"ru-RU"},{"name":"Slovak","code":"sk","longCode":"sk-SK"},{"name":"Slovenian","code":"sl","longCode":"sl-SI"},{"name":"Swedish","code":"sv","longCode":"sv"},{"name":"Tamil","code":"ta","longCode":"ta-IN"},{"name":"Tagalog","code":"tl","longCode":"tl-PH"},{"name":"Ukrainian","code":"uk","longCode":"uk-UA"},{"name":"Chinese","code":"zh","longCode":"zh-CN"},{"name":"Crimean Tatar","code":"crh","longCode":"crh-UA"},{"name":"Norwegian (Bokmål)","code":"nb","longCode":"nb"},{"name":"Norwegian (Bokmål)","code":"no","longCode":"no"},{"name":"Dutch","code":"nl","longCode":"nl-NL"},{"name":"Simple German","code":"de-DE-x-simple-language","longCode":"de-DE-x-simple-language-DE"},{"name":"Spanish","code":"es","longCode":"es-ES"},{"name":"Italian","code":"it","longCode":"it-IT"},{"name":"Persian","code":"fa","longCode":"fa-IR"},{"name":"Swedish","code":"sv","longCode":"sv-SE"},{"name":"German","code":"de","longCode":"de-LU"},{"name":"French","code":"fr","longCode":"fr-FR"}]

}