const ds = {
    getBuild: function(json_url) {
        if (typeof json_url == 'string') {
            fetch(`${json_url}`)
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
    getTokens: function(json_url) {
        if (typeof json_url == 'string') {
            fetch(`${json_url}`)
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
    isATokenFamily: function(tokens_family) {
        const tokens_families = Object.keys(ds.tokens);
        let response = false;
        if (tokens_families.indexOf(tokens_family) > -1) response = true;
        return response;
    },
    genFrom: function(tokens_family) {
        const array = [];
        if (ds.isATokenFamily(tokens_family)) {
            Object.keys(ds.tokens[tokens_family]).forEach(function(token_name) {
                array.push({
                    name: token_name,
                    value: ds.tokens[tokens_family][token_name]
                });
            });
        }
        return array;
    },
    genCssMediaForScreenSize: function({screen_size, content}) {
        let high_markup = ` and (max-width: ${ds.tokens.screenSizes[screen_size][1]})`;
        const low_markup = `(min-width: ${ds.tokens.screenSizes[screen_size][0]})`;
        const high = ds.tokens.screenSizes[screen_size][1];
        if (high == 'infinite' || high == '') high_markup = '';
        return `\n\n/*START @media ${screen_size}*/\n@media ${low_markup}${high_markup} {\n${content}\n}\n/*END @media ${screen_size}*/\n`;
    },
    genCssPropertyForScreenSize: function({screen_size, prefix, name, property, value, utility}) {
        const separator = prefix == '' ? '' : ds.tokens.separator;
        let markup = `\n.${prefix}${separator}${name}${ds.tokens.responsiveSeparator}${screen_size},\n[${prefix}${separator}${name}*="${screen_size}"] {\n  ${property}: ${value};\n}`;
        if (utility) {
            markup += `\n.${ds.tokens.utilitiesPrefix}${ds.tokens.separator}${prefix}${separator}${name}${ds.tokens.responsiveSeparator}${screen_size},\n[${ds.tokens.utilitiesPrefix}${ds.tokens.separator}${prefix}${separator}${name}*="${screen_size}"] {\n  ${property}: ${value} !important;\n}`;
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
            Object.keys(ds.tokens[family]).forEach(function(token_name) {
                markup += `\n  --${ds.tokens.cssVariablesPrefix}-${family}-${token_name}: ${ds.tokens[family][token_name]};`;
            });
        });
        return `\n:root {\n${markup}\n}\n`;
    },
    genCode: function() {
        const responsive_css = {};
        foo.innerHTML = ds.genCssVariables();
        Object.keys(ds.tokens.screenSizes).forEach(function(screen_size) {
            responsive_css[screen_size] = '';
        });
        Object.keys(ds.build).forEach(function(property) {
            const property_data = ds.build[property];
            const tokens_keys_and_values = ds.genFrom(property_data.generate_from);
            // console.log(tokens_keys_and_values)
            // Generate from custom values
            property_data.values.forEach(function(value, index) {
                let name = value;
                if (typeof property_data.names[index] == 'string') name = property_data.names[index];
                // Basic
                foo.innerHTML += ds.genCssProperty({
                    prefix: property_data.prefix,
                    property: property,
                    name: name,
                    value: value,
                    utility: property_data.generate_utility
                });
                // Responsive
                if (property_data.responsive) {
                    Object.keys(ds.tokens.screenSizes).forEach(function(screen_size) {
                        responsive_css[screen_size] += ds.genCssPropertyForScreenSize({
                            screen_size: screen_size,
                            prefix: property_data.prefix,
                            property: property,
                            name: name,
                            value: value,
                            utility: property_data.generate_utility
                        });
                    });
                }
            });

            // Generate from tokens
            tokens_keys_and_values.forEach(function(token) {
                foo.innerHTML += ds.genCssProperty({
                    prefix: property_data.prefix,
                    property: property,
                    name: token.name,
                    value: `var(--${ds.tokens.cssVariablesPrefix}-${property_data.generate_from}-${token.name}, ${token.value})`,
                    utility: property_data.generate_utility
                });

                // Responsive from tokens
                if (property_data.responsive) {
                    Object.keys(ds.tokens.screenSizes).forEach(function(screen_size) {
                        responsive_css[screen_size] += ds.genCssPropertyForScreenSize({
                            screen_size: screen_size,
                            prefix: property_data.prefix,
                            property: property,
                            name: token.name,
                            value: `var(--${ds.tokens.cssVariablesPrefix}-${property_data.generate_from}-${token.name}, ${token.value})`,
                            utility: property_data.generate_utility
                        });
                    });
                }
            });
        });
        Object.keys(responsive_css).forEach(function(screen_size) {
            foo.innerHTML += ds.genCssMediaForScreenSize({
                screen_size: screen_size,
                content: responsive_css[screen_size]
            });
        });
        bar.innerHTML = foo.innerHTML;
        bar.dataset.highlighted = '';
        hljs.highlightElement(bar);
        
    },
    setResponsive: function(evt) {
        const selectedScreenSizesNames = [];
        const elProperty = evt.target.closest('.doc__property_item');
        const elPropertyList = elProperty.querySelector('.doc__property_item__list');
        const elFieldset = evt.target.closest('fieldset');
        const property = elFieldset.dataset.property;
        const propertyData = ds.build[property];
        const propertyAllNamesAndValues = [];
        let markup = '';
        elFieldset.querySelectorAll('input:checked').forEach(function(el) {
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
            const base = `${propertyData.prefix}${ds.tokens.separator}${data.name}`;
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
                    value: data.value
                });
            } else {
                // Generate standard markup
                markup += ds.templates.docClassValueItem({
                    className: base,
                    value: data.value
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
        docScreenSizeCheckboxItem: function({id, screenSize, checked}) {
            return `
                <div>
                    <input type="checkbox"
                        id="${id}"
                        value="${screenSize}"
                        onchange="ds.setResponsive(event)" ${checked == true ? 'checked' : ''}>
                    <label for="${id}">${screenSize}</label>
                </div>
            `;
        },
        docPropertyItem: function({property, content, responsiveContent}) {
            return `
                <li class="doc__property_item">
                    <h4>${property}</h4>
                    <ul class="doc__property_item__list">
                        ${content}
                    </ul>
                    <fieldset data-property="${property}">
                        <legend>Responsive</legend>
                        ${responsiveContent}
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
                        id: `doc___standard__${property}_${screenSize}`,
                        screenSize: screenSize
                    });
                });
            }
            doc__standard.innerHTML += ds.templates.docPropertyItem({
                property: property,
                content: classesValuesMarkup,
                responsiveContent: responsiveMarkup
            });
        })
    }
}