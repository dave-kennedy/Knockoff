/*!
 * Knockoff v1.0.9
 * A JavaScript model binding library
 * http://github.com/davidkennedy85/Knockoff
 */

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

    function setElementValue(el, val) {
        switch (el.type) {
            case 'text':
            case 'select-one':
                el.value = val;
                break;
            case 'checkbox':
                el.checked = val;
                break;
            case undefined:
                el.innerHTML = val;
                break;
        }
    }

    function addGettersSetters(model, prefix) {
        if (prefix === undefined) {
            prefix = '';
        } else {
            prefix = prefix + '.';
        }

        Object.keys(model).forEach(function (key) {
            var descriptor = Object.getOwnPropertyDescriptor(model, key),
                value = model[key];

            Object.defineProperty(model, key, {
                get: function () {
                    //if (descriptor.get) {
                    //    return descriptor.get();
                    //}

                    return value;
                },
                set: function (val) {
                    //if (descriptor.set) {
                    //    descriptor.set(val);
                    //}

                    value = val;

                    window.dispatchEvent(new CustomEvent('modelPropertySet', {
                        detail: {
                            mapping: prefix + key
                        }
                    }));

                    if (val instanceof Object) {
                        addGettersSetters(val, prefix + key);
                    }
                }
            });

            if (model[key] instanceof Object) {
                addGettersSetters(model[key], prefix + key);
            }
        });
    }

    function changeListener(event) {
        var mapping = event.target.dataset.mapping,
            newValue,
            oldValue,
            props;

        if (mapping === undefined) {
            return;
        }

        props = mapping.split('.');

        oldValue = getProperty(model, props);

        if (typeof oldValue === 'boolean') {
            newValue = event.target.checked;
        } else if (typeof oldValue === 'number') {
            newValue = parseInt(event.target.value);
        } else {
            newValue = event.target.value;
        }

        setProperty(model, props, newValue);
    }

    function modelPropertySetListener(event) {
        updateView(model, event.detail.mapping);
    }

    function addEventListeners(model) {
        window.addEventListener('change', changeListener);
        window.addEventListener('modelPropertySet', modelPropertySetListener);
    }

    function updateView(model, prefix) {
        var elements,
            i,
            mapping,
            props;

        if (prefix === undefined) {
            elements = document.querySelectorAll('[data-mapping]');
        } else {
            elements = document.querySelectorAll('[data-mapping^="' + prefix + '"]');
        }

        for (i = 0; i < elements.length; i++) {
            mapping = elements[i].dataset.mapping;

            props = mapping.split('.');

            setElementValue(elements[i], getProperty(model, props));
        }
    }

    function bind(model) {
        addGettersSetters(model);

        addEventListeners(model);

        updateView(model);
    }

    function listen(callback) {
        var mappings = [],
            i;

        for (i = 1; i < arguments.length; i++) {
            mappings.push(arguments[i]);
        }

        window.addEventListener('modelPropertySet', function (event) {
            if (mappings.indexOf(event.detail.mapping) !== -1) {
                callback();
            }
        });
    }

    var Module = {};

    Module.bind = bind;
    Module.listen = listen;

    return Module;
}());