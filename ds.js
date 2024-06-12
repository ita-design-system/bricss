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
        console.log(ds._getBuildSuccess,ds._getTokensSuccess)
        if (ds._getBuildSuccess && ds._getTokensSuccess) ds.genAll();
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
    genAll: function() {
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
        
    }
}