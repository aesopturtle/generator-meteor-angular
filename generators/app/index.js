'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var inquirer = require('inquirer');
var _ = require('lodash');
var fs = require('fs-extra');
var child_process = require('child_process');

module.exports = yeoman.Base.extend({
  // note: arguments and options should be defined in the constructor.
  constructor: function () {
    yeoman.Base.apply(this, arguments);

    // this._configureArguments();
  },

  initializing: function () { },

  prompting: function () {
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the ' + chalk.red('generator-meteor-angular') + ' generator!' +
      '\nPlease make sure that Meteor is installed before you continue.'
    ));

    var prompts = [
      {
        type: 'input',
        name: 'projectName',
        message: 'Your project name',
        default: 'generator-meteor-angular'
      },
      {
        type: 'list',
        name: 'meteorVersion',
        message: 'Which version of Meteor would you like to use?',
        choices: ['Latest', '1.4.0.1'],
        default: 0
      },
      // {
      //   type: 'list',
      //   name: 'routingEngine',
      //   message: 'Which routing engine would you like to use?',
      //   choices: ['None', 'Iron Router', 'Flow Router'],
      //   default: 1
      // }, {
      //   type: 'list',
      //   name: 'cssFramework',
      //   message: 'Which CSS framework would you like to use?',
      //   choices: ['None', 'Twitter Bootstrap', 'Zurb\'s Foundation', 'Semantic UI', 'Materialize', 'Angular Material'],
      //   default: 0
      // }, {
      //   type: 'list',
      //   name: 'cssPreprocessor',
      //   message: 'Which CSS preprocessor would you like to use?',
      //   choices: ['None', 'LESS', 'SCSS', 'PostCSS', 'Stylus'],
      //   default: 0
      // }, 
      {
        type: 'checkbox',
        name: 'components',
        message: 'Which components would you like to use?',
        choices: [
          new inquirer.Separator(' = Accounts = '),
          { name: 'accounts-password' },
          { name: 'accounts-ui' },
          { name: 'accounts-facebook' },
          { name: 'accounts-twitter' },
          { name: 'accounts-weibo' },
          { name: 'alanning:roles' },
          new inquirer.Separator(' = Promise = '),
          { name: 'mvrx:bluebird' },
          { name: 'deanius:promise' },
          new inquirer.Separator(' = Utilities = '),
          { name: 'force-ssl', checked: true },
          { name: 'mquandalle:bower' },
          { name: 'stevezhu:lodash' },
          { name: 'momentjs:moment' },
          { name: 'numeral:numeral' },
          { name: 'pcel:serialize' },
          new inquirer.Separator(' = MeteorHacks = '),
          { name: 'meteorhacks:fast-render' },
          { name: 'meteorhacks:firewall' },
          { name: 'meteorhacks:unblock' },
          { name: 'meteorhacks:kadira' },
          new inquirer.Separator(' = Development Tools = '),
          { name: 'meteortoys:allthings' }
        ],
      }
    ];

    return this.prompt(prompts).then(function (props) {
      // To access props later use something like: this.props.projectName;
      this.props = props;
      this.appname = this.props.projectName.split(' ').join('_');

      // this.log('app name: ', this.props.projectName);


    }.bind(this));
  },

  writing: function () {
    if (this.props.meteorVersion == 'Latest') {
      this._createMeteorProject();
    } else {
      fs.copySync(
        this.templatePath('meteor/' + this.props.meteorVersion),
        this.destinationPath(this.appname)
      );
    }

    // Change working directory to the Meteor app directory for dependency install
    var appDirectory = process.cwd() + '/' + this.appname;
    process.chdir(appDirectory);

    // this.fs.copy(
    //   this.sourceRoot(),
    //   this.destinationPath(this.appname),
    //   { globOptions: { dot: true } }
    // );

    var packageJson = fs.readJsonSync('package.json');
    packageJson.name = this.appname;
    fs.writeJsonSync('package.json', packageJson);
  },

  install: function () {
    // var base = this;
    // this.installDependencies({
    //   bower: false,
    //   npm: true,
    //   callback: function () { }
    // });
  },

  end: function () {
    var done = this.async();
    var base = this;

    // Install components
    this.log('Installing Meteor components...');
    var componentArgs = ['add'];
    this.props.components.forEach(function (component) {
      componentArgs.push(component);
    }, this);

    this.spawnCommand('meteor', componentArgs).on('close', function () {
      base._installNpmPackages();
      base._installAngular();

      if (base.projectCreationOutput) {
        console.log(base.projectCreationOutput);
      }

      done();
    });
  },

  _configureArguments: function () {
    // This makes `appname` a required argument.
    this.argument('appname', { type: String, required: true });
    // And you can then access it later on this way; e.g. CamelCased
    this.appname = _.camelCase(this.appname);
  },

  _createMeteorProject: function () {
    this.log('Creating your Meteor project...');
    this.projectCreationOutput = child_process.execSync('meteor create ' + this.appname).toString();
  },

  _installNpmPackages: function () {
    this._installEslint();
  },

  _installEslint: function () {
    var eslintComponents = [
      'babel-eslint',
      'eslint-config-airbnb',
      'eslint-plugin-import',
      'eslint-plugin-meteor',
      'eslint-plugin-react',
      'eslint-plugin-jsx-a11y',
      'eslint-import-resolver-meteor',
      'eslint'
    ];

    child_process.execSync('npm install --save-dev ' + eslintComponents.join(' '), { stdio: [0, 1, 2] });

    var packageJson = fs.readJsonSync('package.json');
    packageJson.scripts.lint = 'eslint .';
    packageJson.scripts.pretest = 'npm run lint --silent';

    var eslintConfig = fs.readJsonSync(this.templatePath('eslint/.eslintrc.json'));
    packageJson.eslintConfig = eslintConfig;

    fs.writeJsonSync('package.json', packageJson);
  },

  _installAngular: function () {
    this.log('Installing Angular components...');

    child_process.execSync('meteor remove blaze-html-templates');

    var angularComponents = [
      'rxjs@5.0.0-beta.6',
      'zone.js@0.6.12',
      'angular2-meteor-polyfills@0.1.1',
      '@angular/core@2.0.0-rc.4',
      '@angular/common@2.0.0-rc.4',
      '@angular/compiler@2.0.0-rc.4',
      '@angular/platform-browser@2.0.0-rc.4',
      '@angular/platform-browser-dynamic@2.0.0-rc.4',
      'reflect-metadata@0.1.3',
      'angular2-meteor@0.6.0',
      'angular2-meteor-auto-bootstrap@0.6.0'
    ];

    child_process.execSync('npm install --save ' + angularComponents.join(' '), { stdio: [0, 1, 2] });

    // fs.emptyDirSync('client');
    // fs.emptyDirSync('server');
    // fs.emptyDirSync('both');

    // fs.copySync(this.templatePath('angular'), this.destinationRoot(), function (err) {
    //   if (err) throw err;
    // });
  },

  _updatePackageJson: function () {
    var base = this;

    // update package.json
    this.log('Updating package.json...');
    fs.readFile('package.json', 'utf8', function (err, data) {
      if (err) throw err;
      var packageJson = JSON.parse(data);
      packageJson.name = base.appname;

      fs.writeFile('package.json', JSON.stringify(packageJson, null, 2), function (err) {
        if (err) throw err;
      });
    });
  }
});

function checkMeteor() {
  // Check if Meteor is installed. Terminate if not.
  try {
    // This only works on Windows machine.
    run_cmd('meteor.bat', ['--version'], function (text) { });
  } catch (ex) {
    this.log('Meteor not found. Make sure that Meteor is installed before proceeding with this installation. \nPlease visit https://www.meteor.com/install for more infomration.');
    process.exit(1);
  }
}

/**
 * http://stackoverflow.com/questions/14458508/node-js-shell-command-execution
 */
function run_cmd(cmd, args, callBack) {
  var spawn = require('child_process').spawn;
  var child = spawn(cmd, args);
  var resp = "";

  child.stdout.on('data', function (buffer) { resp += buffer.toString() });
  child.stdout.on('end', function () { callBack(resp) });
}
