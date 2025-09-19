import {ProtyleHelpers} from "@/protyleHelpers";

export class SpellChecker {

    private readonly blockID: string;
    private readonly docID: string;
    private block: HTMLElement;
    private overlay: HTMLElement;

    constructor(blockID: string, docID: string) {
        this.blockID  = blockID;
        this.docID = docID;
        this.setBlock()
    }

    private setBlock() {

        this.block = <HTMLElement>ProtyleHelpers.fastGetBlockElement(this.blockID)
        let overlay = <HTMLElement>ProtyleHelpers.fastGetOverlayElement(this.blockID)

        if(overlay == null) {
            this.overlay = document.createElement('div')
            this.overlay.className = 'underline-overlay';
            this.overlay.setAttribute('for-block-id', this.blockID)
            const protyleTitle = ProtyleHelpers.fastGetTitleElement(this.docID)
            protyleTitle?.append(this.overlay)
        }else{
            if(this.overlay == null) {
                this.overlay = overlay
            }
        }

    }

    public highlightCharacterRange(startIndex: number, endIndex: number) {

        this.setBlock()

        // Get all text content
        const textContent = this.block?.innerText || '';
        if (startIndex >= textContent.length || endIndex > textContent.length || startIndex >= endIndex) {
            console.log('Invalid range');
            return;
        }

        // Find the text nodes and character positions
        const range = this.createRangeFromCharacterIndices(startIndex, endIndex);
        if (range) {
            this.createUnderlineFromRange(range, endIndex - startIndex);
        }
    }

    private createRangeFromCharacterIndices(startIndex: number, endIndex: number) {
        // Get the innerHTML and create a temporary container to parse it
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = this.block.innerHTML;

        // Walk through all nodes (including text and elements) to build character map
        const walker = document.createTreeWalker(
            this.block,
            NodeFilter.SHOW_TEXT,
            null
        );

        let currentIndex = 0;
        let startNode = null, startOffset = 0;
        let endNode = null, endOffset = 0;
        let textNode;

        // Build a map of character positions to actual DOM text nodes
        while (textNode = walker.nextNode()) {
            const nodeLength = textNode.length;
            const nodeEndIndex = currentIndex + nodeLength;

            // Find start position
            if (startNode === null && startIndex >= currentIndex && startIndex < nodeEndIndex) {
                startNode = textNode;
                startOffset = startIndex - currentIndex;
            }

            // Find end position
            if (endIndex > currentIndex && endIndex <= nodeEndIndex) {
                endNode = textNode;
                endOffset = endIndex - currentIndex;
                break;
            }

            currentIndex = nodeEndIndex;
        }

        if (startNode && endNode) {
            const range = document.createRange();
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);
            return range;
        }

        return null;
    }

    private createUnderlineFromRange(range: Range, charsCount:  number) {
        const rects = range.getClientRects();
        const editorRect = this.block.getBoundingClientRect();

        for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            const underline = document.createElement('div');
            underline.className = 'error-underline';

            const left = rect.left - editorRect.left + this.block.scrollLeft;
            const top = rect.bottom - editorRect.top - 2 + this.block.scrollTop;
            const width = rect.width;

            const offset = SpellChecker.distance(this.overlay, this.block)

            underline.style.left = (left + offset.h) + 'px';
            underline.style.top = (top + 2 + offset.v) + 'px';
            underline.style.width = width + 'px';

            if(!SpellChecker.checkDontUnderline(width, charsCount)) {
                this.overlay.appendChild(underline);
            }
        }
    }

    // if the underline is too wide for the number of characters that are underlined, we don't render it
    // this is a consequence of using .innerText: things like <img> tags are only a character
    private static checkDontUnderline(width: number, charsCount: number) {
        const maxWidthPerChar = 16;
        return width > maxWidthPerChar * charsCount
    }

    private static distance(elA: HTMLElement, elB: HTMLElement): {h: number, v: number} {
        const rectA = elA.getBoundingClientRect();
        const rectB = elB.getBoundingClientRect();
        return {
            h: Math.abs(rectA.left - rectB.left),
            v: Math.abs(rectA.top - rectB.top)
        }
    }

    public clearUnderlines() {
        this.overlay.innerHTML = '';
    }

    public destroy() {
        let overlay = <HTMLElement>ProtyleHelpers.fastGetOverlayElement(this.blockID)
        overlay?.remove();
    }

}