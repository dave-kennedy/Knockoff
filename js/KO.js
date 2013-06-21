var KO = (function () {
    // ECMAScript 5 strict mode
    'use strict';

    function getProperty(obj, props) {
        if (obj[props[0]] instanceof Object) {
            return getProperty(obj[props[0]], props.slice(1, props.length));
        }

        return obj[props[0]];
    }

    function setProperty(obj, props, val) {
        if (obj[props[0]] instanceof Object) {
            setProperty(obj[props[0]], props.slice(1, props.length), val);
            return;
        }

        obj[props[0]] = val;
    }

    function createPointer(model, mapping) {
        return function (val) {
            if (arguments.length > 0) {
                setProperty(model, mapping.split('.'), val);
                return val;
            }

            return getProperty(model, mapping.split('.'));
        };
    }

    function setElementValue(el, val) {
        if (el.value === undefined) {
            el.innerHTML = val;
            return;
        }

        el.value = val;
    }

    function addModelEvents(model, mapping) {
        if (mapping === undefined) {
            mapping = '';
        } else {
            mapping = mapping + '.';
        }

        Object.keys(model).forEach(function (key) {
            if (model[key] instanceof Object) {
                addModelEvents(model[key], mapping + key);
                return;
            }

            var value = model[key];

            Object.defineProperty(model, key, {
                get: function () {
                    return value;
                },
                set: function (val) {
                    value = val;

                    window.dispatchEvent(new CustomEvent('modelPropertySet', {
                        detail: {
                            mapping: mapping + key,
                            value: val
                        }
                    }));
                }
            });
        });
    }

    function createMappings(model) {
        var elements = document.getElementsByClassName('bind'),
            mappings = {},
            mapping,
            i;

        for (i = 0; i < elements.length; i++) {
            mapping = elements[i].dataset.mapping;

            if (mapping === undefined) {
                break;
            }

            if (mappings[mapping] === undefined) {
                mappings[mapping] = {
                    pointer: createPointer(model, mapping),
                    elements: [elements[i]]
                };
            } else {
                mappings[mapping].elements.push(elements[i]);
            }
        }

        return mappings;
    }

    function addEventListeners(mappings) {
        window.addEventListener('change', function (event) {
            var mapping = event.target.dataset.mapping,
                newValue = event.target.value,
                oldValue;

            if (mapping === undefined) {
                return;
            }

            oldValue = mappings[mapping].pointer();

            if (typeof oldValue === 'number') {
                newValue = parseInt(newValue);

                if (isNaN(newValue)) {
                    event.target.value = oldValue;
                    return;
                }
            }

            mappings[mapping].pointer(newValue);
        });

        window.addEventListener('modelPropertySet', function (event) {
            var elements = mappings[event.detail.mapping].elements,
                i;

            for (i = 0; i < elements.length; i++) {
                setElementValue(elements[i], event.detail.value);
            }
        });
    }

    function updateView(mappings) {
        Object.keys(mappings).forEach(function (key) {
            var elements = mappings[key].elements,
                i;

            for (i = 0; i < elements.length; i++) {
                setElementValue(elements[i], mappings[key].pointer());
            }
        });
    }

    function bind(model) {
        addModelEvents(model);

        var mappings = createMappings(model);

        addEventListeners(mappings);

        updateView(mappings);
    }

    var Module = {};

    Module.bind = bind;

    return Module;
}());