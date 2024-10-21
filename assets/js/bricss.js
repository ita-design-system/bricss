const bricss = {
    elDocStandard: document.querySelector('#dsg__doc__standard'),
    elDownloadLink: document.querySelector('#dsg__doc__download_link'),
    elFileSize: document.querySelector('#dsg__doc__download_link__file_size'),
    elSearchInput: document.querySelector('#dsg__search__input'),
    elSearchResetBtn: document.querySelector('#dsg__search__reset_btn'),
    documentTitleOrigin: '',
    messages: {
        buildFailed: `Failed to load XXX`,
        searchTitle: `Search XXX in class names`,
        downloadBtnTitle: `Download CSS file XXXKB uncompressed`,
        clickToCopyToClipboard: `Click to copy XXX to clipboard`,
        goToMdn: `Learn more about XXX on Mozilla Developer Network`,
        responsive: `Responsive`,
        utility: `Utility`,
        cssClass: `CSS class`,
        value: `Value`
    },
    getBuild: function(jsonUrl) {
        if (typeof jsonUrl == 'string') {
            fetch(`${jsonUrl}`)
                .then(response => response.json())
                .then(json => {
                    bricss.build = json;
                    bricss.genDocStandard();
                    bricss.genCodeCss();
                    bricss.genBlob();
                    bricss.genDownload();
                    bricss.searchText();
                    console.log(bricss.build);
                })
                .catch(error => {
                    // Handle the error
                    console.log(error);
                    alert(`${bricss.messages.buildFailed.replace(`XXX`, jsonUrl)}`);
                });
        }
    },
    resetAllItems: function() {
        Object.keys(bricss.elDocStandard.children).forEach(function(index) {
            ['width', 'maxWidth', 'minWidth'].forEach(function(pname) {
                bricss.elDocStandard.children[index].style[pname] = null;
            });
        })
    },
    resetSearch: function() {
        if (bricss.elSearchInput !== null && bricss.elSearchResetBtn !== null) {
            bricss.elSearchInput.value = '';
            document.title = bricss.documentTitleOrigin;
            history.replaceState(null, '', location.pathname);
            bricss.elSearchResetBtn.classList.add('d-none');
            bricss.elSearchResetBtn.classList.remove('d-flex');
            bricss.elDocStandard.querySelectorAll('.dsg__doc__property_item').forEach(function(el) {
                el.style.display = null;
            });
            bricss.elSearchInput.focus();
        }
    },
    searchText: function() {
        if (bricss.elSearchInput !== null && bricss.elSearchResetBtn !== null) {
            const queryContent = bricss.elSearchInput.value.toLowerCase();
            const elements = bricss.elDocStandard.querySelectorAll('.dsg__doc__property_item');
            elements.forEach(function(el) {
                const elementContent = el.innerText.toLowerCase();
                if (elementContent.indexOf(queryContent) == -1) {
                    el.style.display = 'none';
                } else {
                    el.style.display = null;
                }
            });
            if (elements.length > 0) {
                if (queryContent.length > 1) {
                    history.replaceState(null, '', `?search=${queryContent}`);
                    document.title = bricss.messages.searchTitle.replace('XXX', queryContent);
                    window.scroll({top: 0, behavior: 'smooth'});
                } else {
                    document.title = bricss.documentTitleOrigin;
                    history.replaceState(null, '', location.pathname);
                }
            }
            if (queryContent.length > 1) {
                bricss.elSearchResetBtn.classList.remove('d-none');
                bricss.elSearchResetBtn.classList.add('d-flex');
            } else {
                bricss.elSearchResetBtn.classList.add('d-none');
                bricss.elSearchResetBtn.classList.remove('d-flex');
            }
        }
    },
    isATokenFamily: function(tokensFamily) {
        const tokensFamilies = Object.keys(bricss.build.tokens);
        let response = false;
        if (tokensFamilies.indexOf(tokensFamily) > -1) response = true;
        return response;
    },
    genBlob: function() {
        const blob = new Blob([bricss._generatedCSS], { type: 'text/css' });
        const fileUrl = URL.createObjectURL(blob);
        window.dsgCssFile = {
            url: fileUrl,
            size: Math.ceil(blob.size / 1024)
        }
    },
    genDownload: function() {
        if (typeof window.dsgCssFile == 'object') {
            bricss.elFileSize.innerHTML = `${window.dsgCssFile.size}KB`;
            bricss.elDownloadLink.href = window.dsgCssFile.url;
            bricss.elDownloadLink.classList.remove('opa-5', 'pe-none');
            bricss.elDownloadLink.title = bricss.messages.downloadBtnTitle.replace('XXX', window.dsgCssFile.size);
        }
    },
    genFrom: function(tokensFamily) {
        const array = [];
        if (bricss.isATokenFamily(tokensFamily)) {
            Object.keys(bricss.build.tokens[tokensFamily]).forEach(function(tokenName) {
                array.push({
                    name: tokenName,
                    value:  bricss.build.tokens[tokensFamily][tokenName]
                });
            });
        }
        return array;
    },
    genCssMediaForScreenSize: function({screenSize, content}) {
        let highMarkup = ` and (max-width: ${bricss.build.settings.screenSizes[screenSize][1]})`;
        const lowMarkup = `(min-width: ${bricss.build.settings.screenSizes[screenSize][0]})`;
        const high =  bricss.build.settings.screenSizes[screenSize][1];
        if (high == 'infinite' || high == '') highMarkup = '';
        return `\n\n/*START @media ${screenSize}*/\n@media ${lowMarkup}${highMarkup} {\n${content}\n}\n/*END @media ${screenSize}*/\n`;
    },
    genCssPropertyForScreenSize: function({screenSize, prefix, name, property, value, utility}) {
        const separator = prefix == '' ? '' :  bricss.build.settings.separator;
        let markup = `\n.${prefix}${separator}${name}${bricss.build.settings.responsiveSeparator}${screenSize},\n[${prefix}${separator}${name}*="${screenSize}"] {\n  ${property}: ${value};\n}`;
        if (utility) {
            markup += `\n.${bricss.build.settings.utilitiesPrefix}${bricss.build.settings.separator}${prefix}${separator}${name}${bricss.build.settings.responsiveSeparator}${screenSize},\n[${bricss.build.settings.utilitiesPrefix}${bricss.build.settings.separator}${prefix}${separator}${name}*="${screenSize}"] {\n  ${property}: ${value} !important;\n}`;
        }
        return markup;
    },
    genCssProperty: function({prefix, name, property, value, utility}) {
        const separator = prefix == '' ? '' :  bricss.build.settings.separator;
        let markup = `\n.${prefix}${separator}${name} {\n  ${property}: ${value};\n}`;
        if (utility) {
            markup += `\n.${bricss.build.settings.utilitiesPrefix}${bricss.build.settings.separator}${prefix}${separator}${name} {\n  ${property}: ${value} !important;\n}`;
        }
        return markup;
    },
    genCssVariables: function() {
        let markup = '';
        Object.keys(bricss.build.tokens).forEach(function(family) {
            Object.keys(bricss.build.tokens[family]).forEach(function(tokenName) {
                markup += `\n  --${bricss.build.settings.cssVariablesPrefix}-${family}-${tokenName}: ${bricss.build.tokens[family][tokenName]};`;
            });
        });
        return `\n:root {\n  /* BRiCSS CSS variables start with --${bricss.build.settings.cssVariablesPrefix}- */${markup}\n}\n`;
    },
    genCodeCss: function() {
        const responsiveCss = {};
        bricss._generatedCSS = bricss.genCssVariables();
        Object.keys(bricss.build.settings.screenSizes).forEach(function(screenSize) {
            responsiveCss[screenSize] = '';
        });
        Object.keys(bricss.build.properties).forEach(function(property) {
            const propertyData = bricss.build.properties[property];
            const tokensKeysAndValues = bricss.genFrom(propertyData.generate_from);
            // console.log(tokens_keys_and_values)
            // Generate from custom values
            propertyData.values.forEach(function(value, index) {
                let name = value;
                if (typeof propertyData.names[index] == 'string') name = propertyData.names[index];
                // Basic
                bricss._generatedCSS += bricss.genCssProperty({
                    prefix: propertyData.prefix,
                    property: property,
                    name: name,
                    value: value,
                    utility: propertyData.generate_utility
                });
                // Responsive
                if (propertyData.responsive) {
                    Object.keys(bricss.build.settings.screenSizes).forEach(function(screenSize) {
                        responsiveCss[screenSize] += bricss.genCssPropertyForScreenSize({
                            screenSize: screenSize,
                            prefix: propertyData.prefix,
                            property: property,
                            name: name,
                            value: value,
                            utility: propertyData.generate_utility
                        });
                    });
                }
            });

            // Generate from tokens
            tokensKeysAndValues.forEach(function(token) {
                bricss._generatedCSS += bricss.genCssProperty({
                    prefix: propertyData.prefix,
                    property: property,
                    name: token.name,
                    value: `var(--${bricss.build.settings.cssVariablesPrefix}-${propertyData.generate_from}-${token.name}, ${token.value})`,
                    utility: propertyData.generate_utility
                });

                // Responsive from tokens
                if (propertyData.responsive) {
                    Object.keys(bricss.build.settings.screenSizes).forEach(function(screenSize) {
                        responsiveCss[screenSize] += bricss.genCssPropertyForScreenSize({
                            screenSize: screenSize,
                            prefix: propertyData.prefix,
                            property: property,
                            name: token.name,
                            value: `var(--${bricss.build.settings.cssVariablesPrefix}-${propertyData.generate_from}-${token.name}, ${token.value})`,
                            utility: propertyData.generate_utility
                        });
                    });
                }
            });
        });
        Object.keys(responsiveCss).forEach(function(screenSize) {
            bricss._generatedCSS += bricss.genCssMediaForScreenSize({
                screenSize: screenSize,
                content: responsiveCss[screenSize]
            });
        });
    },
    setResponsive: function(evt) {
        const selectedScreenSizesNames = [];
        const elProperty = evt.target.closest('.dsg__doc__property_item');
        const property = elProperty.dataset.property;
        const elPropertyList = elProperty.querySelector('.dsg__doc__property_item__list');
        const elFieldsetResponsive = elProperty.querySelector('.dsg__doc__property_item__responsive_content');
        const elUtilityCheckbox = elProperty.querySelector(`#dsg__doc__utility__${property}`);
        let utilityChecked = false;
        if (elUtilityCheckbox !== null) {
            if (elUtilityCheckbox.checked) {
                utilityChecked = true;
            }
        }
        const propertyData = bricss.build.properties[property];
        const propertyAllNamesAndValues = [];
        let markup = '';
        elFieldsetResponsive.querySelectorAll('input:checked').forEach(function(el) {
            selectedScreenSizesNames.push(el.value);
        });
        // Fix the width
        if (elProperty.style.width == '') {
            ['width', 'maxWidth', 'minWidth'].forEach(function(pname) {
                elProperty.style[pname] = elProperty.clientWidth + 'px';
            });
        }
        // Get custom values and names
        propertyData.values.forEach(function(value, index) {
            let name = value;
            if (typeof propertyData.names[index] == 'string') name = propertyData.names[index];
            propertyAllNamesAndValues.push({name, value});
        });
        // Get from token if specified
        const tokensKeysAndValues = bricss.genFrom(propertyData.generate_from);
        tokensKeysAndValues.forEach(function(token) {
            propertyAllNamesAndValues.push(token);
        });
        
        propertyAllNamesAndValues.forEach(function(data) {
            let base = `${propertyData.prefix}${bricss.build.settings.separator}${data.name}`;
            let value = data.value;
            if (utilityChecked) {
                base = `${bricss.build.settings.utilitiesPrefix}${bricss.build.settings.separator}${base}`;
                value += ' !important';
            }
            if (selectedScreenSizesNames.length > 0) {
                const responsiveAttribute = `${base}="${selectedScreenSizesNames.toString()}"`;
                let responsiveCssClasses = '';
                selectedScreenSizesNames.forEach(function(screenSize) {
                    responsiveCssClasses += ` ${base}${bricss.build.settings.responsiveSeparator}${screenSize}`;
                });
                // Generate responsive markup
                markup += bricss.templates.docClassValueResponsiveItem({
                    classes: responsiveCssClasses,
                    attribute: responsiveAttribute,
                    value: value
                });
            } else {
                // Generate standard markup
                markup += bricss.templates.docClassValueItem({
                    className: base,
                    value: value
                });
            }
        });
        elPropertyList.innerHTML = markup;
    },
    templates: {
        docClassValueResponsiveItem: function({classes, attribute, value}) {
            return `
                <li class="d-flex jc-space-between ai-center gap-5 | mb-3">
                    <div class="d-flex fd-column gap-1">
                        <span class="d-flex fd-column">
                            <span class="ff-lead-400 fs-1 tt-uppercase | c-secondary-700">CSS Classes</span>
                            <code class="ff-mono fs-3 | c-secondary-500 c-secondary-200:hover | cur-pointer"
                                title="${bricss.messages.clickToCopyToClipboard.replace(`XXX`, classes)}"
                                onclick="ui.copyToClipboard(this.innerText, true)">
                                ${classes}
                            </code>
                        </span>
                        <span class="d-flex fd-column">
                            <span class="ff-lead-400 fs-1 tt-uppercase | c-tertiary-700">Attribute</span>
                            <code class="ff-mono fs-3 | c-tertiary-300 c-tertiary-200:hover | cur-pointer"
                                title="${bricss.messages.clickToCopyToClipboard.replace(`XXX`, attribute.replaceAll(`"`, `&quot;`))}"
                                onclick="ui.copyToClipboard(this.innerText, true)">
                                ${attribute}
                            </code>
                        </span>
                    </div>
                    <hr class="fg-1 | m-0 bb-0 bl-0 br-0 btwidth-1 btstyle-solid bcolor-primary-500">
                    <span class="d-flex fd-column ai-end">
                        <span class="ff-lead-400 fs-1 tt-uppercase | c-tertiary-700">Value</span>
                        <code class="ff-mono fs-3 ta-right | c-tertiary-500">${value}</code>
                    </span>
                </li>`;
        },
        docClassValueItem: function({className, value}) {
            return `
                <li class="d-flex ai-center jc-space-between gap-5 | fs-3">
                    <code class="ws-nowrap | c-quaternary-500 c-quaternary-200:hover | cur-pointer"
                        title="${bricss.messages.clickToCopyToClipboard.replace(`XXX`, className)}"
                        onclick="ui.copyToClipboard(this.innerText, true)">
                        ${className}
                    </code>
                    <hr class="fg-1 | m-0 bb-0 bl-0 br-0 btwidth-1 btstyle-solid bcolor-primary-500">
                    <strong class="o-auto | ff-mono ta-right ws-nowrap | c-tertiary-500">${value}</strong>
                </li>
            `;
        },
        docUtilityCheckboxItem: function({id, label, disabled}) {
            return `
                <div>
                    <input type="checkbox"
                        id="${id}"
                        value=""
                        onchange="bricss.setResponsive(event)"
                        class="pos-absolute | opa-0 | __checkbox_ui" ${disabled ? 'disabled="disabled"' : ''}>
                    <label for="${id}" class="d-flex ai-center gap-3 | fs-2">
                        <span class="p-2 | bc-primary-100 bwidth-1 bstyle-solid bcolor-primary-800 brad-1 | __checkbox_ui"></span>
                        ${label}
                    </label>
                </div>
            `;
        },
        docScreenSizeCheckboxItem: function({id, screenSize, disabled}) {
            return `
                <div>
                    <input type="checkbox"
                        id="${id}"
                        value="${screenSize}"
                        onchange="bricss.setResponsive(event)"
                        class="pos-absolute | opa-0 | __checkbox_ui" ${disabled ? 'disabled="disabled"' : ''}>
                    <label for="${id}" class="d-flex ai-center gap-3 | fs-2">
                        <span class="p-2 | bc-primary-100 bwidth-1 bstyle-solid bcolor-primary-800 brad-1 | __checkbox_ui"></span>
                        ${screenSize}
                    </label>
                </div>
            `;
        },
        docPropertyItem: function({property, content, responsiveContent, utilityContent}) {
            return `
                <li class="dsg__doc__property_item | fg-1 | p-6 | bwidth-1 bstyle-solid bcolor-primary-500 bc-primary-600 brad-2"
                    w-100="xs"
                    data-property="${property}">
                    <div class="d-flex fd-column gap-6">
                        <div class="d-flex jc-space-between">
                            <h4 class="d-flex fd-column gap-3 fg-1 | m-0">
                                <span class="d-flex fd-column">
                                    <span class="ff-lead-400 fs-1 tt-uppercase | c-secondary-700">Property</span>
                                    <span class="d-flex ai-center gap-3 | ff-mono fs-5 | c-secondary-500">
                                        <span class="d-flex ai-center gap-3">
                                            ${property}
                                            <a  href="https://developer.mozilla.org/en-US/docs/Web/CSS/${property}"
                                                target="_blank"
                                                class="d-flex ai-center | fs-1 | c-secondary-600"
                                                title="${bricss.messages.goToMdn.replace(`XXX`, property)}">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                    stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="feather feather-external-link">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                    <polyline points="15 3 21 3 21 9"></polyline>
                                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                                </svg>
                                            </a>
                                        </span>
                                    </span>
                                </span>
                                <span class="d-flex fd-column">
                                    <span class="ff-lead-400 fs-1 tt-uppercase | c-quaternary-800">Prefix</span>
                                    <span class="ff-mono fs-5 | c-quaternary-500">
                                        ${bricss.build.properties[property].prefix}${bricss.build.settings.separator}
                                    </span>
                                </span>
                            </h4>
                            <div class="d-flex gap-1 fw-wrap jc-end">
                                <fieldset class="dsg__doc__property_item__responsive_content | d-flex fd-column gap-1 | bwidth-1 bstyle-solid bcolor-primary-500 brad-2">
                                    <legend class="fs-2 | c-primary-300">${bricss.messages.responsive}</legend>
                                    ${responsiveContent}
                                </fieldset>
                                <fieldset class="dsg__doc__property_item__utility_content | d-flex fd-column gap-1 | bwidth-1 bstyle-solid bcolor-primary-500 brad-2">
                                    <legend class="fs-2 | c-primary-300">${bricss.messages.utility}</legend>
                                    ${utilityContent}
                                </fieldset>
                            </div>
                        </div>
                        <ul class="dsg__doc__property_item__list | d-flex fd-column gap-2 fg-1 | m-0 p-0">
                            <li class="d-flex jc-space-between gap-3 | fs-1 tt-uppercase">
                                <span class="c-quaternary-800">${bricss.messages.cssClass}</span>
                                <span class="c-tertiary-700">${bricss.messages.value}</span>
                            </li>
                            ${content}
                        </ul>
                    </div>
                </li>
            `;
        }
    },
    genDocStandard: function() {
        if (bricss.elDocStandard !== null) {
            bricss.elDocStandard.innerHTML = '';
            Object.keys(bricss.build.properties).forEach(function(property) {
                if (property.indexOf('--') == -1) {
                    const propertyData = bricss.build.properties[property];
                    const tokensKeysAndValues = bricss.genFrom(propertyData.generate_from);
                    let classesValuesMarkup = '';
                    let responsiveMarkup = '';
                    let utilityMarkup = '';
                    // Generate from custom values
                    propertyData.values.forEach(function(value, index) {
                        let name = value;
                        if (typeof propertyData.names[index] == 'string') name = propertyData.names[index];
                        // Generate from values
                        classesValuesMarkup += bricss.templates.docClassValueItem({
                            className: propertyData.prefix +  bricss.build.settings.separator + name,
                            value: value
                        })
                    });
                    // Generate from tokens
                    tokensKeysAndValues.forEach(function(token) {
                        classesValuesMarkup += bricss.templates.docClassValueItem({
                            className: propertyData.prefix +  bricss.build.settings.separator + token.name,
                            value: token.value
                        })
                    });
                    // Responsive
                    Object.keys(bricss.build.settings.screenSizes).forEach(function(screenSize, index) {
                        responsiveMarkup += bricss.templates.docScreenSizeCheckboxItem({
                            id: `dsg__doc__standard__${property}_${screenSize}`,
                            screenSize: screenSize,
                            disabled: propertyData.responsive ? false : true
                        });
                    });
                    // Utility
                    utilityMarkup = bricss.templates.docUtilityCheckboxItem({
                        id: `dsg__doc__utility__${property}`,
                        label: `Apply`,
                        disabled: propertyData.generate_utility ? false : true
                    });
                    bricss.elDocStandard.innerHTML += bricss.templates.docPropertyItem({
                        property: property,
                        content: classesValuesMarkup,
                        responsiveContent: responsiveMarkup,
                        utilityContent: utilityMarkup
                    });
                }
            })
        }
    },
    updateFromUrl: function() {
        const params = new URLSearchParams(document.location.search);
        const searchValue = params.get('search');
        if (searchValue !== null) {
            if (searchValue.length > 0) {
                bricss.elSearchInput.value = searchValue;
                cToggle.open('menu');
            }
        }
    },
    _handlers: {
        _windowResize: function() {
            bricss.resetAllItems();
        }
    },
    update: function() {
        bricss.documentTitleOrigin = document.title;
        bricss.updateFromUrl();
    }
}
document.addEventListener('DOMContentLoaded', bricss.update);
window.addEventListener('resize', bricss._handlers._windowResize)