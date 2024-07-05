cScrollspyCallbacks.dsg_menu = {
    callback: function(data) {
        // Id of the tracked element
        const id = data[0].target.id;
        // Write intersection ratio into an custom object
        cScrollspy.callbacks.anchors.intersections[id] = data[0].intersectionRatio;
        // Get current id => intersection values
        const current_intersections = cScrollspy.callbacks.anchors.intersections;
        // Sort intersection values
        const intersections_sorted = Object.keys(current_intersections).sort(function(a,b){return current_intersections[b]-current_intersections[a]});
        // List of anchors ids
        const anchors_ids_optional_titles = {};
        intersections_sorted.forEach(function(id_intersection) {
            let optional_title = id_intersection;
            let el_title = document.querySelector(`#${id_intersection} h2`);
            if (el_title !== null) optional_title = el_title.innerText;
            anchors_ids_optional_titles[id_intersection] = optional_title;
        });
        // For each sorted intersection, check every link pointing to this element id
        intersections_sorted.forEach(function(id_intersection, index) {
            document.querySelectorAll('[href="#'+id_intersection+'"]').forEach(function(el_anchor) {
                // Optional active classes
                const el_source = cScrollspy.instances[id_intersection].el;
                let active_class_attribute = el_source.dataset.activeClass;
                let origin_class_attribute = el_anchor.dataset.classOrigin || '';
                // If no active class is set, apply 'active' as default
                if (active_class_attribute === undefined) {
                    active_class_attribute = 'active __animation_2';
                } else {
                    // Custom class detected, save once origin class attribute
                    if (el_anchor.dataset.classOrigin === undefined) {
                        el_anchor.dataset.classOrigin = origin_class_attribute;
                    }
                }
                // If element is visible and ranked first in intersections_sorted
                if (cScrollspy.callbacks.anchors.intersections[id_intersection] > 0 && index == 0) {
                    // Apply active class on this anchor
                    el_anchor.setAttribute('class', active_class_attribute);
                    history.replaceState({}, '', '#' + id_intersection);
                    document.title = 'BRiCSS | ' + anchors_ids_optional_titles[id_intersection];
                    if (id_intersection == 'sandboxes') {
                        dsg.elsSandboxes.forEach(function(elSandbox) {
                            if (elSandbox.src == '') {
                                elSandbox.addEventListener('load', function() {
                                    const elIncludedStyle = elSandbox.contentWindow.document.head.querySelector('#dsg__included_style');
                                    if (elIncludedStyle === null) {
                                        const includedStyleMarkup = `<link rel="stylesheet" id="dsg__included_style" href="${window.parent.dsgCssFile.url}"/>`;
                                        elSandbox.contentWindow.document.head.insertAdjacentHTML('beforeend', includedStyleMarkup);
                                    } else {
                                        elIncludedStyle.href = window.parent.dsgCssFile.url;
                                    }
                                });

                                elSandbox.src = "sandbox/index.html?" + ui.generateRandomId();
                                elSandbox.style.background = 'white';
                                elSandbox.parentElement.querySelector('.dsg__loader').remove();
                            }
                        })
                    }
                } else {
                    // Revert class on this anchor
                    el_anchor.setAttribute('class', origin_class_attribute);
                }
            });
        });
    }
}