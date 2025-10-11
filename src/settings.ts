import {SettingUtils} from "@/libs/setting-utils";
import SpellCheckPlugin from "@/index";
import {LanguageTool, LanguageToolSettings} from "@/languagetool";

export class Settings {

    static async init(plugin: SpellCheckPlugin): Promise<SettingUtils> {

        const to = plugin.i18nx.settings
        const su = new SettingUtils({
            plugin: plugin, name: plugin.name
        });

        su.addItem({
            type: 'hint',
            key: 'info',
            title: to.info.title,
            description: to.info.description,
            value: ''
        })

        su.addItem({
            type: 'checkbox',
            key: 'experimentalCorrect',
            title: to.experimentalCorrect.title,
            description: to.experimentalCorrect.description,
            value: false
        })

        su.addItem({
            type: 'textarea',
            key: 'customDictionary',
            title: to.customDictionary.title,
            description: to.customDictionary.description,
            value: 'SySpell,SiYuan'
        })

        su.addItem({
            type: 'textinput',
            key: 'server',
            title: to.server.title,
            description: to.server.description,
            value: 'https://api.languagetoolplus.com/'
        })

        await su.load() // needed to fetch languages from server
        let languagesKV = {}
        let languages = await new LanguageTool(<LanguageToolSettings>{server: su.get('server')}).getLanguages()
        languages.forEach(language => {
            languagesKV[language.longCode] = language.name + ' [' + language.longCode + ']'
        })

        su.addItem({
            type: 'textinput',
            key: 'username',
            title: to.username.title,
            description: to.username.description,
            value: ''
        })

        su.addItem({
            type: 'textinput',
            key: 'apiKey',
            title: to.apiKey.title,
            description: to.apiKey.description,
            value: ''
        })

        su.addItem({
            type: 'checkbox',
            key: 'picky',
            title: to.picky.title,
            description: to.picky.description,
            value: false
        })

        su.addItem({
            type: 'select',
            key: 'motherTongue',
            title: to.motherTongue.title,
            description: to.motherTongue.description,
            value: (window.navigator.language in languagesKV) ? window.navigator.language : 'en-US',
            options: languagesKV
        })

        su.addItem({
            type: 'textinput',
            key: 'preferredVariants',
            title: to.preferredVariants.title,
            description: to.preferredVariants.description,
            value: 'en-US,de-DE'
        })

        su.addItem({
            type: 'checkbox',
            key: 'enabledByDefault',
            title: to.enabledByDefault.title,
            description: to.enabledByDefault.description,
            value: true
        })

        languagesKV['auto'] = plugin.i18nx.docMenu.autodetectLanguage
        su.addItem({
            type: 'select',
            key: 'defaultLanguage',
            title: to.defaultLanguage.title,
            description: to.defaultLanguage.description,
            options: languagesKV,
            value: 'auto'
        })

        su.addItem({
            type: 'checkbox',
            key: 'offline',
            title: to.offline.title,
            description: to.offline.description,
            value: false
        })

        su.addItem({
            type: 'textinput',
            key: 'offlineDicts',
            title: to.offlineDicts.title,
            description: to.offlineDicts.description,
            value: 'en'
        })

        su.addItem({
            type: 'checkbox',
            key: 'analytics',
            title: to.analytics.title,
            description: to.analytics.description,
            value: true
        })

        su.save = async function (data?: any) {
            data = data ?? this.dump();
            await this.plugin.saveData(this.file, this.dump());
            location.reload()
        }.bind(su)

        await su.load()
        return su

    }

    // dictionary is a string of words separated by commas
    static isInCustomDictionary(word: string, settings: SettingUtils) {
        const dictionary = settings.get('customDictionary').split(',')
        return dictionary.includes(word)
    }

    static addToDictionary(word: string, settings: SettingUtils) {
        const dictionary = settings.get('customDictionary').split(',')
        if (!dictionary.includes(word)) {
            dictionary.push(word)
            return settings.setAndSave('customDictionary', dictionary.join(','))
        }
    }

}