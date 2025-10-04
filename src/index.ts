import {Plugin, showMessage} from 'siyuan';
import {ProtyleHelpers} from "@/protyleHelpers";
import {Icons} from "@/icons";
import {Settings} from "@/settings";
import {SettingUtils} from "@/libs/setting-utils";
import {Analytics} from "@/analytics";
import {SuggestionEngine} from "@/suggestions";
import {Menus} from "@/menus";
import {ESpellChecker} from "@/espells";
import {LanguageTool, LanguageToolSettings} from "@/languagetool";
import {HunspellDictManager} from "@/hunspellDictManager";
import {Language} from "@/spellChecker";


export default class SpellCheckPlugin extends Plugin {

    private menus: Menus

    public settingsUtil: SettingUtils;
    public suggestions: SuggestionEngine
    public analytics: Analytics
    public i18nx: any; // This object is just a copy of i18n, but with type "any" to not trigger type errors

    public offlineSpellChecker: ESpellChecker
    public onlineSpellChecker: LanguageTool

    public static ENABLED_ATTR = 'custom-spellcheck-enable'
    public static LANGUAGE_ATTR = 'custom-spellcheck-language'

    async onload() {

        this.i18nx = this.i18n
        new Icons(this);

        this.settingsUtil = await Settings.init(this)
        this.analytics = new Analytics(this.settingsUtil.get('analytics'));
        this.suggestions = new SuggestionEngine(this)
        this.menus = new Menus(this)

        await this.prepareSpellCheckers()

        void this.analytics.sendEvent('load')

        const style = document.createElement('style');
        style.innerHTML = `
        .underline-overlay {
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 2;
        }
        .error-underline {
           position: absolute;
           height: 2px;
           background-image: 
               radial-gradient(circle at 2px 1px, #ff4444 1px, transparent 1px),
               radial-gradient(circle at 6px 1px, #ff4444 1px, transparent 1px);
           background-size: 8px 2px;
           background-repeat: repeat-x;
           background-position: 0 bottom;
        }`
        window.document.head.appendChild(style);

        if(window.siyuan.config.editor.spellcheck) {
            showMessage(this.i18nx.errors.builtInEnabled, -1, 'error')
        }

        this.eventBus.on('ws-main', async (event) => {

            if (event.detail.cmd != 'transactions') { return }

            const operation = event.detail.data[0].doOperations[0]
            const action = operation.action
            const blockID = operation.id

            if(action != 'update') { return }

            await this.suggestions.suggestAndRender(blockID)
            void this.suggestions.forAllBlocksSuggest(this.suggestions.documentID, false, true, false)

        })

        this.eventBus.on('open-menu-content', async (event) => {

            if(!this.suggestions.documentEnabled) { return }
            void this.analytics.sendEvent('menu-open-any');
            const blockID = ProtyleHelpers.getNodeId(event.detail.range.startContainer.parentElement)

            const suggNo = this.suggestions.getSuggestionNumber(blockID, event.detail.range)
            this.menus.addCorrectionsToParagraphMenu(blockID, suggNo, event.detail.menu)

        })

        this.eventBus.on('open-menu-doctree', async (event) => {
            const docID = ProtyleHelpers.getNodeId(event.detail.elements[0]) // @TODO this is ugly, why does the event not carry the docID?
            void this.menus.addSettingsToDocMenu(docID, event.detail.menu)
        })

        this.eventBus.on('switch-protyle', async (event) => {

            const docID = event.detail.protyle.block.id
            const settings = await ProtyleHelpers.getDocumentSettings(docID, this.settingsUtil.get('enabledByDefault'), this.settingsUtil.get('defaultLanguage'))

            this.suggestions.documentID = docID
            this.suggestions.documentEnabled = settings.enabled
            this.suggestions.documentLanguage = settings.language

            this.suggestions.clearStorage()
            void this.suggestions.forAllBlocksSuggest(docID, true, true, false)

            const activeEditor = document.querySelector('.fn__flex-1.protyle:not([class*="fn__none"])')
            new ResizeObserver(this.reRenderSuggestions.bind(this)).observe(activeEditor)

        })

    }

    private reRenderSuggestions() {
        void this.suggestions.forAllBlocksSuggest(this.suggestions.documentID, false, true, false)
    }

    onunload() {
        void this.analytics.sendEvent('unload');
    }

    uninstall() {
        void this.analytics.sendEvent('uninstall');
    }

    private async prepareSpellCheckers() {

        this.onlineSpellChecker = new LanguageTool(<LanguageToolSettings>this.settingsUtil.dump())
        const offlineLanguages = this.settingsUtil.get('offlineDicts').split(',')

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