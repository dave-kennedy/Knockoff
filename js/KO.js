var KO = (function () {
    // ECMAScript 5 strict mode
    'use strict';

    function Bindable(value) {
        this.boundElements = [];
    
        this.__defineGetter__('value', function () {
            return value;
        });

        this.__defineSetter__('value', function (val) {
            value = val;

            window.dispatchEvent(new CustomEvent('bindableValueSet', {
                detail: {
                    bindable: this
                }
            }));
        });
    }

    function bind(model) {
        var elements = document.getElementsByClassName('bind'),
            i,
            bindTarget,
            bindProps,
            bindable;
        
        for (i = 0; i < elements.length; i++) {
            bindTarget = elements[i].dataset.bind;

            if (bindTarget === undefined) {
                return;
            }
            
            bindProps = bindTarget.split('.');
            
            bindable = [model].concat(bindProps).reduce(function (a, b) {
                return a[b];
            });

            bindable.boundElements.push(elements[i]);
            
            elements[i].value = bindable.value;
        }
        
        window.addEventListener('bindableValueSet', function (event) {
            var i;
            
            for (i = 0; i < event.detail.bindable.boundElements.length; i++) {
                event.detail.bindable.boundElements[i].value = event.detail.bindable.value;
            }
        });
        
        window.addEventListener('change', function (event) {
            var bindTarget = event.target.dataset.bind,
                bindProps,
                bindable;
            
            if (bindTarget === undefined) {
                return;
            }
            
            bindProps = bindTarget.split('.');
            
            bindable = [model].concat(bindProps).reduce(function (a, b) {
                return a[b];
            });
            
            // TODO: Add support for data types other than string
            bindable.value = event.target.value;
        });
    }

    var Module = {};

    Module.Bindable = Bindable;
    Module.bind = bind;

    return Module;
}());
