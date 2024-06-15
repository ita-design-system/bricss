const ds = {
    getBuild: function(jsonUrl) {
        if (typeof jsonUrl == 'string') {
            fetch(`${jsonUrl}`)
                .then(response => response.json())
                .then(json => {
                    ds.build = json;
                    ds._getBuildSuccess = true;
                    ds.autoGen();
                    console.log(ds.build);
                })
                .catch(error => {
                    // Handle the error
                    console.log('Build JSON load failed', ds._getBuildSuccess);
                    ds._getBuildSuccess = false;
                });
        }
    },
    getTokens: function(jsonUrl) {
        if (typeof jsonUrl == 'string') {
            fetch(`${jsonUrl}`)
                .then(response => response.json())
                .then(json => {
                    ds.tokens = json;
                    ds._getTokensSuccess = true;
                    ds.autoGen();
                    console.log(ds.tokens);
                })
                .catch(error => {
                    // Handle the error
                    console.log(error, 'Tokens JSON load failed', ds._getTokensSuccess);
                    ds._getTokensSuccess = false;
                });
        }
    },
    _getTokensSuccess: false,
    _getBuildSuccess: false,
    autoGen: function() {
        if (ds._getBuildSuccess && ds._getTokensSuccess) {
            ds.genCode();
            ds.genDoc();
        }
    },
    isATokenFamily: function(tokensFamily) {
        const tokensFamilies = Object.keys(ds.tokens);
        let response = false;
        if (tokensFamilies.indexOf(tokensFamily) > -1) response = true;
        return response;
    },
    genFrom: function(tokensFamily) {
        const array = [];
        if (ds.isATokenFamily(tokensFamily)) {
            Object.keys(ds.tokens[tokensFamily]).forEach(function(tokenName) {
                array.push({
                    name: tokenName,
                    value: ds.tokens[tokensFamily][tokenName]
                });
            });
        }
        return array;
    },
    genCssMediaForScreenSize: function({screenSize, content}) {
        let highMarkup = ` and (max-width: ${ds.tokens.screenSizes[screenSize][1]})`;
        const lowMarkup = `(min-width: ${ds.tokens.screenSizes[screenSize][0]})`;
        const high = ds.tokens.screenSizes[screenSize][1];
        if (high == 'infinite' || high == '') highMarkup = '';
        return `\n\n/*START @media ${screenSize}*/\n@media ${lowMarkup}${highMarkup} {\n${content}\n}\n/*END @media ${screenSize}*/\n`;
    },
    genCssPropertyForScreenSize: function({screenSize, prefix, name, property, value, utility}) {
        const separator = prefix == '' ? '' : ds.tokens.separator;
        let markup = `\n.${prefix}${separator}${name}${ds.tokens.responsiveSeparator}${screenSize},\n[${prefix}${separator}${name}*="${screenSize}"] {\n  ${property}: ${value};\n}`;
        if (utility) {
            markup += `\n.${ds.tokens.utilitiesPrefix}${ds.tokens.separator}${prefix}${separator}${name}${ds.tokens.responsiveSeparator}${screenSize},\n[${ds.tokens.utilitiesPrefix}${ds.tokens.separator}${prefix}${separator}${name}*="${screenSize}"] {\n  ${property}: ${value} !important;\n}`;
        }
        return markup;
    },
    genCssProperty: function({prefix, name, property, value, utility}) {
        const separator = prefix == '' ? '' : ds.tokens.separator;
        let markup = `\n.${prefix}${separator}${name} {\n  ${property}: ${value};\n}`;
        if (utility) {
            markup += `\n.${ds.tokens.utilitiesPrefix}${ds.tokens.separator}${prefix}${separator}${name} {\n  ${property}: ${value} !important;\n}`;
        }
        return markup;
    },
    genCssVariables: function() {
        const basics = ['colors', 'fontFamilies', 'fontSizes', 'spacings'];
        let markup = '';
        basics.forEach(function(family) {
            Object.keys(ds.tokens[family]).forEach(function(tokenName) {
                markup += `\n  --${ds.tokens.cssVariablesPrefix}-${family}-${tokenName}: ${ds.tokens[family][tokenName]};`;
            });
        });
        return `\n:root {\n${markup}\n}\n`;
    },
    genCode: function() {
        const responsiveCss = {};
        foo.innerHTML = ds.genCssVariables();
        Object.keys(ds.tokens.screenSizes).forEach(function(screenSize) {
            responsiveCss[screenSize] = '';
        });
        Object.keys(ds.build).forEach(function(property) {
            const propertyData = ds.build[property];
            const tokensKeysAndValues = ds.genFrom(propertyData.generate_from);
            // console.log(tokens_keys_and_values)
            // Generate from custom values
            propertyData.values.forEach(function(value, index) {
                let name = value;
                if (typeof propertyData.names[index] == 'string') name = propertyData.names[index];
                // Basic
                foo.innerHTML += ds.genCssProperty({
                    prefix: propertyData.prefix,
                    property: property,
                    name: name,
                    value: value,
                    utility: propertyData.generate_utility
                });
                // Responsive
                if (propertyData.responsive) {
                    Object.keys(ds.tokens.screenSizes).forEach(function(screenSize) {
                        responsiveCss[screenSize] += ds.genCssPropertyForScreenSize({
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
                foo.innerHTML += ds.genCssProperty({
                    prefix: propertyData.prefix,
                    property: property,
                    name: token.name,
                    value: `var(--${ds.tokens.cssVariablesPrefix}-${propertyData.generate_from}-${token.name}, ${token.value})`,
                    utility: propertyData.generate_utility
                });

                // Responsive from tokens
                if (propertyData.responsive) {
                    Object.keys(ds.tokens.screenSizes).forEach(function(screenSize) {
                        responsiveCss[screenSize] += ds.genCssPropertyForScreenSize({
                            screenSize: screenSize,
                            prefix: propertyData.prefix,
                            property: property,
                            name: token.name,
                            value: `var(--${ds.tokens.cssVariablesPrefix}-${propertyData.generate_from}-${token.name}, ${token.value})`,
                            utility: propertyData.generate_utility
                        });
                    });
                }
            });
        });
        Object.keys(responsiveCss).forEach(function(screenSize) {
            foo.innerHTML += ds.genCssMediaForScreenSize({
                screenSize: screenSize,
                content: responsiveCss[screenSize]
            });
        });
        bar.innerHTML = foo.innerHTML;
        bar.dataset.highlighted = '';
        hljs.highlightElement(bar);
        
    },
    setResponsive: function(evt) {
        const selectedScreenSizesNames = [];
        const elProperty = evt.target.closest('.doc__property_item');
        const property = elProperty.dataset.property;
        const elPropertyList = elProperty.querySelector('.doc__property_item__list');
        const elFieldsetResponsive = elProperty.querySelector('.doc__property_item__responsive_content');
        const elUtilityCheckbox = elProperty.querySelector(`#doc__utility__${property}`);
        let utilityChecked = false;
        if (elUtilityCheckbox !== null) {
            if (elUtilityCheckbox.checked) {
                utilityChecked = true;
            }
        }
        const propertyData = ds.build[property];
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
        const tokensKeysAndValues = ds.genFrom(propertyData.generate_from);
        tokensKeysAndValues.forEach(function(token) {
            propertyAllNamesAndValues.push(token);
        });
        
        propertyAllNamesAndValues.forEach(function(data) {
            let base = `${propertyData.prefix}${ds.tokens.separator}${data.name}`;
            let value = data.value;
            if (utilityChecked) {
                base = `${ds.tokens.utilitiesPrefix}${ds.tokens.separator}${base}`;
                value += ' !important';
            }
            if (selectedScreenSizesNames.length > 0) {
                const responsiveAttribute = `${base}="${selectedScreenSizesNames.toString()}"`;
                let responsiveCssClasses = '';
                selectedScreenSizesNames.forEach(function(screenSize) {
                    responsiveCssClasses += ` ${base}${ds.tokens.responsiveSeparator}${screenSize}`;
                });
                // Generate responsive markup
                markup += ds.templates.docClassValueResponsiveItem({
                    classes: responsiveCssClasses,
                    attribute: responsiveAttribute,
                    value: value
                });
            } else {
                // Generate standard markup
                markup += ds.templates.docClassValueItem({
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
                        onchange="ds.setResponsive(event)">
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
                        onchange="ds.setResponsive(event)">
                    <label for="${id}">${screenSize}</label>
                </div>
            `;
        },
        docPropertyItem: function({property, content, responsiveContent, utilityContent}) {
            return `
                <li class="doc__property_item" data-property="${property}">
                    <h4>${property}</h4>
                    <ul class="doc__property_item__list">
                        ${content}
                    </ul>
                    <fieldset class="doc__property_item__responsive_content">
                        <legend>Responsive</legend>
                        ${responsiveContent}
                    </fieldset>
                    <fieldset class="doc__property_item__utility_content">
                        <legend>Utitity</legend>
                        ${utilityContent}
                    </fieldset>
                </li>
            `;
        }
    },
    genDoc: function() {
        doc__standard.innerHTML = '';
        Object.keys(ds.build).forEach(function(property) {
            const propertyData = ds.build[property];
            const tokensKeysAndValues = ds.genFrom(propertyData.generate_from);
            let classesValuesMarkup = '';
            let responsiveMarkup = '';
            let utilityMarkup = '';
            // Generate from custom values
            propertyData.values.forEach(function(value, index) {
                let name = value;
                if (typeof propertyData.names[index] == 'string') name = propertyData.names[index];
                // Generate from values
                classesValuesMarkup += ds.templates.docClassValueItem({
                    className: propertyData.prefix + ds.tokens.separator + name,
                    value: value
                })
            });
            // Generate from tokens
            tokensKeysAndValues.forEach(function(token) {
                classesValuesMarkup += ds.templates.docClassValueItem({
                    className: propertyData.prefix + ds.tokens.separator + token.name,
                    value: token.value
                })
            });
            // Responsive
            if (propertyData.responsive) {
                Object.keys(ds.tokens.screenSizes).forEach(function(screenSize, index) {
                    responsiveMarkup += ds.templates.docScreenSizeCheckboxItem({
                        id: `doc__standard__${property}_${screenSize}`,
                        screenSize: screenSize
                    });
                });
            }
            // Utility
            if (propertyData.generate_utility) {
                utilityMarkup = ds.templates.docUtilityCheckboxItem({
                    id: `doc__utility__${property}`,
                    label: `Apply`
                });
            }
            doc__standard.innerHTML += ds.templates.docPropertyItem({
                property: property,
                content: classesValuesMarkup,
                responsiveContent: responsiveMarkup,
                utilityContent: utilityMarkup
            });
        })
    }
}