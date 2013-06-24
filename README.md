Knockoff is a JavaScript model binding library. The name is stolen from [Knockout](http://knockoutjs.com), a much better library that you should probably use instead, at least until I get the kinks worked out.

The thing that's cool about Knockoff is you can wire up your view model with one function call, and you don't have to clutter your view model with weird proprietary types:

    var model = {
        name: 'Dave',
        level: 10
    };
    
    KO.bind(model);

Your markup would then look something like this:

    <p>
        Name: <input class="bind" data-mapping="name" type="text">
    </p>
    <p>
        Level: <input class="bind" data-mapping="level" type="text">
    </p>

You can have lots of elements that are bound to a single property of your view model. Just make sure you add the `bind` class to each of them, and specify the property to bind to in the `data-mapping` attribute:

    <p>
        Enter your name: <input class="bind" data-mapping="name" type="text">
    </p>
    <p>
        Hi, <span class="bind" data-mapping="name"></span>!
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
        <span class="bind" data-mapping="name"></span>'s Skills
    </h3>
    <p>
        Programming (Day): <input class="bind" data-mapping="skills.programming.day" type="text">
    </p>
    <p>
        Programming (Night): <input class="bind" data-mapping="skills.programming.night" type="text">
    </p>

Of course, you can use constructors in your view model as well:

    function Person(name, level, race) {
        this.name = name;
        this.level = level;
        this.race = race;
    }
    
    var model = new Person('Dave', 10, 'Vulcan');
    
    KO.bind(model);

If you want a property that is computed from another property, use the `KO.compute` function:

    var model = {
        name: 'Dave',
        level: 10,
        strength: 0
    };
    
    KO.bind(model);
    
    KO.compute(function () {
        model.strength = model.level / 2;
    }, 'level');

The first argument to `KO.compute` should be a callback function, while the second should be the name of a property to listen for changes on. In the example above, whenever the `level` property changes the callback will be executed and the `strength` property will be updated.

Finally, you can tell `KO.compute` to listen on any number of properties like so:

    KO.compute(function () {
        model.strength = (model.level / 2) + model.beardLength;
    }, 'level', 'beardLength');

This way, any time `level` or `beardLength` changes the callback will be executed and `strength` will be updated.
