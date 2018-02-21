Knockoff is a JavaScript model binding library. The name is stolen from [Knockout](http://knockoutjs.com), which is hardly similar but I couldn't think of anything better.

The thing that's cool about Knockoff is you can wire up your view model with one function call, and you don't have to clutter your view model with weird proprietary types:

```JavaScript
var model = {
    name: 'Dave',
    level: 10
};

KO.bind(model);
```

Your markup would then look something like this:

```HTML
<p>
    Name: <input data-mapping="name" type="text">
</p>
<p>
    Level: <input data-mapping="level" type="text">
</p>
```

When you change the value of an element that's bound to a property of your view model, that property will be updated accordingly. This is true the other way around too - when you change the value of a property that's bound to an element in your view, that element will be updated also.

You don't have to use object initializers to create your view model. This works just as well:

```JavaScript
function Person(name, level) {
    this.name = name;
    this.level = level;
}

var model = new Person('Dave', 10);

KO.bind(model);
```

You can bind several elements to a single property of your view model. Just specify the property to bind to in each element's `data-mapping` attribute:

```HTML
<h2>
    Character Sheet for <span data-mapping="name"></span>
</h2>
<p>
    Name: <input data-mapping="name" type="text">
</p>
```

Knockoff will work with any type of element in your view, including inputs, selects and textboxes:

```JavaScript
var model = {
    // ...
    undead: true,
    race: 'Human',
    description: 'As a young boy, Dave created lego masterpieces and wrestled alligators. This is why he only has one arm...'
};
```

The markup for this part of the model might be:

```HTML
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
```

Knockoff plays nice with complex view models containing arrays and nested objects:

```JavaScript
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
```

Here's some possible markup for this part of the model:

```HTML
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
```

If your view model and/or view changes drastically (as in adding properties to your view model or adding elements to your view), you can just call `KO.bind` again without breaking any functionality:

```JavaScript
model.attributes = {
    strength: 4,
    wisdom: 6,
    charisma: 20
};

document.getElementById('attributes').insertRow().innerHTML = '<tr><td>Strength</td><td><input data-mapping="attributes.strength"></td></tr>';
document.getElementById('attributes').insertRow().innerHTML = '<tr><td>Wisdom</td><td><input data-mapping="attributes.wisdom"></td></tr>';
document.getElementById('attributes').insertRow().innerHTML = '<tr><td>Charisma</td><td><input data-mapping="attributes.charisma"></td></tr>';

KO.bind(model);
```

### Computed properties

If you want a property that is computed from another property, use the `KO.listen` function. The first argument is the name of a property to listen for changes on and the second argument is a callback function:

```JavaScript
KO.listen('level', function (event) {
    model.attributes.strength = model.level / 2;
});
```

The callback function receives an event as the argument, the details of which contain the name of the property that changed, the new value and the old value.

You can tell `KO.listen` to listen for changes on multiple properties like so:

```JavaScript
KO.listen(['attributes.strength', 'attributes.wisdom', 'attributes.charisma'], function (event) {
    model.totalAttributes = model.attributes.strength + model.attributes.wisdom + model.attributes.charisma;
});
```

You can also tell `KO.listen` to listen for changes on any property that matches a regular expression. In this case, the callback function also receives an array containing the matched results as the second argument.

```JavaScript
KO.listen(/skills\.(.*)\.day/, function (event, match) {
    var skill = match[1];

    model.skills[skill].night = event.detail.newValue * 2;
});
```

### Validation

Use the `KO.validate` function to add validation rules to properties:

```JavaScript
KO.validate('level', function (event) {
    return event.detail.newValue > 0;
});
```

The first argument to `KO.validate` is the name of a property to validate and the second argument is a callback function. The callback should return true if it passes validation and false otherwise. This rule forces `level` to be a positive integer.

You can add the same validator to multiple properties by passing an array of property names as the first argument. Regular expressions work here as well.

### Getters and setters

Knockoff relies on ECMAScript 5's `Object.defineProperty` to define getters and setters on the properties of your view model, so you should not override them. If you need a hook into a property's setter, consider using `KO.listen` or `KO.validate` instead.

### Too much recursion

Be careful to avoid listening for changes on a property and setting it in the same call stack. For example, don't do this:

```JavaScript
KO.listen('name', function (event) {
    name = name + ', formerly known as ' + event.detail.oldValue;
});
```

### Demo

Right [here](http://dave-kennedy.github.io/Knockoff).

### Tests

[Yup, got those too](http://dave-kennedy.github.io/Knockoff/tests.html).

