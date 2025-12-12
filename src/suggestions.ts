import {ProtyleHelper} from "@/protyleHelper";
import {updateBlock} from "@/api";
import {SpellCheckerUI} from "@/spellCheckerUI";
import {showMessage} from "siyuan";
import SpellCheckPlugin from "@/index";
import {Suggestion} from "@/spellChecker";

interface StoredBlock {
    spellChecker: SpellCheckerUI;
    language: string;
    suggestions: Suggestion[] | null;
    protyle: ProtyleHelper;
}

type BlockStorage = Record<string, StoredBlock>;

export class SuggestionEngine {

    private blockStorage: BlockStorage = {};
    private plugin: SpellCheckPlugin;

    private static blacklisted: string[] = [
        "span[data-type='inline-math']",
        "span[data-type='img']",
        "span[data-type='code']"
    ];

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

    public getProtyle(blockID: string) {
        if(!(blockID in this.blockStorage)) { return null }
        return this.blockStorage[blockID].protyle
    }

    public async storeBlocks(protyle: ProtyleHelper, documentLanguage: string) {
        const blocks = protyle.getBlockElements()
        blocks.forEach(block => {
            const blockID = ProtyleHelper.getNodeId(block)
            if(!blockID) {
                return
            }
            if(!(blockID in this.blockStorage)) {
                try {
                    const spellChecker = new SpellCheckerUI(blockID, protyle)
                    this.blockStorage[blockID] = {
                        spellChecker: spellChecker,
                        language: documentLanguage,
                        suggestions: null,
                        protyle: protyle
                    }
                }catch (_) {}
            }
        })
    }

    public async forAllBlocksSuggest(suggest: boolean = false, render: boolean = true, concurrencyLimit: number = 1000) {

        const blockIDs = Object.keys(this.blockStorage);
        for (let i = 0; i < blockIDs.length; i += concurrencyLimit) {

            const batch = blockIDs.slice(i, i + concurrencyLimit);
            const blockPromises = batch.map(async (blockID) => {
                if(!(blockID in this.blockStorage)) {
                    return
                }
                if(suggest === true && this.blockStorage[blockID].suggestions == null) {
                    await this.suggestForBlock(blockID)
                }
                if(render) {
                    await this.renderSuggestions(blockID)
                }
            });
            await Promise.all(blockPromises);
            // yield to the event loop to prevent UI freezing
            await new Promise(resolve => setTimeout(resolve, 1));

        }

    }

    public async suggestAndRender(blockID: string) {
        await this.suggestForBlock(blockID)
        await this.renderSuggestions(blockID)
    }

    public async suggestForBlock(blockID: string) {

        if(!(blockID in this.blockStorage)) {
            return
        }
        const thisBlock = this.blockStorage[blockID]
        thisBlock.suggestions = [] // we change from null so that it doesn't run again in forAllBlocksSuggest if we're waiting for the spell checker

        let suggestions: Suggestion[]
        const text = thisBlock.protyle.fastGetBlockText(blockID)
        if(text == null || text == '') {
            return
        }

        if(this.plugin.settings.get('offline')) {
            suggestions = await this.plugin.offlineSpellChecker.check(text, [thisBlock.language])
            thisBlock.suggestions = suggestions
        }else{
            try {
                suggestions = await this.plugin.onlineSpellChecker.check(text, [thisBlock.language])
                thisBlock.suggestions = suggestions
            }catch (_) {
                showMessage(this.plugin.i18nx.errors.checkServer, 5000, 'error')
                thisBlock.suggestions = null
            }
        }

    }

    public async removeSuggestionsAndRender(blockID: string) {
        this.blockStorage[blockID].spellChecker.clearUnderlines()
    }

    public async renderSuggestions(blockID: string) {

        if(!(blockID in this.blockStorage)) {
            return
        }
        const thisBlock = this.blockStorage[blockID]
        if(!document.contains(thisBlock.protyle.toNode())) {
            delete this.blockStorage[blockID]
            return
        }

        thisBlock.spellChecker.clearUnderlines()

        thisBlock.suggestions?.forEach(suggestion => {
            if(this.shouldSuggest(blockID, thisBlock, suggestion) &&
                !this.plugin.settings.isInCustomDictionary(this.suggestionToWrongText(suggestion, blockID))) {
                try {
                    thisBlock.spellChecker.highlightCharacterRange(suggestion.offset, suggestion.offset + suggestion.length)
                }catch (_) {
                    delete this.blockStorage[blockID]
                }
            }
        })

    }

    private shouldSuggest(blockID: string, block: StoredBlock, suggestion: Suggestion): boolean {

        const element = block.protyle.fastGetBlockElement(blockID)
        const eaiStart = ProtyleHelper.getElementAtTextIndex(element, suggestion.offset)
        const eaiEnd = ProtyleHelper.getElementAtTextIndex(element, suggestion.offset + suggestion.length)

        return !SuggestionEngine.blacklisted.some(blacklisted =>
            (eaiStart instanceof Element && eaiStart.matches(blacklisted)) ||
            (eaiEnd instanceof Element && eaiEnd.matches(blacklisted))
        );

    }

    public suggestionToWrongText(suggestion: Suggestion, blockID: string): string {
        if(!(blockID in this.blockStorage)) {
            return
        }
        const blockTxt = this.blockStorage[blockID].protyle.fastGetBlockText(blockID)
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

        this.blockStorage[blockID].suggestions?.forEach((suggestion, i) => {
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
        const rich = new ProtyleHelper().fastGetBlockHTML(blockID)
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