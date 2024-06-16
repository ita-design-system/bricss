const ui = {

    copyToClipboard: function(textToCopy) {
        if (navigator.clipboard !== undefined) {
            navigator.clipboard.writeText(textToCopy).then(
                function() {
                  /* clipboard successfully set */
                  ds.notifications.add('copied to clipboard', {skin: 'green'});
                }
            )
        } else {
            /* clipboard write failed */
            // Create a "hidden" input
            const aux = document.createElement("input");
            // Assign it the value of the specified element
            aux.setAttribute("value", textToCopy);
            // Append it to the body
            document.body.appendChild(aux);
            // Highlight its content
            aux.select();
            // Copy the highlighted text
            document.execCommand("copy");
            // Remove it from the body
            document.body.removeChild(aux);
            ds.notifications.add('copied to clipboard', {skin: 'green'});
        }
    },
    notifications: {
        defaults: {
            template: 'base',
            duration: 3,
            skin: 'blue'
        },
        templates: {
            base: function({id, message, duration, skin}) {
                return `
                    <aside class="
                        d-flex m-main-space-between
                        c-pos m-fixed m-z-6 m-top-0 m-right-0
                        c-dim m-mt-6 m-mr-6
                        c-skin m-bc-grey-light-100 m-brad-3 m-bs-1"
                        id="${id}">
                        <div class="
                            c-dis m-flex
                            c-dim m-p-3">
                            <div class="c-dim m-pl-2 c-skin m-bc-${skin}-500 m-brad-3"></div>
                        </div>
                        <div class="
                            c-dis m-flex m-cross-center
                            c-dim m-maxw-2 m-p-4
                            c-txt m-fs-4">
                            ${message}
                        </div>
                        <button class="
                            c-dis m-flex m-cross-center
                            c-dim m-p-3
                            c-txt m-fs-7
                            c-skin m-c-green-700 m-bc-0 m-b-0"
                            onclick="this.closest('aside').remove();">
                            <span class="icon-x"></span>
                        </button>
                        <style>
                            @keyframes ${id} {
                                100% {
                                    transform: translateY(-200%);
                                    opacity: 0;
                                    pointer-events: none;
                                }
                            }
                            #${id} {
                                animation: ${id} 500ms ${duration}s forwards;
                            }
                            #${id}:hover {
                                animation-play-state: paused;
                            }
                        </style>
                    </aside>
                `;
            }
        },
        add: function(message, options) {
            let n_tpl = this.defaults.template;
            let n_duration = this.defaults.duration;
            let n_skin = this.defaults.skin;
            if (typeof options == 'object') {
                // Template
                const custom_tpl = options.template;
                if (typeof custom_tpl == 'string') {
                    if (typeof this.templates[custom_tpl] == 'function') {
                        n_tpl = custom_tpl;
                    }
                }
                // Duration
                const custom_duration = options.duration;
                if (typeof custom_duration == 'number') {
                    n_duration = custom_duration;
                }
                // Color family name
                const custom_skin = options.skin;
                if (typeof custom_skin == 'string') {
                    n_skin = custom_skin;
                }

            }
            const n_id = 'notification_' + Date.now().toString();
            const n_markup = this.templates[n_tpl]({message: message, id: n_id, duration: n_duration, skin: n_skin});
            document.body.insertAdjacentHTML('beforeend', n_markup);
        }
    }
}