var

	// Required to simplify file reading with patterns
	glob = require('glob'),

	// Required for entire lib
	async = require('async'),

	// Required just for config default values
	extend = require('node.extend');


// Waterline collections will go here
var collections;

/**
 * Function to call on bootstrap. Finds all fixtures in config.dir and loads
 * them into db using waterline models
 *
 * @param object   config Configuration for init
 * @param function next   Callback after all jobs are finished or some fail. First argument is error. `next(err)`
 */
var init = function(config, next)
{
	var parallel = [];

	config = extend({
		'collections': null,
		'fixtures': null,
		'dir': __dirname,
		'pattern': '*.json'
	}, config);

	collections = config.collections;
	
	// Require Waterline collections. Otherwise this whole thing's a bust!
	if (typeof collections !== 'object') return next('Waterline collections ought to be specified as an option.');
	
	// Load fixtures directly
	if (config.fixtures) {
		parallel.push(config.fixtures);
	}
	
	//Load fixtures from files
	if (config.dir && config.pattern) {
		
		glob(config.dir + "/" + config.pattern, function(next) {
			return function(err, files) {
	
				for (var ifp = 0; ifp < files.length; ifp++) {
					parallel.push(require(files[ifp]));
				}
	
				process_all(parallel, next);
			};
		}(next));
		
	}

};


/**
 * Load all data fixtures on the list in parallel
 *
 * @param array    queue_list List of all fixtures with data
 * @param function next       Standard async callback that id passed an error as first argument. `next(err)`
 */
var process_all = function(queue_list, next)
{
	var jobs = [];

	for (var i = 0; i < queue_list.length; i++) {
		jobs.push(prepare_fixture_job(queue_list[i]));
	}

	async.parallel(jobs, function(next) {
		return function(err, result) {
			if (err) {
				throw err;
			} else {
				next(err);
			}
		};
	}(next));
};


/**
 * Create fixture job for async that loads all model data of a fixture into db.
 *
 * @param array fixture Array/list of models to load
 * @return function(next) Where next is a callback to be passed
*/
var prepare_fixture_job = function(fixture)
{
	return function(fixture) {
		return function(next) {
			var jobs = [];

			for (var i = 0; i < fixture.length; i++) {
				jobs.push(prepare_model_job(fixture[i]));
			}

			async.series(jobs, next);
		};
	}(fixture);
};


/**
 * Create model job for async that loads data/rows of a model into db.
 *
 * @param object model_def Plain object containing model name and items data
 * @return function(next) Where next is a callback to be passed
 *
 */
var prepare_model_job = function(model_def)
{
	return function(model_def) {
		return function(next) {
			var
				name  = model_def.model.toLowerCase(),
				items = model_def.items,
				jobs  = [],
				model;

			if (typeof collections[name] == 'object') {
				model = collections[name];

				for (var i = 0; i < items.length; i++) {
					jobs.push(prepare_model_instance_job(model, items[i]));
				}

				async.series(jobs, next);
			} else {
				next('Model "' + name + '" does not exist');
			}
		};
	}(model_def);
};


/**
 * Create model instance job for async that runs for individual data rows. If id
 * is passed, check db for existence and update/create record. If not, data is
 * simply created.
 *
 * @param object model Waterline model (static)
 * @param object data  Plain object containing instance attr data
 * @return function(next) Where next is a callback to be passed
 */
var prepare_model_instance_job = function(model, data)
{
	return function(model, data) {
		return function(next) {
			if (data.id) {
				model.findOne(data.id).exec(function(model, data, next) {
					return function(err, obj) {
						if (obj) {
							for (var key in data) {
								obj[key] = data[key];
							}

							obj.save(function(model, data, next) {
								return function(err) {
									next(err, obj);
								};
							}(model, data, next));
						} else {
							model.create(data).exec(function(next) {
								return function(err, obj) {
									next(err, obj);
								};
							}(next));
						}
					};
				}(model, data, next));

			} else {
				model.create(data).exec(function(next) {
					return function(err, obj) {
						next(err, obj);
					};
				}(next));
			}
		};
	}(model, data);
};


// Export only init, nothing else could ever be needed
module.exports = {
	'init': init
};
