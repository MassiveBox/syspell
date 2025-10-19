import {Menu, showMessage, subMenu} from 'siyuan';
import SpellCheckPlugin from "@/index";
import {getBlockAttrs, setBlockAttrs} from "@/api";
import {Settings} from "@/settings";
import {ProtyleHelper} from "@/protyleHelper";
import {Analytics} from "@/analytics";

export class Menus {

    private plugin: SpellCheckPlugin
    public constructor(plugin: SpellCheckPlugin) {
        this.plugin = plugin
    }

    public addCorrectionsToParagraphMenu(blockID: string, suggestionNumber: number, menu: subMenu) {

        const storedBlock = this.plugin.suggestions.getStorage()[blockID]
        if (suggestionNumber == -1) {
            return
        }
        void this.plugin.analytics.sendEvent('menu-open-wrong');

        let suggestion = storedBlock.suggestions[suggestionNumber]
        menu.addItem({
            icon: 'info',
            label: suggestion.shortMessage == '' ? suggestion.message : suggestion.shortMessage,
            click: async () => {
                showMessage(suggestion.message, 5000, 'info')
                void this.plugin.analytics.sendEvent('menu-click-info');
            }
        })

        if(suggestion.typeName == 'UnknownWord') {
            // add to dictionary
            menu.addItem({
                icon: 'add',
                label: this.plugin.i18nx.textMenu.addToDictionary,
                click: async () => {
                    void this.plugin.analytics.sendEvent('menu-click-add-to-dictionary');
                    const word = this.plugin.suggestions.suggestionToWrongText(suggestion, blockID)
                    await Settings.addToDictionary(word, this.plugin.settingsUtil)
                    showMessage(this.plugin.i18nx.textMenu.addedToDictionary + word, 5000, 'info')
                    await this.plugin.suggestions.renderSuggestions(blockID)
                }
            })
        }

        // corrections
        suggestion.replacements.forEach((replacement, correctionNumber) => {
            menu.addItem({
                icon: 'spellcheck',
                label: replacement,
                click: async () => {
                    void this.plugin.analytics.sendEvent('menu-click-correct', {
                        'type': suggestion.typeName
                    });
                    if(this.plugin.settingsUtil.get('experimentalCorrect')) {
                        void this.plugin.suggestions.correctSuggestion(blockID, suggestionNumber, correctionNumber)
                    }else{
                        void navigator.clipboard.writeText(replacement)
                        showMessage(this.plugin.i18nx.errors.correctionNotEnabled, 5000, 'info')
                    }
                }
            })
        })

    }

    public async addSettingsToDocMenu(docID: string, menu: subMenu) {

        let submenu = []

        submenu.push({
            icon: 'info',
            label: this.plugin.i18nx.docMenu.documentStatus,
            click: async () => {
                const settings = await ProtyleHelper.getDocumentSettings(docID, this.plugin.settingsUtil.get('enabledByDefault'), this.plugin.settingsUtil.get('defaultLanguage'))
                if(settings == null) {
                    void this.plugin.analytics.sendEvent('docmenu-click-info-notebook');
                    showMessage(this.plugin.i18nx.errors.notImplementedNotebookSettings, 5000, 'info')
                    return
                }
                showMessage(`
                    <b>${this.plugin.i18nx.docMenu.documentStatus}</b><br />
                    ${this.plugin.i18nx.docMenu.status}: ${settings.enabled ? this.plugin.i18nx.docMenu.enabled : this.plugin.i18nx.docMenu.disabled}<br />
                    ${this.plugin.i18nx.docMenu.language}: ${settings.language}
                `, 5000, 'info')
                void this.plugin.analytics.sendEvent('docmenu-click-info');
            }
        })

        submenu.push({
            icon: 'toggle',
            label: this.plugin.i18nx.docMenu.toggleSpellCheck,
            click: async () => {
                void this.plugin.analytics.sendEvent('docmenu-click-toggle');
                const attrs = await getBlockAttrs(docID)
                const settings = await ProtyleHelper.getDocumentSettings(docID, this.plugin.settingsUtil.get('enabledByDefault'), this.plugin.settingsUtil.get('defaultLanguage'))
                if(settings == null) {
                    void this.plugin.analytics.sendEvent('docmenu-click-info-notebook');
                    showMessage(this.plugin.i18nx.errors.notImplementedNotebookSettings, 5000, 'info')
                    return
                }
                attrs[SpellCheckPlugin.ENABLED_ATTR] = settings.enabled ? 'false' : 'true'
                await setBlockAttrs(docID, attrs)
                location.reload()
            }
        })

        async function setLang(lang: string, analytics: Analytics) {
            const attrs = await getBlockAttrs(docID)
            attrs[SpellCheckPlugin.LANGUAGE_ATTR] = lang
            await setBlockAttrs(docID, attrs)
            void analytics.sendEvent('docmenu-click-setlang-2', {
                'language': lang
            });
            location.reload()
        }

        submenu.push({
            icon: 'language',
            label: this.plugin.i18nx.docMenu.setDocumentLanguage,
            click: async (_, ev: MouseEvent) => {
                void this.plugin.analytics.sendEvent('docmenu-click-setlang-1');
                const languages = await this.plugin.onlineSpellChecker.getLanguages()
                const langMenu = new Menu('spellCheckLangMenu');
                langMenu.addItem({
                    icon: 'autodetect',
                    label: this.plugin.i18nx.docMenu.autodetectLanguage,
                    click: async () => setLang('auto', this.plugin.analytics)
                });
                languages.forEach(language => {
                    langMenu.addItem({
                        icon: 'language',
                        label: language.name + ' [' + language.longCode + ']',
                        click: async () => setLang(language.longCode, this.plugin.analytics)
                    });
                });
                langMenu.open({ x: ev.clientX, y: ev.clientY });

            }
        })

        menu.addItem({
            icon: 'spellcheck',
            label: this.plugin.i18nx.syspell,
            submenu: submenu
        })

    }

}