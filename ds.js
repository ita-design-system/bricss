const ds = {
    getBuild: function(json_url) {
        if (typeof json_url == 'string') {
            fetch(`${json_url}`)
                .then(response => response.json())
                .then(json => {
                    this.build = json;
                    this._getBuildSuccess = true;
                    this.autoGen();
                    console.log(this.build);
                })
                .catch(error => {
                    // Handle the error
                    console.log('Build JSON load failed');
                    this._getBuildSuccess = false;
                });
        }
    },
    getTokens: function(json_url) {
        if (typeof json_url == 'string') {
            fetch(`${json_url}`)
                .then(response => response.json())
                .then(json => {
                    this.tokens = json;
                    this._getTokensSuccess = true;
                    this.autoGen();
                    console.log(this.tokens);
                })
                .catch(error => {
                    // Handle the error
                    console.log('Tokens JSON load failed');
                    this._getTokensSuccess = false;
                });
        }
    },
    _getTokensSuccess: false,
    _getBuildSuccess: false,
    autoGen: function() {
        if (this._getBuildSuccess && this._getTokensSuccess) this.genAll();
    },
    isATokenFamily: function(tokens_family) {
        const tokens_families = Object.keys(this.tokens);
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
        return `
            @media (min-width: ${ds.tokens.screenSizes[screen_size][0]}) and (max-width: ${ds.tokens.screenSizes[screen_size][1]}) {
                ${content}
            }
        `;
    },
    genCssPropertyForScreenSize: function({screen_size, prefix, name, property, value, utility}) {
        const separator = prefix == '' ? '' : ds.tokens.separator;
        let markup = `
            .${prefix}${separator}${name}${ds.tokens.responsiveSeparator}${screen_size},
            [${prefix}${separator}${name}*="${screen_size}"] {
                ${property}: ${value};
            }
        `;
        if (utility) {
            markup += `
            .${ds.tokens.utilitiesPrefix}${ds.tokens.separator}${prefix}${separator}${name}${ds.tokens.responsiveSeparator}${screen_size},
                [${ds.tokens.utilitiesPrefix}${ds.tokens.separator}${prefix}${separator}${name}*="${screen_size}"] {
                    ${property}: ${value} !important;
                }
            `;
        }
        return markup;
    },
    genCssProperty: function({prefix, name, property, value, utility}) {
        const separator = prefix == '' ? '' : ds.tokens.separator;
        let markup = `
            .${prefix}${separator}${name} {
                ${property}: ${value};
            }
        `;
        if (utility) {
            markup += `
                .${ds.tokens.utilitiesPrefix}${ds.tokens.separator}${prefix}${separator}${name} {
                    ${property}: ${value} !important;
                }
            `;
        }
        return markup;
    },
    genAll: function() {
        const responsive_css = {};
        Object.keys(this.tokens.screenSizes).forEach(function(screen_size) {
            responsive_css[screen_size] = '';
        });
        Object.keys(this.build).forEach(function(property) {
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
                    value: token.value,
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
                            value: token.value,
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
    }
}