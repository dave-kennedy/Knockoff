Knockoff is a JavaScript model binding library. The name is stolen from [Knockout](http://knockoutjs.com), which is hardly similar but probably has less bugs.

The thing that's cool about Knockoff is you can wire up your view model with one function call, and you don't have to clutter your view model with weird proprietary types:

    var model = {
        name: 'Dave',
        level: 10
    };
    
    KO.bind(model);

Your markup would then look something like this:

    <p>
        Name: <input data-mapping="name" type="text">
    </p>
    <p>
        Level: <input data-mapping="level" type="text">
    </p>

When you change the value of an element that's bound to a property of your view model, that property will be updated accordingly. This is true the other way around too - when you change the value of a property that's bound to an element in your view, that element will be updated as well.

You can have lots of elements that are bound to a single property of your view model. Just make sure you specify the property to bind to in the `data-mapping` attribute:

    <p>
        Enter your name: <input data-mapping="name" type="text">
    </p>
    <p>
        Hi, <span data-mapping="name"></span>!
    </p>

Knockoff plays nice with complex view models like this:

    var model = {
        name: 'Dave',
        skills: {
            programming: {
                day: 10,
                night: 100
            }
        }
    };
    
    KO.bind(model);

Your markup in this case could be:

    <h3>
        <span data-mapping="name"></span>'s Skills
    </h3>
    <p>
        Programming (Day): <input data-mapping="skills.programming.day" type="text">
    </p>
    <p>
        Programming (Night): <input data-mapping="skills.programming.night" type="text">
    </p>

Of course, you can use constructors in your view model as well:

    function Person(name, level, race) {
        this.name = name;
        this.level = level;
        this.race = race;
    }
    
    var model = new Person('Dave', 10, 'Vulcan');
    
    KO.bind(model);

If you want a property that is computed from another property, use the `KO.listen` function:

    var model = {
        name: 'Dave',
        level: 10,
        strength: 5
    };
    
    KO.bind(model);
    
    KO.listen(function () {
        model.strength = model.level / 2;
    }, 'level');

The first argument to `KO.listen` should be a callback function, while the second should be the name of a property to listen for changes on. In the example above, whenever the `level` property changes the callback will be executed and the `strength` property will be updated.

You can tell `KO.listen` to listen on any number of properties like so:

    KO.listen(function () {
        model.strength = (model.level / 2) + model.beardLength;
    }, 'level', 'beardLength');

This way, any time `level` or `beardLength` changes the callback will be executed and `strength` will be updated.

Finally, if you view model and/or view changes drastically (as in adding properties to your view model or adding elements to your view), you can just call `KO.bind` again without breaking any functionality:

    var model = {
        name: 'Dave'
    };
    
    KO.bind(model);
    
    model.level = 10;
    
    document.getElementById('whatever').innerHTML = '<input data-mapping="level" type="text">';
    
    KO.bind(model);

###Defining your own getters and setters

Knockoff relies on ECMAScript 5's Object.defineProperty to define getters and setters on the properties of your view model. If you also use Object.defineProperty to define getters and setters on properties, make sure you call `KO.bind` _last_ (after defining your own getters and setters). This is because the getters and setters defined by Knockoff will call any existing getters and setters instead of overwriting them. For example, this works:

    var model = {
        name: 'Dave'
    };
    
    var name = model.name;
    
    Object.defineProperty(model, 'name', {
        get: function () {
            return name;
        },
        set: function (val) {
            console.log('model.name setter called'); 
            name = val;
        }
    });
    
    KO.bind(model);

But this will totally break the model binding:

    var model = {
        name: 'Dave'
    };
    
    var name = model.name;
    
    KO.bind(model);
    
    Object.defineProperty(model, 'name', {
        get: function () {
            return name;
        },
        set: function (val) {
            console.log('model.name setter called'); 
            name = val;
        }
    });

You can always use `KO.listen` instead of defining your own setter. There isn't any similar workaround for defining your own getter at the moment. So if you absolutely have to, just call `KO.bind` last.