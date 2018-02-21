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

            Object.defineProperty(obj, key, {
                get() {
                    return currentValue;
                },
                set(newValue) {
                    var oldValue = currentValue,
                        cancelled = !window.dispatchEvent(new CustomEvent('beforeModelPropertySet', {
                            cancelable: true,
                            detail: {
                                mapping: prefix + key,
                                newValue: newValue,
                                oldValue: oldValue
                            }
                        }));

                    if (cancelled) {
                        return;
                    }

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
            });

            if (obj[key] instanceof Object) {
                addGettersSetters(obj[key], prefix + key);
            }
        });
    }

    function updateView(prefix) {
        var elements,
            i,
            props;

        if (prefix === undefined) {
            elements = document.querySelectorAll('[data-mapping]');
        } else {
            elements = document.querySelectorAll('[data-mapping^="' + prefix + '"]');
        }

        for (i = 0; i < elements.length; i++) {
            props = elements[i].dataset.mapping.split('.');

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
        if (mappings instanceof RegExp) {
            window.addEventListener('beforeModelPropertySet', function (event) {
                var match = event.detail.mapping.match(mappings),
                    props;

                if (match !== null && !callback(event, match)) {
                    event.preventDefault();
                }
            });

            return;
        }

        window.addEventListener('beforeModelPropertySet', function (event) {
            var props;

            if (mappings.indexOf(event.detail.mapping) !== -1 && !callback(event)) {
                event.preventDefault();
            }
        });
    };

    return module;
}());

