var KO = (function () {
    // ECMAScript 5 strict mode
    'use strict';

    var eventListenersAdded = false,
        model;

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
            newValue = parseInt(newValue);
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
            obj = model;
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
                        cancelled = !document.dispatchEvent(new CustomEvent('beforeModelPropertySet', {
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

                    document.dispatchEvent(new CustomEvent('modelPropertySet', {
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
            setElementValue(elements[i], getProperty(model, props));
        }
    }

    function addEventListeners() {
        if (eventListenersAdded === true) {
            return;
        }

        document.addEventListener('change', function (event) {
            var mapping = event.target.dataset.mapping,
                props;

            if (mapping === undefined) {
                return;
            }

            props = mapping.split('.');
            setProperty(model, props, getElementValue(event.target));
        });

        document.addEventListener('modelPropertySet', function (event) {
            updateView(event.detail.mapping);
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
            document.addEventListener('modelPropertySet', function (event) {
                var match = event.detail.mapping.match(mappings);

                if (match !== null) {
                    callback(event, match);
                }
            });

            return;
        }

        document.addEventListener('modelPropertySet', function (event) {
            if (mappings.indexOf(event.detail.mapping) !== -1) {
                callback(event);
            }
        });
    }

    function validate(mappings, callback) {
        if (mappings instanceof RegExp) {
            document.addEventListener('beforeModelPropertySet', function (event) {
                var match = event.detail.mapping.match(mappings),
                    props;

                if (match !== null && !callback(event, match)) {
                    event.preventDefault();
                    updateView(event.detail.mapping);
                }
            });

            return;
        }

        document.addEventListener('beforeModelPropertySet', function (event) {
            var props;

            if (mappings.indexOf(event.detail.mapping) !== -1 && !callback(event)) {
                event.preventDefault();
                updateView(event.detail.mapping);
            }
        });
    }

    return {
        bind: bind,
        listen: listen,
        validate: validate
    };
}());

