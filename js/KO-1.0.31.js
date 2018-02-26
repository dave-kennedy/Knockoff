var KO = (function () {
    'use strict';

    var eventListenersAdded = false,
        model;

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

        document.addEventListener('change', ev => {
            var mapping = ev.target.dataset.mapping,
                mappingParts;

            if (mapping === undefined) {
                return;
            }

            mappingParts = mapping.split('.');
            setProperty(model, mappingParts, getElementValue(ev.target));
        });

        document.addEventListener('modelPropertySet', ev => {
            updateView(ev.detail.mapping);
        });

        eventListenersAdded = true;
    }

    function bind(obj) {
        model = obj;
        addGettersSetters();
        updateView();
        addEventListeners();
    }

    function listen(mappings, callback) {
        if (mappings instanceof RegExp) {
            document.addEventListener('modelPropertySet', ev => {
                var match = ev.detail.mapping.match(mappings);

                if (match !== null) {
                    callback(ev, match);
                }
            });

            return;
        }

        document.addEventListener('modelPropertySet', ev => {
            if (mappings.indexOf(ev.detail.mapping) !== -1) {
                callback(ev);
            }
        });
    }

    function validate(mappings, callback) {
        if (mappings instanceof RegExp) {
            document.addEventListener('beforeModelPropertySet', ev => {
                var match = ev.detail.mapping.match(mappings);

                if (match !== null && callback(ev, match) === false) {
                    ev.preventDefault();
                    updateView(ev.detail.mapping);
                }
            });

            return;
        }

        document.addEventListener('beforeModelPropertySet', ev => {
            if (mappings.indexOf(ev.detail.mapping) !== -1 && callback(ev) === false) {
                ev.preventDefault();
                updateView(ev.detail.mapping);
            }
        });
    }

    return {
        bind: bind,
        listen: listen,
        validate: validate
    };
}());

