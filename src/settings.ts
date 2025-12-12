import SpellCheckPlugin from "@/index";
import {Dialog, showMessage} from "siyuan";
import SettingsUI from "@/settingsUI.svelte";
import {LanguageTool} from "@/languagetool";

export type SettingsUIGroup = {
    id: number
    name: string
    tip: string
    items: ISettingItem[]
}

export class Settings {

    public static SETTINGS_FILE_NAME = 'syspell.json'

    private settingsUIGroups: SettingsUIGroup[]

    private plugin: SpellCheckPlugin
    private settings: object
    public changedDialog: boolean = false

    constructor(plugin: SpellCheckPlugin) {
        this.plugin = plugin
    }

    public async load() {
        this.settings = await this.plugin.loadData(Settings.SETTINGS_FILE_NAME)
        let save = false
        if(typeof this.settings == 'string') {
            // no file = first run
            this.settings = {}
            save = true
        }
        await this.populateUIGroupsAndSetMissing()
        if(save) {
            await this.save()
        }
    }

    public async save() {
        await this.plugin.saveData(Settings.SETTINGS_FILE_NAME, this.settings)
    }

    public get(key: string): any {
        return this.settings[key]
    }
    public set(key: string, value: any): void {
        this.settings[key] = value;
    }
    public dump(): any {
        return this.settings
    }

    public async openSettingsDialog() {

        let dialog = new Dialog({
            title: this.plugin.i18nx.settings.settings,
            content: `<div id="SettingPanel" style="height: 100%;"></div>`,
            width: "800px",
            height: "80%",
            destroyCallback: () => {
                panel.$destroy();
                if(this.changedDialog) {
                    showMessage(this.plugin.i18nx.settings.didntSave, -1, 'info')
                }
            }
        });
        await this.populateUIGroupsAndSetMissing() // refresh UI groups to ensure consistency between this.settings and UI data
        let panel = new SettingsUI({
            target: dialog.element.querySelector("#SettingPanel"),
            props: {
                i18n: this.plugin.i18nx,
                groups: this.settingsUIGroups,
                settings: this
            }
        });

    }

    // dictionary is a string of words separated by commas
    public isInCustomDictionary(word: string) {
        const dictionary = this.get('customDictionary').split(',')
        return dictionary.includes(word)
    }

    public async addToDictionary(word: string) {
        const dictionary = this.get('customDictionary').split(',')
        if (!dictionary.includes(word)) {
            dictionary.push(word)
            this.set('customDictionary', dictionary.join(','))
            await this.save()
        }
    }

    private settingsItem(type: TSettingItemType, key: string, defaultValue: any, options?: any) {
        if(this.get(key) == undefined) {
            this.set(key, defaultValue)
        }
        let to = this.plugin.i18nx.settings;
        return {
            type: type,
            key: key,
            value: this.get(key),
            title: to[key].title,
            description: to[key].description,
            options: options
        }
    }

    private async populateUIGroupsAndSetMissing() {

        let to = this.plugin.i18nx.settings;
        let languagesKV = Object.fromEntries(
            (await new LanguageTool(null).getLanguages()).map(language => [
                language.longCode,
                `${language.name} [${language.longCode}]`
            ])
        );
        let languagesKVWithAuto = {auto: 'Auto detect', ...languagesKV};

        this.settingsUIGroups = [
            {
                id: 0,
                name: to.sections.general,
                tip: to.sections.generalTip,
                items: [
                    this.settingsItem('checkbox', 'enabledByDefault', true),
                    this.settingsItem('checkbox', 'offline', false),
                    this.settingsItem('checkbox', 'experimentalCorrect', false),
                    this.settingsItem('textinput', 'customDictionary', 'SySpell,SiYuan'),
                    this.settingsItem('checkbox', 'analytics', true),
                ]
            },
            {
                id: 1,
                name: to.sections.online,
                tip: to.sections.onlineTip,
                items: [
                    this.settingsItem('textinput', 'server', 'https://api.languagetoolplus.com/'),
                    this.settingsItem('textinput', 'username', ''),
                    this.settingsItem('textinput', 'apiKey', ''),
                    this.settingsItem('checkbox', 'picky', false),
                    this.settingsItem('select', 'motherTongue', (window.navigator.language in languagesKV) ? window.navigator.language : 'en-US', languagesKV),
                    this.settingsItem('textinput', 'preferredVariants', 'en-US,de-DE'),
                    this.settingsItem('select', 'defaultLanguage', 'auto', languagesKVWithAuto),
                    this.settingsItem('checkbox', 'reportAuto', false)
                ]
            },
            {
                id: 2,
                name: to.sections.offline,
                tip: to.sections.offlineTip,
                items: [
                    this.settingsItem('textinput', 'offlineDicts', 'en'),
                ]
            }
        ]
    }

}