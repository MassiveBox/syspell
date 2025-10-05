import {Language, SpellChecker, Suggestion} from "@/spellChecker";
import { Espells } from "espells"

export class ESpellChecker implements SpellChecker {

    spellchecker: Espells
    loadedLanguages: Language[]

    constructor(languages: {aff: string, dic: string, language: Language}[]) {
        this.spellchecker = new Espells({aff: languages[0].aff, dic: languages.map(l => l.dic)})
        this.loadedLanguages = languages.map(l => l.language)
    }

    async check(text: string, _: string[]): Promise<Suggestion[]> {

        let suggestions: Suggestion[] = []

        const regex = /[\p{L}']+/gu;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const word = match[0];
            const counter = match.index;
            const {correct} = this.spellchecker.lookup(word)
            if(!correct) {
                const hsSuggestions = this.spellchecker.suggest(word)
                    suggestions.push({
                        typeName: "UnknownWord",
                        message: word,
                        shortMessage: "Misspelled word",
                        replacements: hsSuggestions,
                        offset: counter,
                        length: word.length
                    })
            }
        }

        return suggestions
    }

    async getLanguages(): Promise<Language[]> {
        return this.loadedLanguages
    }

}