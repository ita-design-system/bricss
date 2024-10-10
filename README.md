# BRiCSS

A simple and tailored low-level CSS library.

Optimize library size by selecting responsive CSS properties you really use.

One CSS Property <=> One Abbreviation

Define CSS you really use

<CSS_PROPERTY_PREFIX> + <SEPARATOR> + <VALUE_NAME>
Example
if color property prefix is "c" and separator is "-" and one value name is primary:
c-primary
means if colors are tokens
color: var(--<CSS_VARIABLE_PREFIX><SEPARATOR><TOKEN_FAMILY_NAME><VALUE_NAME>)
color: var(--foo-colors-primary, #FF1234)
else
color: var(--<CSS_VARIABLE_PREFIX><SEPARATOR><TOKEN_FAMILY_NAME><VALUE_NAME>)

![Example 1](assets/medias/example-01.avif)

In that example

| Common class name | Meaning |
|- |- |
| `d-flex` | `display: flex` |
| `fd-column` | `flex-direction: column` |
| `pos-fixed` | `position: fixed` |
| `bottom-0` | `bottom: 0` |
| `left-0` | `left: 0` |

| Attrubute | Meaning |
|- |- |
| `fs-8="xs"` | font size named `8` applied on xs screen sizes |
| `d-flex="xs,sm"` | `display: flex` on xs and sm<sup>[1]</sup> screen sizes |


| Parameter | Type | Default | Description |
|- |- |- |- |
| separator | String | `-` | Common tiny string applied between each prefixes and value names |
| responsiveSeparator | String | `--` | Tiny string applied before screen size names prefixes on responsive class names |
| utilitiesPrefix | String | `u` | Abbreviation applied on utilities class name that add the !important keyword after the value |
| cssVariablesPrefix | String | `bri` | Abbreviation applied for tokens CSS variables |
| screenSizes | String | |

[1]: #pouet

* Only a browser is required
* No build tools
* Automatic documentation
* Download, unzip, set up and use
* Choose CSS properties you really use
* CSS property centric
* Apply responsive selectively