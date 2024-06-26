const dsg = {
    elSandbox: document.querySelector('#dsg__sandbox'),
    elSandboxIframe: document.querySelector('#dsg__sandbox__iframe'),
    elDocTokens: document.querySelector('#dsg__doc__tokens'),
    elDocStandard: document.querySelector('#dsg__doc__standard'),
    elCodeCss: document.querySelector('#dsg__code__css'),
    elSearchInput: document.querySelector('#dsg__search__input'),
    getBuild: function(jsonUrl) {
        if (typeof jsonUrl == 'string') {
            fetch(`${jsonUrl}`)
                .then(response => response.json())
                .then(json => {
                    dsg.build = json;
                    dsg.genDocStandard();
                    dsg.genDocTokens();
                    dsg.genCodeCss();
                    dsg.includeCssInSandbox();
                    dsg.scrollToHash();
                    console.log(dsg.build);
                })
                .catch(error => {
                    // Handle the error
                    console.log('Build JSON load failed');
                });
        }
    },
    scrollToHash: function() {
        if (location.hash != '') {
            const elTarget = document.querySelector(location.hash);
            if (elTarget !== null) {
                elTarget.scrollIntoView({behavior: 'smooth'});
            }
        }
    },
    searchText: function(query) {
        dsg.elDocStandard.querySelectorAll('.dsg__doc__property_item').forEach(function(el) {
            const elementContent = el.innerText.toLowerCase();
            const queryContent = query.toLowerCase();
            if (elementContent.indexOf(queryContent) == -1) {
                el.style.display = 'none';
            } else {
                el.style.display = null;
            }
        });
    },
    isATokenFamily: function(tokensFamily) {
        const tokensFamilies = Object.keys(dsg.build.tokens);
        let response = false;
        if (tokensFamilies.indexOf(tokensFamily) > -1) response = true;
        return response;
    },
    genFrom: function(tokensFamily) {
        const array = [];
        if (dsg.isATokenFamily(tokensFamily)) {
            Object.keys(dsg.build.tokens[tokensFamily]).forEach(function(tokenName) {
                array.push({
                    name: tokenName,
                    value:  dsg.build.tokens[tokensFamily][tokenName]
                });
            });
        }
        return array;
    },
    genCssMediaForScreenSize: function({screenSize, content}) {
        let highMarkup = ` and (max-width: ${dsg.build.settings.screenSizes[screenSize][1]})`;
        const lowMarkup = `(min-width: ${dsg.build.settings.screenSizes[screenSize][0]})`;
        const high =  dsg.build.settings.screenSizes[screenSize][1];
        if (high == 'infinite' || high == '') highMarkup = '';
        return `\n\n/*START @media ${screenSize}*/\n@media ${lowMarkup}${highMarkup} {\n${content}\n}\n/*END @media ${screenSize}*/\n`;
    },
    genCssPropertyForScreenSize: function({screenSize, prefix, name, property, value, utility}) {
        const separator = prefix == '' ? '' :  dsg.build.settings.separator;
        let markup = `\n.${prefix}${separator}${name}${dsg.build.settings.responsiveSeparator}${screenSize},\n[${prefix}${separator}${name}*="${screenSize}"] {\n  ${property}: ${value};\n}`;
        if (utility) {
            markup += `\n.${dsg.build.settings.utilitiesPrefix}${dsg.build.settings.separator}${prefix}${separator}${name}${dsg.build.settings.responsiveSeparator}${screenSize},\n[${dsg.build.settings.utilitiesPrefix}${dsg.build.settings.separator}${prefix}${separator}${name}*="${screenSize}"] {\n  ${property}: ${value} !important;\n}`;
        }
        return markup;
    },
    genCssProperty: function({prefix, name, property, value, utility}) {
        const separator = prefix == '' ? '' :  dsg.build.settings.separator;
        let markup = `\n.${prefix}${separator}${name} {\n  ${property}: ${value};\n}`;
        if (utility) {
            markup += `\n.${dsg.build.settings.utilitiesPrefix}${dsg.build.settings.separator}${prefix}${separator}${name} {\n  ${property}: ${value} !important;\n}`;
        }
        return markup;
    },
    genCssVariables: function() {
        let markup = '';
        Object.keys(dsg.build.tokens).forEach(function(family) {
            Object.keys(dsg.build.tokens[family]).forEach(function(tokenName) {
                markup += `\n  --${dsg.build.settings.cssVariablesPrefix}-${family}-${tokenName}: ${dsg.build.tokens[family][tokenName]};`;
            });
        });
        return `\n:root {\n${markup}\n}\n`;
    },
    genDocTokens: function() {
        // let markup = '';
        // Object.keys(dsg.build.tokens).forEach(function(family) {
        //     Object.keys(dsg.build.tokens[family]).forEach(function(tokenName) {
        //         markup += `\n  --${dsg.build.settings.cssVariablesPrefix}-${family}-${tokenName}: ${dsg.build.tokens[family][tokenName]};`;
        //     });
        // });
        // return `\n:root {\n${markup}\n}\n`;
    },
    genCodeCss: function() {
        if (dsg.elCodeCss !== null) {
            const responsiveCss = {};
            dsg.elCodeCss.innerHTML = dsg.genCssVariables();
            Object.keys(dsg.build.settings.screenSizes).forEach(function(screenSize) {
                responsiveCss[screenSize] = '';
            });
            Object.keys(dsg.build.properties).forEach(function(property) {
                const propertyData = dsg.build.properties[property];
                const tokensKeysAndValues = dsg.genFrom(propertyData.generate_from);
                // console.log(tokens_keys_and_values)
                // Generate from custom values
                propertyData.values.forEach(function(value, index) {
                    let name = value;
                    if (typeof propertyData.names[index] == 'string') name = propertyData.names[index];
                    // Basic
                    dsg.elCodeCss.innerHTML += dsg.genCssProperty({
                        prefix: propertyData.prefix,
                        property: property,
                        name: name,
                        value: value,
                        utility: propertyData.generate_utility
                    });
                    // Responsive
                    if (propertyData.responsive) {
                        Object.keys(dsg.build.settings.screenSizes).forEach(function(screenSize) {
                            responsiveCss[screenSize] += dsg.genCssPropertyForScreenSize({
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
                    dsg.elCodeCss.innerHTML += dsg.genCssProperty({
                        prefix: propertyData.prefix,
                        property: property,
                        name: token.name,
                        value: `var(--${dsg.build.settings.cssVariablesPrefix}-${propertyData.generate_from}-${token.name}, ${token.value})`,
                        utility: propertyData.generate_utility
                    });
    
                    // Responsive from tokens
                    if (propertyData.responsive) {
                        Object.keys(dsg.build.settings.screenSizes).forEach(function(screenSize) {
                            responsiveCss[screenSize] += dsg.genCssPropertyForScreenSize({
                                screenSize: screenSize,
                                prefix: propertyData.prefix,
                                property: property,
                                name: token.name,
                                value: `var(--${dsg.build.settings.cssVariablesPrefix}-${propertyData.generate_from}-${token.name}, ${token.value})`,
                                utility: propertyData.generate_utility
                            });
                        });
                    }
                });
            });
            Object.keys(responsiveCss).forEach(function(screenSize) {
                dsg.elCodeCss.innerHTML += dsg.genCssMediaForScreenSize({
                    screenSize: screenSize,
                    content: responsiveCss[screenSize]
                });
            });
            dsg._newestCssCode = dsg.elCodeCss.innerHTML;
            dsg.elCodeCss.dataset.highlighted = '';
            hljs.highlightElement(dsg.elCodeCss);
        }
    },
    includeCssInSandbox: function() {
        if (dsg.elSandboxIframe !== null) {
            const elIncludedStyle = dsg.elSandboxIframe.contentWindow.document.head.querySelector('#dsg__included_style');
            if (elIncludedStyle === null) {
                const includedStyleMarkup = `<style id="dsg__included_style">${dsg._newestCssCode}</style>`;
                dsg.elSandboxIframe.contentWindow.document.head.insertAdjacentHTML('beforeend', includedStyleMarkup);
            } else {
                elIncludedStyle.innerHTML = dsg._newestCssCode;
            }
        }
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
        const propertyData = dsg.build.properties[property];
        const propertyAllNamesAndValues = [];
        let markup = '';
        elFieldsetResponsive.querySelectorAll('input:checked').forEach(function(el) {
            selectedScreenSizesNames.push(el.value);
        });
        // Get custom values and names
        propertyData.values.forEach(function(value, index) {
            let name = value;
            if (typeof propertyData.names[index] == 'string') name = propertyData.names[index];
            propertyAllNamesAndValues.push({name, value});
        });
        // Get from token if specified
        const tokensKeysAndValues = dsg.genFrom(propertyData.generate_from);
        tokensKeysAndValues.forEach(function(token) {
            propertyAllNamesAndValues.push(token);
        });
        
        propertyAllNamesAndValues.forEach(function(data) {
            let base = `${propertyData.prefix}${dsg.build.settings.separator}${data.name}`;
            let value = data.value;
            if (utilityChecked) {
                base = `${dsg.build.settings.utilitiesPrefix}${dsg.build.settings.separator}${base}`;
                value += ' !important';
            }
            if (selectedScreenSizesNames.length > 0) {
                const responsiveAttribute = `${base}="${selectedScreenSizesNames.toString()}"`;
                let responsiveCssClasses = '';
                selectedScreenSizesNames.forEach(function(screenSize) {
                    responsiveCssClasses += ` ${base}${dsg.build.settings.responsiveSeparator}${screenSize}`;
                });
                // Generate responsive markup
                markup += dsg.templates.docClassValueResponsiveItem({
                    classes: responsiveCssClasses,
                    attribute: responsiveAttribute,
                    value: value
                });
            } else {
                // Generate standard markup
                markup += dsg.templates.docClassValueItem({
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
                <li class="d-flex jc-space-between gap-5 | mb-3">
                    <div class="d-flex fd-column gap-1">
                        <span class="d-flex fd-column">
                            <span class="ff-lead-400 fs-1 tt-uppercase | c-secondary-700">CSS Classes</span>
                            <code class="ff-mono fs-3 | c-secondary-500">${classes}</code>
                        </span>
                        <span class="d-flex fd-column">
                            <span class="ff-lead-400 fs-1 tt-uppercase | c-tertiary-700">Attribute</span>
                            <code class="ff-mono fs-3 | c-tertiary-300">${attribute}</code>
                        </span>
                    </div>
                    <span class="d-flex fd-column ai-end">
                        <span class="ff-lead-400 fs-1 tt-uppercase | c-tertiary-700">Value</span>
                        <code class="ff-mono fs-3 ta-right | c-tertiary-500">${value}</code>
                    </span>
                </li>`;
        },
        docClassValueItem: function({className, value}) {
            return `
                <li class="d-flex jc-space-between gap-5 | fs-3">
                    <code class="c-quaternary-500">${className}</code>
                    <strong class="ff-mono ta-right | c-tertiary-500">${value}</strong>
                </li>
            `;
        },
        docUtilityCheckboxItem: function({id, label, disabled}) {
            return `
                <div>
                    <input type="checkbox"
                        id="${id}"
                        value=""
                        onchange="dsg.setResponsive(event)"
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
                        onchange="dsg.setResponsive(event)"
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
                <li class="dsg__doc__property_item | d-flex jc-space-between fwrap-wrap gap-6"
                    data-property="${property}">
                    <h4 class="d-flex fd-column gap-3 fg-1 | m-0 | brwidth-1 brstyle-solid bcolor-secondary-900">
                        <span class="d-flex fd-column">
                            <span class="ff-lead-400 fs-1 tt-uppercase | c-secondary-700">Property</span>
                            <span class="d-flex ai-center gap-6 | ff-mono fs-5 | c-secondary-500">
                                ${property}
                                <span class="fg-1 | ta-right | bbwidth-1 bbstyle-solid bcolor-secondary-900"></span>
                            </span>
                        </span>
                        <span class="d-flex fd-column">
                            <span class="ff-lead-400 fs-1 tt-uppercase | c-quaternary-800">Prefix</span>
                            <span class="ff-mono fs-5 | c-quaternary-500">
                                ${dsg.build.properties[property].prefix}${dsg.build.settings.separator}
                            </span>
                        </span>
                    </h4>
                    <div class="d-flex gap-6" fd-column="xs,sm" w-100="xs">
                        <ul class="dsg__doc__property_item__list | d-flex fd-column gap-1 | m-0 p-0"
                            minw-20em="sm,md,lg"
                            maxw-20em="sm,md,lg">
                            <li class="d-flex jc-space-between gap-3 | fs-1 tt-uppercase">
                                <span class="c-quaternary-800">CSS Class</span>
                                <span class="c-tertiary-700">Value</span>
                            </li>
                            ${content}
                        </ul>
                        <div class="d-flex gap-1">
                            <fieldset class="dsg__doc__property_item__responsive_content | d-flex fd-column gap-1 | bwidth-1 bstyle-solid bcolor-primary-500 brad-2">
                                <legend class="fs-2 | c-primary-300">Responsive</legend>
                                ${responsiveContent}
                            </fieldset>
                            <fieldset class="dsg__doc__property_item__utility_content | d-flex fd-column gap-1 | bwidth-1 bstyle-solid bcolor-primary-500 brad-2">
                                <legend class="fs-2 | c-primary-300">Utitity</legend>
                                ${utilityContent}
                            </fieldset>
                        </div>
                    </div>
                </li>
            `;
        }
    },
    genDocStandard: function() {
        if (dsg.elDocStandard !== null) {
            dsg.elDocStandard.innerHTML = '';
            Object.keys(dsg.build.properties).forEach(function(property) {
                if (property.indexOf('--') == -1) {
                    const propertyData = dsg.build.properties[property];
                    const tokensKeysAndValues = dsg.genFrom(propertyData.generate_from);
                    let classesValuesMarkup = '';
                    let responsiveMarkup = '';
                    let utilityMarkup = '';
                    // Generate from custom values
                    propertyData.values.forEach(function(value, index) {
                        let name = value;
                        if (typeof propertyData.names[index] == 'string') name = propertyData.names[index];
                        // Generate from values
                        classesValuesMarkup += dsg.templates.docClassValueItem({
                            className: propertyData.prefix +  dsg.build.settings.separator + name,
                            value: value
                        })
                    });
                    // Generate from tokens
                    tokensKeysAndValues.forEach(function(token) {
                        classesValuesMarkup += dsg.templates.docClassValueItem({
                            className: propertyData.prefix +  dsg.build.settings.separator + token.name,
                            value: token.value
                        })
                    });
                    // Responsive
                    Object.keys(dsg.build.settings.screenSizes).forEach(function(screenSize, index) {
                        responsiveMarkup += dsg.templates.docScreenSizeCheckboxItem({
                            id: `dsg__doc__standard__${property}_${screenSize}`,
                            screenSize: screenSize,
                            disabled: propertyData.responsive ? false : true
                        });
                    });
                    // Utility
                    utilityMarkup = dsg.templates.docUtilityCheckboxItem({
                        id: `dsg__doc__utility__${property}`,
                        label: `Apply`,
                        disabled: propertyData.generate_utility ? false : true
                    });
                    dsg.elDocStandard.innerHTML += dsg.templates.docPropertyItem({
                        property: property,
                        content: classesValuesMarkup,
                        responsiveContent: responsiveMarkup,
                        utilityContent: utilityMarkup
                    });
                }
            })
        }
    }
}