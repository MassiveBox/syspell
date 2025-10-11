import {Plugin} from 'siyuan';

export class Style {

    constructor(p: Plugin) {
        this.icons.forEach(icon =>
            p.addIcons(icon)
        )
        this.applyStyle()
    }

    private icons = [
        // info - https://fonts.google.com/icons?selected=Material+Symbols+Outlined:info
        `<symbol id="info" viewBox="0 -960 960 960">
            <path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
         </symbol>`,
        // spell check - https://fonts.google.com/icons?selected=Material+Symbols+Outlined:spellcheck
        `<symbol id="spellcheck" viewBox="0 -960 960 960">
            <path d="M564-80 394-250l56-56 114 114 226-226 56 56L564-80ZM120-320l194-520h94l194 520h-92l-46-132H254l-46 132h-88Zm162-208h156l-76-216h-4l-76 216Z"/>
        </symbol>`,
        // language - https://fonts.google.com/icons?selected=Material+Symbols+Outlined:language_chinese_quick
        `<symbol id="language" viewBox="0 -960 960 960">
            <path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q83 0 155.5 31.5t127 86q54.5 54.5 86 127T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Zm0-82q26-36 45-75t31-83H404q12 44 31 83t45 75Zm-104-16q-18-33-31.5-68.5T322-320H204q29 50 72.5 87t99.5 55Zm208 0q56-18 99.5-55t72.5-87H638q-9 38-22.5 73.5T584-178ZM170-400h136q-3-20-4.5-39.5T300-480q0-21 1.5-40.5T306-560H170q-5 20-7.5 39.5T160-480q0 21 2.5 40.5T170-400Zm216 0h188q3-20 4.5-39.5T580-480q0-21-1.5-40.5T574-560H386q-3 20-4.5 39.5T380-480q0 21 1.5 40.5T386-400Zm268 0h136q5-20 7.5-39.5T800-480q0-21-2.5-40.5T790-560H654q3 20 4.5 39.5T660-480q0 21-1.5 40.5T654-400Zm-16-240h118q-29-50-72.5-87T584-782q18 33 31.5 68.5T638-640Zm-234 0h152q-12-44-31-83t-45-75q-26 36-45 75t-31 83Zm-200 0h118q9-38 22.5-73.5T376-782q-56 18-99.5 55T204-640Z"/>
        </symbol>`,
        // toggle - https://fonts.google.com/icons?selected=Material+Symbols+Outlined:toggle_on
        `<symbol id="toggle" viewBox="0 -960 960 960">
            <path d="M280-240q-100 0-170-70T40-480q0-100 70-170t170-70h400q100 0 170 70t70 170q0 100-70 170t-170 70H280Zm0-80h400q66 0 113-47t47-113q0-66-47-113t-113-47H280q-66 0-113 47t-47 113q0 66 47 113t113 47Zm400-40q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM480-480Z"/>
        </symbol>`,
        // autodetect - https://fonts.google.com/icons?selected=Material+Symbols+Outlined:network_intelligence
        `<symbol id="autodetect" viewBox="0 -960 960 960">
            <path d="M346-212q-8 0-15-3.5T320-227l-68-123h48l36 68h77v-28h-60l-36-68h-81l-49-87q-2-4-3-7.5t-1-7.5q0-2 4-15l49-87h81l36-68h60v-28h-77l-36 68h-48l68-123q4-8 11-11.5t15-3.5h90q13 0 21.5 8.5T466-718v140h-61l-28 28h89v106h-76l-34-67h-69l-28 28h80l34 67h93v174q0 13-8.5 21.5T436-212h-90Zm178 0q-13 0-21.5-8.5T494-242v-174h93l34-67h80l-28-28h-69l-35 67h-75v-106h89l-28-28h-61v-140q0-13 8.5-21.5T524-748h90q8 0 15 3.5t11 11.5l68 123h-48l-36-68h-77v28h60l35 68h82l49 87q2 4 3 7.5t1 7.5q0 2-4 15l-49 87h-82l-35 68h-60v28h77l36-68h48l-68 123q-4 8-11 11.5t-15 3.5h-90Z"/>
        </symbol>`,
        // error - https://fonts.google.com/icons?selected=Material+Symbols+Outlined
        `<symbol id="error" viewBox="0 -960 960 960">
            <path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
        </symbol>`,
        // add - https://fonts.google.com/icons?selected=Material+Symbols+Outlined:add
        `<symbol id="add" viewBox="0 -960 960 960">
            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/>
        </symbol>`
    ]

    private applyStyle() {
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
    }

}