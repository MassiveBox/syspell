import {IProtyle, Plugin, showMessage} from 'siyuan';
import {ProtyleHelper} from "@/protyleHelper";
import {Style} from "@/style";
import {Analytics} from "@/analytics";
import {SuggestionEngine} from "@/suggestions";
import {Menus} from "@/menus";
import {ESpellChecker} from "@/espells";
import {LanguageTool, LanguageToolSettings} from "@/languagetool";
import {HunspellDictManager} from "@/hunspellDictManager";
import {Language} from "@/spellChecker";
import {Settings} from "@/settings";


export default class SpellCheckPlugin extends Plugin {

    private menus: Menus
    private currentlyEditing: { protyle: ProtyleHelper, enabled: boolean, language: string };

    public settings: Settings;
    public suggestions: SuggestionEngine
    public analytics: Analytics
    public i18nx: any; // This object is just a copy of i18n, but with type "any" to not trigger type errors

    public offlineSpellChecker: ESpellChecker
    public onlineSpellChecker: LanguageTool

    public static ENABLED_ATTR = 'custom-spellcheck-enable'
    public static LANGUAGE_ATTR = 'custom-spellcheck-language'

    async onload() {

        this.i18nx = this.i18n
        new Style(this);

        this.settings = new Settings(this)
        await this.settings.load()
        this.analytics = new Analytics(this.settings.get('analytics'));
        this.suggestions = new SuggestionEngine(this)
        this.menus = new Menus(this)
        await this.prepareSpellCheckers()

        void this.analytics.sendEvent('load')

        if (window.siyuan.config.editor.spellcheck) {
            showMessage(this.i18nx.errors.builtInEnabled, -1, 'error')
        }

        this.eventBus.on('ws-main', async (event) => {

            if (event.detail.cmd != 'transactions') {
                void this.suggestions.forAllBlocksSuggest(false, true)
                return
            }

            const operation = event.detail.data[0].doOperations[0]
            const action = operation.action
            const blockID = operation.id

            if (action != 'update' || !this.currentlyEditing.enabled) {
                return
            }

            await this.suggestions.storeBlocks(this.currentlyEditing.protyle, this.currentlyEditing.language)
            await this.suggestions.suggestAndRender(blockID)
            void this.suggestions.forAllBlocksSuggest(false, true)

        })

        this.eventBus.on('open-menu-content', async (event) => {

            void this.analytics.sendEvent('menu-open-any');
            const blockID = ProtyleHelper.getNodeId(event.detail.range.startContainer.parentElement)

            const suggNo = this.suggestions.getSuggestionNumber(blockID, event.detail.range)
            this.menus.addCorrectionsToParagraphMenu(blockID, suggNo, event.detail.menu)

        })

        this.eventBus.on('open-menu-doctree', async (event) => {
            const docID = ProtyleHelper.getNodeId(event.detail.elements[0]) // @TODO this is ugly, why does the event not carry the docID?
            void this.menus.addSettingsToDocMenu(docID, event.detail.menu)
        })

        this.eventBus.on('switch-protyle', async (event) => {
            void this.suggestions.forAllBlocksSuggest(false, true)
            const documentSettings = await ProtyleHelper.getDocumentSettings(event.detail.protyle.block.id,
                this.settings.get('enabledByDefault'), this.settings.get('defaultLanguage'))
            if(documentSettings.language == 'auto' && !this.settings.get('offline') && this.settings.get('reportAuto')) {
                showMessage(this.i18nx.errors.autoLanguage, -1, 'info')
            }
            this.currentlyEditing = {
                protyle: new ProtyleHelper(event.detail.protyle.contentElement),
                enabled: documentSettings.enabled,
                language: documentSettings.language
            }
            new ResizeObserver(
                this.suggestions.forAllBlocksSuggest.bind(this.suggestions)
            ).observe(event.detail.protyle.contentElement)
        })

        this.eventBus.on('loaded-protyle-static', async (event) => {
            await this.protyleLoad(event)
        })
        this.eventBus.on('loaded-protyle-dynamic', async (event) => {
            await this.protyleLoad(event)
        })

    }

    onunload() {
        void this.analytics.sendEvent('unload');
    }

    uninstall() {
        void this.analytics.sendEvent('uninstall');
    }

    async openSetting() {
        await this.settings.openSettingsDialog()
    }

    private async protyleLoad(event: CustomEvent<{ protyle: IProtyle; }>) {

        const protyle = new ProtyleHelper(event.detail.protyle.contentElement)
        const docID = event.detail.protyle.block.id

        const settings = await ProtyleHelper.getDocumentSettings(docID,
            this.settings.get('enabledByDefault'), this.settings.get('defaultLanguage'))

        if(settings.enabled) {
            await this.suggestions.storeBlocks(protyle, settings.language)
            const useOnline = !this.settings.get('offline');
            void this.suggestions.forAllBlocksSuggest(true, true, useOnline ? undefined : 10);
        }

    }

    private async prepareSpellCheckers() {

        this.onlineSpellChecker = new LanguageTool(<LanguageToolSettings>this.settings.dump())
        const offlineLanguages = this.settings.get('offlineDicts').split(',')

        let langs: {aff: string, dic: string, language: Language}[] = []

        try {
            for(const lang of offlineLanguages) {
                const { aff, dic } = await HunspellDictManager.loadDictionary(lang, true)
                langs.push({aff: aff, dic: dic, language: {name: lang, code: lang, longCode: lang}})
            }
            this.offlineSpellChecker = new ESpellChecker(langs)
        }catch (e){
            console.error(e)
            showMessage(this.i18nx.errors.hunspellLoadError + e, -1, 'error')
        }

    }

}