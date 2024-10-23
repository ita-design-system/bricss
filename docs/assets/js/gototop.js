const goToTop = {
    run: function() {
        if (window.scrollY > 100) {
            goToTop.elBtn.style.display = null;
        } else {
            goToTop.elBtn.style.display = 'none';
        }
    },
    now: function() {
        window.scroll({ top: 0, behavior: 'smooth' });
    },
    update: function() {
        if (goToTop.elBtn === undefined) {
            goToTop.elBtn = document.createElement('button');
            goToTop.elBtn.setAttribute('class', 'pos-fixed bottom-0 right-0 | mr-5 mb-5 p-3 p-1--xs | bc-primary-700 c-tertiary-500 bwidth-1 bstyle-solid bcolor-tertiary-500 cur-pointer __animation_3');
            goToTop.elBtn.type = 'button';
            goToTop.elBtn.innerText = "↑";
            goToTop.elBtn.title = "Go to top";
            goToTop.elBtn.setAttribute('onclick', 'goToTop.now()');
            goToTop.elBtn.style.display = 'none';
            document.body.appendChild(goToTop.elBtn);
            window.addEventListener('scroll', goToTop.run);
        }
    }
}
document.addEventListener('DOMContentLoaded', goToTop.update);