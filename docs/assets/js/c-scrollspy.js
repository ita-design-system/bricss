/**
* C-SCROLLSPY
* v0.1.0
* JS library dedicated to DOM element position in relation with the viewport
* https://github.com/ita-design-system/c-scrollspy.js
*/

/**
* C-SCROLLSPY CUSTOM CALLBACKS
* NO NEED TO EDIT THIS PART, just write your own
* cScrollspyCallbacks.myOwnCallbackName = { ... }
*/
let cScrollspyCallbacks = {}

const cScrollspy = {
    callbacks: {
        /**
        * ANCHORS
        * Options for anchors links -> HTML ids
        */
        anchors: {
            options: {
                threshold: [0, 0.2, 0.8, 1]
            },
            /**
            * CALLBACK
            * CALLBACK METHOD
            * @arg {(object)} data event data returned by intersectonObserver
            * https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver
            */
            callback: function(data) {
                // Id of the tracked element
                const id = data[0].target.id;
                // Write intersection ratio into an custom object
                cScrollspy.callbacks.anchors.intersections[id] = data[0].intersectionRatio;
                // Get current id => intersection values
                const current_intersections = cScrollspy.callbacks.anchors.intersections;
                // Sort intersection values
                const intersections_sorted = Object.keys(current_intersections).sort(function(a,b){return current_intersections[b]-current_intersections[a]});
                // For each sorted intersection, check every link pointing to this element id
                intersections_sorted.forEach(function(id_intersection, index) {
                    document.querySelectorAll('[href="#'+id_intersection+'"]').forEach(function(el_anchor) {
                        // Optional active classes
                        const el_source = cScrollspy.instances[id_intersection].el;
                        let active_class_attribute = el_source.dataset.activeClass;
                        let origin_class_attribute = el_anchor.dataset.classOrigin || '';
                        // If no active class is set, apply 'active' as default
                        if (active_class_attribute === undefined) {
                            active_class_attribute = 'active';
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
                        } else {
                            // Revert class on this anchor
                            el_anchor.setAttribute('class', origin_class_attribute);
                        }
                    });
                });
            },
            // To be populated by keys: ids of tracked elements associated to their intersections ratio values
            intersections: {},
        }
    },
    // All instances of intersections
    instances: {},
    // Method to invoke at start and each time DOM has changed
    update: function() {
        // Iterate all the scrollspy attributes
        document.querySelectorAll('[c-scrollspy]').forEach(function(el, index) {
            // Value = custom option name for the current tracked element
            const callback_name = el.getAttribute('c-scrollspy');
            let callback_object = cScrollspy.callbacks.anchors;
            if (typeof cScrollspyCallbacks[callback_name] == 'object') {
                callback_object = cScrollspyCallbacks[callback_name];
            }
            // Set default instance id
            let instance_id = 'cspy_'+index;
            // If tracked element has an id, use it
            if (el.id != '') {
                instance_id = el.id;
            }
            // Create intersection observer as an object into myScrollspy
            if (cScrollspy.instances[instance_id] === undefined) {
                cScrollspy.instances[instance_id] = {
                    el: el
                }
            }
            cScrollspy.instances[instance_id].io = new IntersectionObserver(callback_object.callback, callback_object.options || cScrollspy.callbacks.anchors.options);
            // Track element
            cScrollspy.instances[instance_id].io.observe(el);
        });
    }
}
if (document.readyState !== 'loading') {
    cScrollspy.update()
} else {
    document.addEventListener('DOMContentLoaded', cScrollspy.update);
}