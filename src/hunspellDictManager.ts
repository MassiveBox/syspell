import {getFile, putFile} from "@/api";

export class HunspellDictManager {

    private static pathBase = 'data/storage/petal/syspell'
    private static urlBase = 'https://raw.githubusercontent.com/wooorm/dictionaries/refs/heads/main/dictionaries'

    static async loadDictionary(language: string, downloadIfMissing: boolean): Promise<{ aff: string, dic: string }> {

        const aff = await getFile(`${this.pathBase}/${language}.aff`)
        const dic = await getFile(`${this.pathBase}/${language}.dic`)

        if(aff.code == 404 || dic.code == 404) {
            if(downloadIfMissing) {
                await this.downloadDictionary(language)
                return this.loadDictionary(language, false)
            }else{
                throw new Error(`Dictionary ${language} not found`)
            }
        }

        return { aff, dic }

    }

    private static async downloadFile(url: string, filename: string) {

        const res = await fetch(url);
        const mimeType = res.headers.get('content-type')

        if(res.status != 200) {
            throw new Error(await res.text())
        }

        const blob = new Blob([await res.text()], { type: mimeType });
        const file =  new File([blob], filename, { type: mimeType, lastModified: Date.now() });

        await putFile(filename, false, file)

    }

    static async downloadDictionary(language: string) {
        try {
            await this.downloadFile(`${this.urlBase}/${language}/index.aff`, `${this.pathBase}/${language}.aff`);
            await this.downloadFile(`${this.urlBase}/${language}/index.dic`, `${this.pathBase}/${language}.dic`);
        }catch (e) {
            throw new Error(`Download for dictionary '${language}' failed with ` + e)
        }
    }

}