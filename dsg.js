const dsg = {
    elSandbox: document.querySelector('#dsg__sandbox'),
    elDocTokens: document.querySelector('#dsg__doc__tokens'),
    elDocStandard: document.querySelector('#dsg__doc__standard'),
    elCodeCss: document.querySelector('#dsg__code__css'),
    getBuild: function(jsonUrl) {
        if (typeof jsonUrl == 'string') {
            fetch(`${jsonUrl}`)
                .then(response => response.json())
                .then(json => {
                    dsg.build = json;
                    dsg.genDoc();
                    dsg.genCode();
                    console.log(dsg.build);
                })
                .catch(error => {
                    // Handle the error
                    console.log('Build JSON load failed');
                });
        }
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
        let highMarkup = ` and (max-width: ${dsg.build.tokens.screenSizes[screenSize][1]})`;
        const lowMarkup = `(min-width: ${dsg.build.tokens.screenSizes[screenSize][0]})`;
        const high =  dsg.build.tokens.screenSizes[screenSize][1];
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
    genTokens: function() {
        // let markup = '';
        // Object.keys(dsg.build.tokens).forEach(function(family) {
        //     Object.keys(dsg.build.tokens[family]).forEach(function(tokenName) {
        //         markup += `\n  --${dsg.build.settings.cssVariablesPrefix}-${family}-${tokenName}: ${dsg.build.tokens[family][tokenName]};`;
        //     });
        // });
        // return `\n:root {\n${markup}\n}\n`;
    },
    genCode: function() {
        const responsiveCss = {};
        dsg.elCodeCss.innerHTML = dsg.genCssVariables();
        Object.keys(dsg.build.tokens.screenSizes).forEach(function(screenSize) {
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
                    Object.keys(dsg.build.tokens.screenSizes).forEach(function(screenSize) {
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
                    Object.keys(dsg.build.tokens.screenSizes).forEach(function(screenSize) {
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
        dsg.elCodeCss.dataset.highlighted = '';
        hljs.highlightElement(dsg.elCodeCss);
        
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
            return `<li><code>${classes}</code><br><code>${attribute}</code> <br>${value}</li>`;
        },
        docClassValueItem: function({className, value}) {
            return `
                <li><code>${className}</code> ${value}</li>
            `;
        },
        docUtilityCheckboxItem: function({id, label}) {
            return `
                <div>
                    <input type="checkbox"
                        id="${id}"
                        value=""
                        onchange="dsg.setResponsive(event)">
                    <label for="${id}">${label}</label>
                </div>
            `;
        },
        docScreenSizeCheckboxItem: function({id, screenSize}) {
            return `
                <div>
                    <input type="checkbox"
                        id="${id}"
                        value="${screenSize}"
                        onchange="dsg.setResponsive(event)">
                    <label for="${id}">${screenSize}</label>
                </div>
            `;
        },
        docPropertyItem: function({property, content, responsiveContent, utilityContent}) {
            return `
                <li class="dsg__doc__property_item" data-property="${property}">
                    <h4>${property}</h4>
                    <ul class="dsg__doc__property_item__list">
                        ${content}
                    </ul>
                    <fieldset class="dsg__doc__property_item__responsive_content">
                        <legend>Responsive</legend>
                        ${responsiveContent}
                    </fieldset>
                    <fieldset class="dsg__doc__property_item__utility_content">
                        <legend>Utitity</legend>
                        ${utilityContent}
                    </fieldset>
                </li>
            `;
        }
    },
    genDoc: function() {
        dsg.elDocStandard.innerHTML = '';
        Object.keys(dsg.build.properties).forEach(function(property) {
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
            if (propertyData.responsive) {
                Object.keys(dsg.build.tokens.screenSizes).forEach(function(screenSize, index) {
                    responsiveMarkup += dsg.templates.docScreenSizeCheckboxItem({
                        id: `dsg__doc__standard__${property}_${screenSize}`,
                        screenSize: screenSize
                    });
                });
            }
            // Utility
            if (propertyData.generate_utility) {
                utilityMarkup = dsg.templates.docUtilityCheckboxItem({
                    id: `dsg__doc__utility__${property}`,
                    label: `Apply`
                });
            }
            dsg.elDocStandard.innerHTML += dsg.templates.docPropertyItem({
                property: property,
                content: classesValuesMarkup,
                responsiveContent: responsiveMarkup,
                utilityContent: utilityMarkup
            });
        })
    }
}