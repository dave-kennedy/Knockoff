var KO = (function () {
    // ECMAScript 5 strict mode
    'use strict';

    function raiseEvent(name, details) {
        if (window.CustomEvent) {
            window.dispatchEvent(new CustomEvent(name, {
                details: details,
                bubbles: true,
                cancelable: true
            }));
        }
    }

    function Bindable(value) {
        this.__defineGetter__('value', function () {
            return value;
        });

        this.__defineSetter__('value', function (val) {
            value = val;

            this.raiseEvent();
        });
    }

    Bindable.prototype.raiseEvent = function () {
        raiseEvent('bindableSetterCalled');
    }

    function bind($) {
        if (!$) {
            console.error('Missing crappy dependency on jQuery. Aborting...');
            return false;
        }

        $('.bind').each(function () {
            var self = $(this),
                props = $(this).data('bind').split('.'),
                bindable;

            bindable = [model].concat(props).reduce(function (a, b) {
                return a[b];
            });

            $(this).val(bindable.value);

            window.addEventListener('bindableSetterCalled', function () {
                self.val(bindable.value);
            });
        }).change(function () {
            var props = $(this).data('bind').split('-'),
                bindable;

            bindable = [model].concat(props).reduce(function (a, b) {
                return a[b];
            });

            bindable.value = $(this).val();
        });

        return true;
    }

    var Module = {};

    Module.Bindable = Bindable;
    Module.bind = bind;

    return Module;
}());
