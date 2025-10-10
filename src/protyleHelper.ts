import {getBlockAttrs} from "@/api";
import SpellCheckPlugin from "@/index";

export class ProtyleHelper {

    private contentElement: Element

    constructor(contentElement?: Element) {
        this.contentElement = contentElement || document.documentElement;
    }

    // We shouldn't use JavaScript elements to get data in blocks, but the kernel API is noticeably too slow for this.
    // We must try to keep the dependency to the HTML to a minimum.

    // doesn't use kernel API, so it's faster
    public fastGetBlockElement(blockID: string): Element {
        const wrapper = Array.from(
            this.contentElement.querySelectorAll(`div[data-node-id="${blockID}"]`)
        ).find(el =>
            !el.closest('.protyle-wysiwyg__embed')   // true = not inside that class
        );

        return wrapper?.querySelector(':scope > [contenteditable="true"]') ?? null;
    }

    public fastGetBlockHTML(blockID: string): string {
        return this.fastGetBlockElement(blockID).innerHTML
    }

    public fastGetBlockText(blockID: string): string {
        return this.fastGetBlockElement(blockID)?.textContent
    }

    public fastGetTitleElement() {
        const container = this.contentElement.querySelector(`div.protyle-title.protyle-wysiwyg--attr`); // [data-node-id="${docID}"]
        if (!container) return null;
        return container.querySelector('div.protyle-title__input[contenteditable="true"]');
    }

    public static fastGetOverlayElement(blockID: string): Element {
        return document.querySelector(`div.underline-overlay[for-block-id="${blockID}"]`)
    }

    // given an element such as a span inside a block, return its blockID
    public static getNodeId(el: Element) {
        let i = 0;
        while (el && i < 50) {
            if (el.hasAttribute('data-node-id')) {
                return el.getAttribute('data-node-id');
            }
            el = el.parentElement;
            i++;
        }
        return null;
    }

    public static async getDocumentSettings(docID: string, enabledByDefault: boolean, defaultLanguage: string): Promise<{enabled: boolean, language: string} | null> {
        const attrs = await getBlockAttrs(docID)
        if(attrs == null) { return null }
        return {
            enabled: (SpellCheckPlugin.ENABLED_ATTR in attrs) ?  attrs[SpellCheckPlugin.ENABLED_ATTR] == 'true' : enabledByDefault,
            language: (SpellCheckPlugin.LANGUAGE_ATTR in attrs) ? attrs[SpellCheckPlugin.LANGUAGE_ATTR] : defaultLanguage
        }
    }

    public getBlockElements(): Element[] {
        const allElements: Set<Element> = new Set();
        this.contentElement.querySelectorAll('[data-node-id]').forEach(el => {
            allElements.add(el);
        });
        return Array.from(allElements);
    }

    public toNode(): Node {
        return this.contentElement
    }

}