# Fixtures for Waterline ORM

Provides an easy way to initialize data fixtures using [Waterline ORM](https://github.com/balderdashy/waterline).  Most of the code here comes from [sails-fixtures](https://github.com/proboston/sails-fixtures).  Fixtures are generally read from JSON files into Waterline collections.

## How-to

1. Define your fixtures
2. Initialize Waterline
3. Load fixtures

Simply call the module's `init(configuration, callback)` method once Waterline is ready.  `callback` is a standard async callback function to which an error may be passed as a first argument.  `configuration` is an object using the following key-value pairs:
* `collections` is an object containing extended Waterline collections (see example).  `collections` is required.
* `fixtures` is filled with JSON fixtures, adhering to the data format specified in the section below.  This is optional.
* `dir` specifies a directory in which to look for JSON fixtures.  It is used with the `pattern` option.  `dir` and `pattern` are optional.
* `pattern` specifies a glob pattern to match files within the directory specified by `dir`.  The matched files should contain JSON fixtures,  adhering to the data format specified in the section below.  `dir` and `pattern` are optional.


## Example

```javascript
var Waterline = require('waterline');
var waterlineFixtures = require('waterline-fixtures');

var ORM = new Waterline();

// Load Waterline collections here and setup configuration for Waterline
var waterlineConfig = {};

// Initialize Waterline
ORM.initialize(waterlineConfig, function(err, models) {
  if(err) throw err;

  var next = function doThisAfterFixturesAreLoaded(err) {};

  // Load fixtures
  waterlineFixtures.init({
    collections: models.collections,
    dir: '/path/to/your/fixtures/directory',
    pattern: '*.json' // Default is '*.json'
  }, next);

});
```

### Data Format

Fixtures are loaded in parallel. Their contents are loaded in series in specified order.

```json
[
  {
    "model": "cats",
    "items":[
      {
        "id": 1,
        "name": "Stimpy"
      },
      {
        "id":50,
        "name": "Alonzo"
      }
    ]
  },
  {
    "model": "dogs",
    "items":[
      {
        "id": 7,
        "name": "Ren"
      }
    ]
  }
]
```
