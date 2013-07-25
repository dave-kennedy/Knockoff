/*!
 * Knockoff v1.0.12
 * A JavaScript model binding library
 * http://github.com/davidkennedy85/Knockoff
 */

var KO = (function () {
    // ECMAScript 5 strict mode
    'use strict';

    var eventListenersAdded = false,
        module = {};

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

            function modelPropertyGetter() {
                return value;
            }

            function modelPropertyGetterOverride() {
                return descriptor.get();
            }

            function modelPropertySetter(val) {
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

            function modelPropertySetterOverride(val) {
                descriptor.set(val);

                modelPropertySetter(val);
            }

            Object.defineProperty(model, key, {
                get: (function () {
                    if (descriptor.get === undefined) {
                        return modelPropertyGetter;
                    } else if (descriptor.get.name !== 'modelPropertyGetter' && descriptor.get.name !== 'modelPropertyGetterOverride') {
                        return modelPropertyGetterOverride;
                    }

                    return descriptor.get;
                }()),
                set: (function () {
                    if (descriptor.set === undefined) {
                        return modelPropertySetter;
                    } else if (descriptor.set.name !== 'modelPropertySetter' && descriptor.set.name !== 'modelPropertySetterOverride') {
                        return modelPropertySetterOverride;
                    }

                    return descriptor.set;
                }())
            });

            if (model[key] instanceof Object) {
                addGettersSetters(model[key], prefix + key);
            }
        });
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

    function addEventListeners(model) {
        if (eventListenersAdded === true) {
            return;
        }

        window.addEventListener('change', function (event) {
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
        });

        window.addEventListener('modelPropertySet', function (event) {
            updateView(model, event.detail.mapping);
        });

        eventListenersAdded = true;
    }

    module.bind = function (model) {
        addGettersSetters(model);

        updateView(model);

        addEventListeners(model);
    };

    module.listen = function (callback) {
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
    };

    return module;
}());