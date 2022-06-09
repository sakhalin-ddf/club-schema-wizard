# Club schema wizard plugin

## Initialization

```js
const clubSchemaWizardWithDefaultOptions = new ClubSchemaWizard(
    '#plugin-with-default-options', // selector of root plugin element
    {}, // optional object with plugin options
);

const clubSchemaWizardWithCustomOptions = new ClubSchemaWizard(
    '#plugin-with-some-non-default-options',
    {
        fieldWidth: 400,
        fieldHeight: 400,
    },
);
```

## Options

| Option               | Type     | Default value         | Description                                                                           |
|----------------------|----------|-----------------------|---------------------------------------------------------------------------------------|
| fieldWidth           | numeric  | 500                   | Width of field in pixels                                                              |
| fieldHeight          | numeric  | 500                   | Height of field in pixels                                                             |
| itemWidth            | numeric  | 32                    | Width of item                                                                         |
| itemHeight           | numeric  | 32                    | Height of item                                                                        |
| itemGridStep         | numeric  | 8                     | Grid step of item                                                                     |
| itemDefaultColor     | string   | '#ffffff'             | Default item color                                                                    |
| infoDefaultColor     | string   | '#000000'             | Default info color                                                                    |
| addTextLabel         | string   | 'Add text'            |                                                                                       |
| addAdminLabel        | string   | 'Add admin'           |                                                                                       |
| getInfoText          | function | prompt based function | Function, returns promise. Resolving of promise should provide string from user input |
| onAddInfo            | function | -- none --            | Function, triggers on specific plugin event                                           |
| onRemoveInfo         | function | -- none --            | Function, triggers on specific plugin event                                           |
| onChangeItemColor    | function | -- none --            | Function, triggers on specific plugin event                                           |
| onChangeInfoColor    | function | -- none --            | Function, triggers on specific plugin event                                           |
| onChangeItemPosition | function | -- none --            | Function, triggers on specific plugin event                                           |
| onChangeInfoPosition | function | -- none --            | Function, triggers on specific plugin event                                           |
| onChange             | function | -- none --            | Function, triggers on any plugin event                                                |

## Example

HTML

```html

<script src="./club-schema-wizard.js"></script>
<link rel="stylesheet" href="./club-schema-wizard.css">
<div id="club-schema-wizard-plugin"></div>
```

JS

```js
const clubSchemaWizard = new ClubSchemaWizard('#club-schema-wizard-plugin');

clubSchemaWizard.loadItems([
    {id: '52808256-e11a-47ba-b97e-8d533d5f39bd', title: '1', type: 'pc'},
    {id: 'd6003bac-b72a-4e21-8b1e-3bdb2169b3dc', title: '2', type: 'pc'},
    {id: '7255c7b1-705d-42e6-8105-6a2587f86b75', title: '3', type: 'pc'},
    {id: 'ec11c65f-3a85-455b-8981-340d21b32b58', title: '4', type: 'pc'},
    {id: 'e60dee17-96ea-49a9-876d-b6f356650870', title: '5', type: 'pc'},
    {id: 'c7fb4488-1de2-4491-bae3-cf438cd097d3', title: '6', type: 'pc'},
]);

clubSchemaWizard.loadSchema({
    info: [
        {
            type: 'text',
            text: 'qewqwe',
            color: '#fa0000',
            top: 230,
            left: 130,
        },
        {
            type: 'admin',
            text: 'СТОЙКА\nАДМИНИСТРАТОРА',
            color: '#000000',
            top: 265,
            left: 53,
        },
    ],
    items: [
        {
            id: '52808256-e11a-47ba-b97e-8d533d5f39bd',
            type: 'pc',
            title: '1',
            top: 20,
            left: 20,
        },
        {
            id: 'ec11c65f-3a85-455b-8981-340d21b32b58',
            type: 'pc',
            title: '4',
            top: 120,
            left: 120,
        },
    ],
});

// Current method will return actual schema structure
clubSchemaWizard.buildSchema();
```
