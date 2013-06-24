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

Of course, you can use constructors in your view model as well.

### To-do

As of right now there is no way to define a property of your view model that is computed from another property. One approach to this is to use proprietary types in the view model initializer. This is the approach taken by Knockout.

But I don't want to clutter up the view model with that stuff. I'm thinking about adding a callback function to the `bind` function to handle computed properties, like this:

    KO.bind(model, function (model) {
        model.strength = model.level / 2;
    });
    
To keep the page updated, I'd need to call that function every time any property changes.

Instead, I might define another public method:

    KO.listen(model.level, model.strength, function (level, strength) {
        strength = level / 2;
    });
    
I have no idea which one of these approaches is more feasbile, so we'll see.
