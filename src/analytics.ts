import {getBackend, getFrontend} from "siyuan";
import packageJson from '../package.json' assert { type: 'json' };

export class Analytics {

    private readonly enabled: boolean;

    private static readonly ENDPOINT = 'https://stats.massive.box/api/send_noua';
    private static readonly WEBSITE_ID = '6963975c-c7e7-495f-a4f0-fa1a0d3e64ac';

    constructor(enabled: boolean) {
        this.enabled = enabled;
    }

    async sendEvent(name: string, addData?: Record<string, string>) {

        if(!this.enabled) return;

        const sendData: Record<string, string> = (name == 'load' || name == 'install') ?
            {
                'appVersion': window.navigator.userAgent.split(' ')[0],
                'pluginVersion': packageJson.version,
                'frontend': getFrontend(),
                'backend': getBackend(),
                'language': navigator.language,
                'appLanguage': window.siyuan.config.lang,
                ...addData
            } : { ...addData };

        await fetch(Analytics.ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'event',
                payload: {
                    website: Analytics.WEBSITE_ID,
                    name: name,
                    data: sendData,
                },
            })
        })

    }

}