var KO = (function () {
    // ECMAScript 5 strict mode
    'use strict';

    var eventListenersAdded = false,
        module = {};

    function getProperty(obj, props) {
        if (props.length > 1) {
            if (obj[props[0]] === undefined) {
                return;
            }

            return getProperty(obj[props[0]], props.slice(1, props.length));
        }

        return obj[props[0]];
    }

    function setProperty(obj, props, newValue) {
        if (props.length > 1) {
            if (obj[props[0]] === undefined) {
                obj[props[0]] = {};
            }

            return setProperty(obj[props[0]], props.slice(1, props.length), newValue);
        }

        if (typeof newValue === 'string') {
            newValue = newValue.trim();
        }

        if (/^\+?\-?\d+$/.test(newValue)) {
            obj[props[0]] = parseInt(newValue);

            return;
        }

        obj[props[0]] = newValue;
    }

    function getElementValue(el) {
        switch (el.type) {
            case 'text':
            case 'textarea':
            case 'select-one':
                return el.value;
            case 'checkbox':
                return el.checked;
            default:
                return el.innerHTML;
        }
    }

    function setElementValue(el, newValue) {
        switch (el.type) {
            case 'text':
            case 'textarea':
            case 'select-one':
                el.value = newValue === undefined ? '' : newValue;
                break;
            case 'checkbox':
                el.checked = newValue === undefined ? false : newValue;
                break;
            default:
                el.innerHTML = newValue === undefined ? '' : newValue;
        }
    }

    function addGettersSetters(obj, prefix) {
        if (obj === undefined) {
            obj = module.model;
        }

        if (prefix === undefined) {
            prefix = '';
        } else {
            prefix = prefix + '.';
        }

        Object.keys(obj).forEach(function (key) {
            var currentValue = obj[key];

            function modelPropertyGetter() {
                return currentValue;
            }

            function modelPropertySetter(newValue) {
                var oldValue = currentValue;

                currentValue = newValue;

                window.dispatchEvent(new CustomEvent('modelPropertySet', {
                    detail: {
                        mapping: prefix + key,
                        newValue: newValue,
                        oldValue: oldValue
                    }
                }));

                if (newValue instanceof Object) {
                    addGettersSetters(newValue, prefix + key);
                }
            }

            defineGetter(obj, key, modelPropertyGetter);

            defineSetter(obj, key, modelPropertySetter);

            if (obj[key] instanceof Object) {
                addGettersSetters(obj[key], prefix + key);
            }
        });
    }

    function defineGetter(obj, key, getter) {
        var descriptor = Object.getOwnPropertyDescriptor(obj, key);

        Object.defineProperty(obj, key, {
            get: (function () {
                if (descriptor.get === undefined) {
                    return getter;
                }

                return descriptor.get;
            }())
        });
    }

    function defineSetter(obj, key, setter) {
        var descriptor = Object.getOwnPropertyDescriptor(obj, key);

        function modelPropertySetterOverride(newValue) {
            descriptor.set(newValue);

            setter(newValue);
        }

        function modelPropertyValidatorOverride(newValue) {
            if (setter(newValue) === false) {
                updateView();

                return;
            }

            descriptor.set(newValue);
        }

        Object.defineProperty(obj, key, {
            set: (function () {
                if (descriptor.set === undefined) {
                    return setter;
                }

                if (setter.name === 'modelPropertySetter'
                    && descriptor.set.name !== 'modelPropertySetter'
                    && descriptor.set.name !== 'modelPropertySetterOverride'
                    && descriptor.set.name !== 'modelPropertyValidatorOverride') {
                    return modelPropertySetterOverride;
                }

                if (setter.name === 'modelPropertyValidator'
                    && (descriptor.set.name === 'modelPropertySetter'
                        || descriptor.set.name === 'modelPropertySetterOverride')) {
                    return modelPropertyValidatorOverride;
                }

                return descriptor.set;
            }())
        });
    }

    function updateView(prefix) {
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

            setElementValue(elements[i], getProperty(module.model, props));
        }
    }

    function addEventListeners() {
        if (eventListenersAdded === true) {
            return;
        }

        window.addEventListener('change', function (event) {
            var mapping = event.target.dataset.mapping,
                props;

            if (mapping === undefined) {
                return;
            }

            props = mapping.split('.');

            setProperty(module.model, props, getElementValue(event.target));
        });

        window.addEventListener('modelPropertySet', function (event) {
            updateView(event.detail.mapping);
        });

        eventListenersAdded = true;
    }

    module.bind = function (model) {
        module.model = model;

        addGettersSetters();

        updateView();

        addEventListeners();
    };

    module.listen = function (mappings, callback) {
        if (mappings instanceof RegExp) {
            window.addEventListener('modelPropertySet', function (event) {
                var match = event.detail.mapping.match(mappings);

                if (match !== null) {
                    callback(event, match);
                }
            });

            return;
        }

        window.addEventListener('modelPropertySet', function (event) {
            if (mappings.indexOf(event.detail.mapping) !== -1) {
                callback(event);
            }
        });
    };

    module.validate = function (mappings, callback) {
        var props = mappings.split('.');

        function modelPropertyValidator(newValue) {
            return callback(newValue);
        }

        if (props.length === 1) {
            defineSetter(module.model, mappings, modelPropertyValidator);
        } else {
            defineSetter(getProperty(module.model, props.slice(0, props.length - 1)), props.slice(props.length), modelPropertyValidator);
        }
    };

    return module;
}());
