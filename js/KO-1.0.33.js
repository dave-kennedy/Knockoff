var KO = (function () {
    'use strict';

    var model,
        eventListenersAdded = false,
        listeners = [],
        validators = [];

    function getProperty(obj, mappingParts) {
        if (mappingParts.length > 1) {
            if (obj[mappingParts[0]] === undefined) {
                return;
            }

            return getProperty(obj[mappingParts[0]], mappingParts.slice(1, mappingParts.length));
        }

        return obj[mappingParts[0]];
    }

    function setProperty(obj, mappingParts, newValue) {
        if (mappingParts.length > 1) {
            if (obj[mappingParts[0]] === undefined) {
                obj[mappingParts[0]] = {};
            }

            return setProperty(obj[mappingParts[0]], mappingParts.slice(1, mappingParts.length), newValue);
        }

        if (typeof newValue === 'string') {
            newValue = newValue.trim();
        }

        if (/^\+?\-?\d+$/.test(newValue)) {
            newValue = parseInt(newValue);
        }

        obj[mappingParts[0]] = newValue;
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

    function addGettersSetters(obj = model, prefix = '') {
        if (prefix !== '') {
            prefix = prefix + '.';
        }

        Object.keys(obj).forEach(key => {
            var currentValue = obj[key],
                mapping = prefix + key;

            // don't bind to document, window, dom elements, etc. - too much recursion
            if (currentValue instanceof EventTarget) {
                return;
            }

            Object.defineProperty(obj, key, {
                get() {
                    return currentValue;
                },
                set(newValue) {
                    var oldValue = currentValue,
                        cancelled = !document.dispatchEvent(new CustomEvent('beforeModelPropertySet', {
                            cancelable: true,
                            detail: {
                                mapping: mapping,
                                newValue: newValue,
                                oldValue: oldValue
                            }
                        }));

                    if (cancelled) {
                        return;
                    }

                    currentValue = newValue;

                    document.dispatchEvent(new CustomEvent('modelPropertySet', {
                        detail: {
                            mapping: mapping,
                            newValue: newValue,
                            oldValue: oldValue
                        }
                    }));

                    if (newValue instanceof Object) {
                        addGettersSetters(newValue, mapping);
                    }
                }
            });

            if (obj[key] instanceof Object) {
                addGettersSetters(obj[key], mapping);
            }
        });
    }

    function updateView(mapping) {
        var elements;

        if (mapping === undefined) {
            elements = document.querySelectorAll('[data-mapping]');
        } else {
            elements = document.querySelectorAll('[data-mapping^="' + mapping + '"]');
        }

        elements.forEach(el => {
            var mappingParts = el.dataset.mapping.split('.');
            setElementValue(el, getProperty(model, mappingParts));
        });
    }

    function addEventListeners() {
        if (eventListenersAdded === true) {
            return;
        }

        document.addEventListener('change', changeHandler);
        document.addEventListener('modelPropertySet', modelPropertySetHandler);

        eventListenersAdded = true;
    }

    function removeEventListeners() {
        document.removeEventListener('change', changeHandler);
        document.removeEventListener('modelPropertySet', modelPropertySetHandler);

        listeners.forEach(listener => {
            document.removeEventListener('modelPropertySet', listener);
        });

        validators.forEach(validator => {
            document.removeEventListener('beforeModelPropertySet', validator);
        });

        eventListenersAdded = false;
    }

    function changeHandler(ev) {
        var mapping = ev.target.dataset.mapping,
            mappingParts;

        if (mapping === undefined) {
            return;
        }

        mappingParts = mapping.split('.');
        setProperty(model, mappingParts, getElementValue(ev.target));
    }

    function modelPropertySetHandler(ev) {
        updateView(ev.detail.mapping);
    }

    function bind(obj) {
        model = obj;
        addGettersSetters();
        updateView();
        addEventListeners();
    }

    function unbind() {
        model = undefined;
        removeEventListeners();
    }

    function listen(mappings, callback) {
        var listener;

        if (mappings instanceof RegExp) {
            listener = function (ev) {
                var match = ev.detail.mapping.match(mappings);

                if (match !== null) {
                    callback(ev, match);
                }
            };
        } else {
            listener = function (ev) {
                if (mappings.indexOf(ev.detail.mapping) !== -1) {
                    callback(ev);
                }
            };
        }

        listeners.push(listener);
        document.addEventListener('modelPropertySet', listener);
    }

    function validate(mappings, callback) {
        var validator;

        if (mappings instanceof RegExp) {
            validator = function (ev) {
                var match = ev.detail.mapping.match(mappings);

                if (match !== null && callback(ev, match) === false) {
                    ev.preventDefault();
                    updateView(ev.detail.mapping);
                }
            };
        } else {
            validator = function (ev) {
                if (mappings.indexOf(ev.detail.mapping) !== -1 && callback(ev) === false) {
                    ev.preventDefault();
                    updateView(ev.detail.mapping);
                }
            };
        }

        validators.push(validator);
        document.addEventListener('beforeModelPropertySet', validator);
    }

    return {
        bind: bind,
        unbind: unbind,
        listen: listen,
        validate: validate
    };
}());

