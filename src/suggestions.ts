import {ProtyleHelpers} from "@/protyleHelpers";
import {Settings} from "@/settings";
import {getChildBlocks, updateBlock} from "@/api";
import {SpellCheckerUI} from "@/spellCheckerUI";
import {showMessage} from "siyuan";
import SpellCheckPlugin from "@/index";
import {Suggestion} from "@/spellChecker";

interface StoredBlock {
    spellChecker: SpellCheckerUI;
    suggestions: Suggestion[];
}

type BlockStorage = Record<string, StoredBlock>;

export class SuggestionEngine {

    private blockStorage: BlockStorage = {};
    private plugin: SpellCheckPlugin;

    public documentID: string;
    public documentEnabled: boolean = false;
    public documentLanguage: string = 'auto';

    constructor(plugin: SpellCheckPlugin) {
        this.plugin = plugin
    }

    public getStorage(): BlockStorage {
        return this.blockStorage
    }
    public clearStorage() {
        for(let blockID in this.blockStorage) {
            this.blockStorage[blockID].spellChecker.destroy()
            delete this.blockStorage[blockID]
        }
    }

    private async discoverBlocks(blockID: string) {
        const children = await getChildBlocks(blockID)
        if(children.length == 0) {
            if(!(blockID in this.blockStorage)) {
                const spellChecker = new SpellCheckerUI(blockID, this.documentID)
                this.blockStorage[blockID] = {
                    spellChecker: spellChecker,
                    suggestions: []
                }
            }
        }else{
            for (const child of children) {
                await this.discoverBlocks(child.id)
            }
        }
    }

    public async forAllBlocksSuggest(docID: string, suggest: boolean, render: boolean, remove: boolean) {
        if(!this.documentEnabled) { return }
        if(suggest) {
            await this.discoverBlocks(docID) // updates this.blockStorage
        }
        const blockPromises = Object.keys(this.blockStorage).map(async (blockID) => {
            if(suggest) {
                await this.suggestForBlock(blockID)
            }
            if(render) {
                await this.renderSuggestions(blockID)
            }
            if(remove) {
                await this.removeSuggestionsAndRender(blockID)
            }
        });
        await Promise.all(blockPromises);
    }

    public async suggestAndRender(blockID: string) {
        if(!this.documentEnabled) { return }
        await this.suggestForBlock(blockID)
        await this.renderSuggestions(blockID)
    }

    public async suggestForBlock(blockID: string) {

        let suggestions: Suggestion[]
        const text = ProtyleHelpers.fastGetBlockText(blockID)
        if(text == null || !this.documentEnabled) {
            return
        }
        if(!(blockID in this.blockStorage)) {
            await this.discoverBlocks(blockID)
            return this.suggestForBlock(blockID)
        }

        if(this.plugin.settingsUtil.get('offline')) {
            suggestions = await this.plugin.offlineSpellChecker.check(text, [this.documentLanguage])
        }else{
            try {
                suggestions = await this.plugin.onlineSpellChecker.check(text, [this.documentLanguage])
            }catch (_) {
                showMessage(this.plugin.i18nx.errors.checkServer, 5000, 'error')
            }
        }

        this.blockStorage[blockID].suggestions = suggestions

    }

    public async removeSuggestionsAndRender(blockID: string) {
        this.blockStorage[blockID].spellChecker.clearUnderlines()
    }

    public async renderSuggestions(blockID: string) {
        if(!(blockID in this.blockStorage) || !this.documentEnabled) {
            return
        }
        this.blockStorage[blockID].spellChecker.clearUnderlines()
        this.blockStorage[blockID].suggestions.forEach(suggestion => {
            if(!Settings.isInCustomDictionary(SuggestionEngine.suggestionToWrongText(suggestion, blockID), this.plugin.settingsUtil)) {
                this.blockStorage[blockID].spellChecker.highlightCharacterRange(suggestion.offset, suggestion.offset + suggestion.length)
            }
        })
    }

    static suggestionToWrongText(suggestion: Suggestion, blockID: string): string {
        const blockTxt = ProtyleHelpers.fastGetBlockText(blockID)
        return blockTxt.slice(suggestion.offset, suggestion.offset + suggestion.length)
    }

    private getAbsoluteOffsetInBlock(range: Range, blockID: string): number {

        const block = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
            ? (range.commonAncestorContainer as Element).closest(`[data-node-id="${blockID}"]`)
            : (range.commonAncestorContainer as Text).parentElement!.closest(`[data-node-id="${blockID}"]`);
        if (!block) return -1;

        const measureToRange = range.cloneRange();
        measureToRange.setStart(block, 0);
        measureToRange.setEnd(range.startContainer, range.startOffset);

        return measureToRange.toString().length;

    }

    // given the content of a "wrong" span, get the suggestion number
    public getSuggestionNumber(blockID: string, range: Range): number {

        const offset = this.getAbsoluteOffsetInBlock(range, blockID)
        let suggNo = -1

        this.blockStorage[blockID].suggestions.forEach((suggestion, i) => {
            if(offset >= suggestion.offset && offset <= suggestion.offset + suggestion.length) {
                suggNo = i
            }
        })

        return suggNo

    }

    // correct the error in the block
    public async correctSuggestion(blockID: string, suggestionNumber: number, correctionNumber: number) {

        if (suggestionNumber == -1) {
            return
        }

        console.log("dbg " + blockID + ' ' + suggestionNumber + ' ' + correctionNumber)
        console.log(this.blockStorage)
        const suggestion = this.blockStorage[blockID].suggestions[suggestionNumber]
        const rich = ProtyleHelpers.fastGetBlockHTML(blockID)
        const fixedOffset = this.adjustIndexForTags(rich, suggestion.offset)
        const newStr = rich.slice(0, fixedOffset) + suggestion.replacements[correctionNumber] + rich.slice(fixedOffset + suggestion.length)

        console.log("new str " + newStr);
        await updateBlock('markdown', window.Lute.New().BlockDOM2Md(newStr), blockID)
        void this.suggestAndRender(blockID)

    }

    private adjustIndexForTags(html: string, plainIdx: number): number {
        let plain = 0; // characters consumed in s1
        let rich  = 0; // characters consumed in s2

        while (rich < html.length && plain < plainIdx) {
            if (html[rich] === '<') {
                // skip entire tag in s2
                while (rich < html.length && html[rich] !== '>') rich++;
                rich++;                       // include the '>'
            } else {
                // normal character: advance both counters
                rich++;
                plain++;
            }
        }
        return rich; // index inside s2
    }

}