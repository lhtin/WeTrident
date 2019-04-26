#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec
const execSync = require('child_process').execSync
const chalk = require('chalk')
const prompt = require('prompt')
const semver = require('semver')
const replaceInFile = require('replace-in-file')
const options = require('minimist')(process.argv.slice(2))

var CLI_MODULE_PATH = function () {
  return '/Users/erichua/Projects/UnPourTous/soga/local-cli/index.js'
  // return path.resolve(
  //   process.cwd(),
  //   'node_modules',
  //   '@unpourtous',
  //   'trident',
  //   'local-cli',
  //   'index.js'
  // )
}

var REACT_NATIVE_PACKAGE_JSON_PATH = function () {
  return path.resolve(
    process.cwd(),
    'node_modules',
    '@unpourtous',
    'trident',
    'package.json'
  )
}

// 基础命令
// --help
if (options._.length === 0 && (options.h || options.help)) {
  printUsageGuide()
  process.exit(0)
}

// --version
if (options._.length === 0 && (options.v || options.version)) {
  printVersionsAndExit(REACT_NATIVE_PACKAGE_JSON_PATH())
  process.exit(0)
}

var cli
var cliPath = CLI_MODULE_PATH()
if (fs.existsSync(cliPath)) {
  cli = require(cliPath)
}

var commands = options._
if (cli) {
  // 如果在Trident项目内，所有命令由local-cli接管
  cli.run(path.resolve(options.name || '.'))
} else {
  // 如果在Trident项目外，理论上说只需要支持 --version 和 init命令
  switch (commands[0]) {
    case 'init':
      if (!commands[1]) {
        console.error(
          'Usage: trident-cli init <ProjectName> [--verbose]'
        )
        process.exit(1)
      } else {
        const projectName = commands[1]

        // TODO
        validateProjectName(name)

        if (fs.existsSync(projectName)) {
          console.log(`${projectName} already existed, please remove it before create a new one `)
        } else {
          createProject(projectName, options)
        }
      }
      break
    default:
      console.error(
        'Command `%s` unrecognized. ' +
        'Make sure that you have run `npm install` and that you are inside a react-native project.',
        commands[0]
      )
      process.exit(1)
      break
  }
}

function validateProjectName(name) {
  if (!String(name).match(/^[$A-Z_][0-9A-Z_$]*$/i)) {
    console.error(
      '"%s" is not a valid name for a project. Please use a valid identifier ' +
      'name (alphanumeric).',
      name,
    );
    process.exit(1);
  }

  if (name === 'React') {
    console.error(
      '"%s" is not a valid name for a project. Please do not use the ' +
      'reserved word "React".',
      name,
    );
    process.exit(1);
  }
}

/**
 * print usage guide for trident-cli
 */
function printUsageGuide () {
  console.log([
    '',
    '  Usage: trident [command] [options]',
    '',
    '',
    '  Commands:',
    '',
    '    init <ProjectName> [options]  generates a new project and installs its dependencies',
    '',
    '  Options:',
    '',
    '    -h, --help    output usage information',
    '    -v, --version output the version number',
    '',
  ].join('\n'))
}

/**
 * create a new project
 * @param name project name
 * @param options arguments
 */
function createProject(name, options) {
  var root = path.resolve(name);
  var projectName = path.basename(root);

  console.log(
    'This will walk you through creating a new React Native project in',
    root
  );

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root);
  }

  var packageJson = {
    name: projectName,
    version: '0.0.1',
    private: true,
    scripts: {
      start: 'node node_modules/react-native/local-cli/cli.js start'
    }
  };
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(packageJson));
  process.chdir(root);

  createNewProject(root, projectName, options);
}

function createNewProject(root, projectName, options) {
  // 自定义版本
  const rnPackage = options.version;
  const forceNpmClient = options.npm;
  var installCommand;
  console.log('Installing ' + getInstallPackage(rnPackage) + '...')
  if (!forceNpmClient) {
    console.log('Consider installing yarn to make this faster: https://yarnpkg.com')
  }
  installCommand = 'npm install --save --save-exact ' + getInstallPackage(rnPackage)
  if (options.verbose) {
    installCommand += ' --verbose'
  }
  try {
    execSync(installCommand, {stdio: 'inherit'});
  } catch (err) {
    console.error(err);
    console.error('Command `' + installCommand + '` failed.');
    process.exit(1);
  }
  // checkNodeVersion();
  cli = require(CLI_MODULE_PATH());
  cli.init(root, projectName, bundleId);
}

function getInstallPackage(rnPackage) {
  var packageToInstall = '@unpourtous/trident';
  var isValidSemver = semver.valid(rnPackage);
  if (isValidSemver) {
    packageToInstall += '@' + isValidSemver;
  } else if (rnPackage) {
    // for tar.gz or alternative paths
    packageToInstall = rnPackage;
  }
  // return packageToInstall;
  // FIXME TODO 暂时写死，以后要改成，github发布npm，这里根据版本号去npm取
  return 'https://github.com/erichua23/soga.git --exact'
}

function printVersionsAndExit (reactNativePackageJsonPath) {
  console.log('trident-cli: ' + require('./package.json').version)
  try {
    console.log('trident: ' + require(reactNativePackageJsonPath).version)
  } catch (e) {
    console.log('trident: n/a - not inside a Trident project directory')
  }
  process.exit()
}