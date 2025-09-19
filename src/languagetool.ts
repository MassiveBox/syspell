import {PluginSettings} from "@/settings";

export type Suggestion = {
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

export type Language = { name: string; code: string; longCode: string; }
interface HTTPError extends Error {
    status?: number;
}

export class LanguageTool {

    public static async check(text: string, language: string, settings: PluginSettings): Promise<Suggestion[]> {

        const body = new URLSearchParams({
            text: text,
            language: language,
            level: settings.picky ? 'picky' : 'default',
            motherTongue: settings.motherTongue == '' ? window.navigator.language : settings.motherTongue,
        });

        if(settings.username != '') {
            body.append('username', settings.username);
        }
        if(settings.apiKey) {
            body.append('apiKey', settings.apiKey);
        }
        if(language == 'auto') {
            body.append('preferredVariants', settings.preferredVariants)
        }

        const res = await fetch(settings.server + 'v2/check', {method: 'POST', body});
        if(res.status != 200) {
            const err = new Error('Network error') as HTTPError
            err.status  = res.status;
            throw err
        }

        const json = await res.json();
        return json.matches;

    }

    public static async getLanguages(settings: PluginSettings): Promise<Language[]> {
        const res = await fetch(settings.server + 'v2/languages', {method: 'GET'});
        return await res.json();
    }


}