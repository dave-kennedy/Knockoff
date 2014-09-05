Knockoff is a JavaScript model binding library. The name is stolen from [Knockout](http://knockoutjs.com), which is hardly similar but I couldn't think of anything better.

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

When you change the value of an element that's bound to a property of your view model, that property will be updated accordingly. This is true the other way around too - when you change the value of a property that's bound to an element in your view, that element will be updated too.

You don't have to use object initializers to create your view model. This works just as well:

    function Person(name, level) {
        this.name = name;
        this.level = level;
    }
    
    var model = new Person('Dave', 10);
    
    KO.bind(model);

You can bind several elements to a single property of your view model. Just specify the property to bind to in each element's `data-mapping` attribute:

    <h2>
        Character Sheet for <span data-mapping="name"></span>
    </h2>
    <p>
        Name: <input data-mapping="name" type="text">
    </p>

Knockoff will work with any type of element in your view, including inputs, selects and textboxes:

    var model = {
        // ...
        undead: true,
        race: 'Human',
        description: 'As a young boy, Dave created lego masterpieces and wrestled alligators. This is why he only has one arm...'
    };

The markup for this part of the model might be:

    <p>
        <input data-mapping="undead" type="checkbox"> Undead
    </p>
    <p>
        Race:
        <select data-mapping="race">
            <option value="">Select one...</option>
            <option value="Human">Human</option>
            <option value="Klingon">Klingon</option>
            <option value="Vulcan">Vulcan</option>
        </select>
    </p>
    <p>
        Description:<br>
        <textarea data-mapping="description"></textarea>
    </p>

Knockoff plays nice with complex view models containing arrays and nested objects:

    var model = {
        // ...
        skills: {
            programming: { day: 10, night: 20 },
            underwaterBasketWeaving: { day: 1, night: 2 }
        },
        powers: [
            { name: 'Flurry of Keystrokes', description: 'You can type up to 80 word per minute.' },
            { name: 'Telekenesis', description: 'You can move a pebble-sized object with your brain once per day.' }
        ]
    };

Here's some possible markup for this part of the model:

    <h2>Skills</h2>
    <table>
        <tr>
            <th>Skill</th>
            <th>Day</th>
            <th>Night</th>
        </tr>
        <tr>
            <td>Programming</td>
            <td><input data-mapping="skills.programming.day" type="text"></td>
            <td><input data-mapping="skills.programming.night" type="text"></td>
        </tr>
        <tr>
            <td>Underwater Basket Weaving</td>
            <td><input data-mapping="skills.underwaterBasketWeaving.day" type="text"></td>
            <td><input data-mapping="skills.underwaterBasketWeaving.night" type="text"></td>
        </tr>
    </table>
    
    <h2>Powers</h2>
    <table>
        <tr>
            <th>Power</th>
            <th>Description</th>
        </tr>
        <tr>
            <td><input data-mapping="powers.0.name"></td>
            <td><input data-mapping="powers.0.description"></td>
        </tr>
        <tr>
            <td><input data-mapping="powers.1.name"></td>
            <td><input data-mapping="powers.1.description"></td>
        </tr>
    </table>

If your view model and/or view changes drastically (as in adding properties to your view model or adding elements to your view), you can just call `KO.bind` again without breaking any functionality:

    model.attributes = {
        strength: 4,
        wisdom: 6,
        charisma: 20
    };
    
    document.getElementById('attributes').insertRow().innerHTML = '<tr><td>Strength</td><td><input data-mapping="attributes.strength"></td></tr>';
    document.getElementById('attributes').insertRow().innerHTML = '<tr><td>Wisdom</td><td><input data-mapping="attributes.wisdom"></td></tr>';
    document.getElementById('attributes').insertRow().innerHTML = '<tr><td>Charisma</td><td><input data-mapping="attributes.charisma"></td></tr>';
    
    KO.bind(model);

###Computed properties

If you want a property that is computed from another property, use the `KO.listen` function:

    KO.listen('name', function () {
        alert('Hi, ' + model.name + '!');
    });

The first argument to `KO.listen` is the name of a property to listen for changes on and the second argument is a callback function. In the example above, whenever the `name` property changes the callback will be executed and the user will be alerted.

You can tell `KO.listen` to listen on any number of properties like so:

    KO.listen(['level', 'undead'], function () {
        model.attributes.strength = model.level / 2;
        
        if (model.undead) {
            model.attributes.strength--;
        }
    });

This way, any time `level` or `undead` changes the callback will be executed and `strength` will be updated.

The callback function receives an event as the argument, the details of which contain the name of the property that changed, the new value and the old value:

    KO.listen('race', function (event) {
        alert(event.detail.mapping + ' was ' + event.detail.oldValue + ' but now is ' + event.detail.newValue);
    });

You can also tell `KO.listen` to listen for changes on any property that matches a regular expression. In this case, the callback function also receives an array containing the matched results as the second argument.

    KO.listen(/skills\.(.*)\.day/, function (event, match) {
        var skill = match[1];
        
        model.skills[skill].night = model.skills[skill].day * 2;
    });

###Validation

Use the `KO.validate` function to add validation rules to properties:

    KO.validate('level', function (value) {
        return value !== '' && !isNaN(value);
    });

The first argument to `KO.validate` is the name of a property to validate and the second argument is a callback function. The callback should return true if the value passes validation and false otherwise. This rule forces `level` to be numeric.

You can add the same validation rule to several properties like this:

    KO.validate(['attributes.strength', 'attributes.wisdom', 'attributes.charisma'], function (value) {
        return value >= 0 && value <= 100;
    });

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

So don't do it.