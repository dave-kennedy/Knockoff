'use strict';

var model = {
    name: 'Dave',
    level: 10,
    undead: true,
    race: 'Human',
    description: 'As a young boy, Dave created lego masterpieces and wrestled alligators. This is why he only has one arm...',
    skills: {
        programming: { day: 10, night: 20 },
        underwaterBasketWeaving: { day: 1, night: 2 }
    },
    powers: [
        { name: 'Flurry of Keystrokes', description: 'You can type up to 80 word per minute.' },
        { name: 'Telekenesis', description: 'You can move a pebble-sized object with your brain once per day.' }
    ]
};

KO.bind(model);

model.attributes = {
    strength: 4,
    wisdom: 6,
    charisma: 20
};

model.totalAttributes = 30;

document.getElementById('attributesTable').insertRow().innerHTML = '<tr><td>Strength</td><td><input data-mapping="attributes.strength" id="attributesStrengthInput"></td></tr>';
document.getElementById('attributesTable').insertRow().innerHTML = '<tr><td>Wisdom</td><td><input data-mapping="attributes.wisdom" id="attributesWisdomInput"></td></tr>';
document.getElementById('attributesTable').insertRow().innerHTML = '<tr><td>Charisma</td><td><input data-mapping="attributes.charisma" id="attributesCharismaInput"></td></tr>';

KO.bind(model);

KO.listen('level', function (event) {
    model.attributes.strength = model.level / 2;
});

KO.listen(['attributes.strength', 'attributes.wisdom', 'attributes.charisma'], function (event) {
    model.totalAttributes = model.attributes.strength + model.attributes.wisdom + model.attributes.charisma;
});

KO.listen(/skills\.(.*)\.day/, function (event, match) {
    var skill = match[1];

    model.skills[skill].night = event.detail.newValue * 2;
});

KO.validate('level', function (event) {
    return event.detail.newValue > 0;
});

KO.validate(['attributes.strength', 'attributes.wisdom', 'attributes.charisma'], function (event) {
    return model.totalAttributes - event.detail.oldValue + event.detail.newValue < 100;
});

KO.validate(/powers\.(\d+)\.name/, function (event, match) {
    var power = parseInt(match[1]);

    return !(power === 0 && event.detail.newValue === 'Ninja Flipping');
});

