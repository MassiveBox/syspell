
# 📝 SySpell - Grammar and Spell Checker for SiYuan

This plugin adds a fully featured grammar and spell checker for SiYuan, powered by [LanguageTool](https://languagetool.org/).

▶️ [LiuYun thread](https://liuyun.io/article/1756302314285)

## 📃 Usage instructions
1. Install the plugin from the SiYuan plugin store and enable it
2. (Optional) Visit the plugin settings to configure it for your needs
3. Words and phrases which are recognized as wrong will be underlined in red
4. Right-click over an underlined word (or click the Menu keyboard button), hover on "Plugin", then... 
   - Click the error message to get a detailed explanation of the error
   - Click "Add to dictionary" to permanently ignore the error
   - Click any of the corrections to apply them

> If, at any point, the underlines are not displayed correctly under the words, click on the currently active tab in
SiYuan's tab selector or Document Tree, this will trigger a refresh of the underlines.

## ☑️ Features
- [x] Spell checker
- [x] Grammar checker like Grammarly
- [x] Free and open-source
- [x] [Self-hostable](https://dev.languagetool.org/http-server) grammar checking server
- [x] Offline mode (only simple spell checking)
- [x] Underlines are not edited into your notes
   <details>
      <summary>Why does this matter?</summary>

  The plugin's underlines are not rendered by altering the content of your note, but as an overlay.
  This way, when exporting notes from SiYuan to HTML or Markdown, the underlines aren't shown, and they don't interfere with your writing.  
  It's just like how the [Grammarly](https://www.grammarly.com/blog/engineering/making-grammarly-feel-native-on-every-website/) web extensions works!

   </details>

Check out the [Projects](https://git.boxo.cc/massivebox/siyuan-spellchecker/projects) for the planned features!

## 🛠 Contributing
I'm respecting LanguageTool's guidelines by running a LanguageTool server, on my own hardware, for the benefit of this
plugin's users, instead of having them use the official one.  
I'm providing this service for free, but it's not free for me to run it: the LanguageTool server is very resource intensive.  
If you can, consider [donating](https://s.boxo.cc/siyuan-plugin-donate) to help me keep it up forever. Thanks!

You can also contribute by opening an issue or a pull request. Thanks!

## 🤗 Thanks to
This project couldn't have been possible without (in no particular order):
- The [SiYuan](https://github.com/siyuan-note/siyuan) project
- [SiYuan plugin sample with vite and svelte](https://github.com/siyuan-note/plugin-sample-vite-svelte)
- [LanguageTool](https://languagetool.org/)
- [ESpells](https://github.com/Monkatraz/espells)
- The authors of [offline dictionaries](https://github.com/wooorm/dictionaries?tab=readme-ov-file#list-of-dictionaries)

Make sure you check them out and support them as well!

## 📜 License
The original plugin framework is developed by SiYuan 思源笔记 and licensed under the MIT license.  
All changes made by me are copyright MassiveBox 2025, and licensed under the MIT license.