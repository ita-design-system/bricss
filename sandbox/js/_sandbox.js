// ONLY FOR SANDBOX PURPOSE
const sandbox = {
    update: function() {
        // Include newest CSS
        const includedStyleMarkup = `<link rel="stylesheet" href="${window.parent.dsgCssFile.url}">`;
        document.head.insertAdjacentHTML('beforeend', includedStyleMarkup);
    }
}
sandbox.update();