import {Menu, showMessage, subMenu} from 'siyuan';
import SpellCheckPlugin from "@/index";
import {getBlockAttrs, setBlockAttrs} from "@/api";
import {LanguageTool} from "@/languagetool";
import {PluginSettings, Settings} from "@/settings";
import {ProtyleHelpers} from "@/protyleHelpers";
import {SuggestionEngine} from "@/suggestions";

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

        if(suggestion.type.typeName == 'UnknownWord') {
            // add to dictionary
            menu.addItem({
                icon: 'add',
                label: this.plugin.i18nx.textMenu.addToDictionary,
                click: async () => {
                    void this.plugin.analytics.sendEvent('menu-click-add-to-dictionary');
                    const word = SuggestionEngine.suggestionToWrongText(suggestion)
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
                label: replacement.value,
                click: async () => {
                    void this.plugin.analytics.sendEvent('menu-click-correct', {
                        'type': suggestion.rule.category.id
                    });
                    if(this.plugin.settingsUtil.get('experimentalCorrect')) {
                        void this.plugin.suggestions.correctSuggestion(blockID, suggestionNumber, correctionNumber)
                    }else{
                        void navigator.clipboard.writeText(replacement.value)
                        showMessage(this.plugin.i18nx.errors.correctionNotEnabled, 5000, 'info')
                    }
                }
            })
        })

    }

    public async addSettingsToDocMenu(docID: string, menu: subMenu) {

        menu.addItem({
            icon: 'info',
            label: this.plugin.i18nx.docMenu.documentStatus,
            click: async () => {
                const settings = await ProtyleHelpers.getDocumentSettings(docID, this.plugin.settingsUtil.get('enabledByDefault'), this.plugin.settingsUtil.get('defaultLanguage'))
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

        menu.addItem({
            icon: 'toggle',
            label: this.plugin.i18nx.docMenu.toggleSpellCheck,
            click: async () => {
                void this.plugin.analytics.sendEvent('docmenu-click-toggle');
                const attrs = await getBlockAttrs(docID)
                const settings = await ProtyleHelpers.getDocumentSettings(docID, this.plugin.settingsUtil.get('enabledByDefault'), this.plugin.settingsUtil.get('defaultLanguage'))
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

        menu.addItem({
            icon: 'language',
            label: this.plugin.i18nx.docMenu.setDocumentLanguage,
            click: async (_, ev: MouseEvent) => {
                void this.plugin.analytics.sendEvent('docmenu-click-setlang-1');
                const languages = await LanguageTool.getLanguages(<PluginSettings>this.plugin.settingsUtil.dump())
                const langMenu = new Menu('spellCheckLangMenu');
                langMenu.addItem({
                    icon: 'autodetect',
                    label: this.plugin.i18nx.docMenu.autodetectLanguage,
                    click: async () => {
                        const attrs = await getBlockAttrs(docID)
                        attrs[SpellCheckPlugin.LANGUAGE_ATTR] = 'auto'
                        await setBlockAttrs(docID, attrs)
                        void this.plugin.analytics.sendEvent('docmenu-click-setlang-2', {
                            'language': 'auto'
                        });
                        location.reload()
                    }
                });
                languages.forEach(language => {
                    langMenu.addItem({
                        icon: 'language',
                        label: language.name + ' [' + language.longCode + ']',
                        click: async () => {
                            const attrs = await getBlockAttrs(docID)
                            attrs[SpellCheckPlugin.LANGUAGE_ATTR] = language.longCode
                            await setBlockAttrs(docID, attrs)
                            void this.plugin.analytics.sendEvent('docmenu-click-setlang-2', {
                                'language': language.longCode
                            });
                            location.reload()
                        }
                    });
                });
                langMenu.open({ x: ev.clientX, y: ev.clientY });

            }
        })

    }

}