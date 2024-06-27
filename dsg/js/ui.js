const ui = {

    copyToClipboard: function(textToCopy) {
        if (navigator.clipboard !== undefined) {
            navigator.clipboard.writeText(textToCopy).then(
                function() {
                  /* clipboard successfully set */
                  ui.notifications.add('Copied to clipboard');
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
            ui.notifications.add('Copied to clipboard');
        }
    },
    notifications: {
        defaults: {
            template: 'base',
            duration: 3,
            skin: 'primary'
        },
        templates: {
            base: function({id, message, duration, skin}) {
                return `
                    <aside class="
                        d-flex jc-space-between
                        pos-fixed z-2 top-0 right-0
                        mt-6 mr-6
                        ff-lead-400
                        bc-${skin}-100 c-${skin}-800 brad-2"
                        id="${id}">
                        <div class="d-flex p-2">
                            <div class="pl-1 bc-${skin}-500 brad-3"></div>
                        </div>
                        <div class="d-flex ai-center p-3 fs-3">
                            ${message}
                        </div>
                        <button class="
                            d-flex ai-center
                            pt-2 pb-2 pl-3 pr-3
                            ff-lead-400 fs-2 tt-uppercase
                            blwidth-1 blstyle-solid bcolor-primary-700 c-${skin}-700 bc-${skin}-200 b-0 bradtr-2 bradbr-2
                            cur-pointer"
                            onclick="this.closest('aside').remove();">
                            Close
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