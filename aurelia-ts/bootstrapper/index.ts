import core from 'core-js'
import {Aurelia, LogManager} from 'aurelia-framework';
import {ConsoleAppender} from 'aurelia-logging-console';

var logger = LogManager.getLogger('bootstrapper');

var readyQueue = [];
var isReady = false;

function onReady(callback) {
  return new Promise((resolve, reject) => {
    if (!isReady) {
      readyQueue.push(() => {
        try {
          resolve(callback());
        } catch(e) {
          reject(e);
        }
      });
    } else {
      resolve(callback());
    }
  });
}

export function bootstrap(configure) {
  return onReady(() => {
    var loader = new (<any>window).AureliaLoader(),
        aurelia = new Aurelia(loader);

    return configureAurelia(aurelia).then(() => { return configure(aurelia); });
  });
}

function ready(global) {
  return new Promise((resolve, reject) =>{
    if (global.document.readyState === "complete" ) {
      resolve(global.document);
    } else {
      global.document.addEventListener("DOMContentLoaded", completed, false);
      global.addEventListener("load", completed, false);
    }

    function completed() {
      global.document.removeEventListener("DOMContentLoaded", completed, false);
      global.removeEventListener("load", completed, false);
      resolve(global.document);
    }
  });
}

function ensureLoader(){
  if(!(<any>window).AureliaLoader){
    return (<any>window).System.normalize('aurelia-bootstrapper').then(function(bootstrapperName){
      return (<any>window).System.normalize('aurelia-loader-default', bootstrapperName).then(function(loaderName){
        return (<any>window).System.import(loaderName);
      })
    });
  }

  return Promise.resolve();
}

function preparePlatform(){
  return (<any>window).System.normalize('aurelia-bootstrapper').then(function(bootstrapperName){
    return (<any>window).System.normalize('aurelia-framework', bootstrapperName).then(function(frameworkName){
      (<any>window).System.map['aurelia-framework'] = frameworkName;

      return (<any>window).System.normalize('aurelia-loader', frameworkName).then(function(loaderName){
        var toLoad = [];

        if(!(<any>window).System.polyfilled){
          logger.debug('loading core-js');
          toLoad.push((<any>window).System.normalize('core-js', loaderName).then(function(name){
            return (<any>window).System.import(name);
          }));
        }

        toLoad.push((<any>window).System.normalize('aurelia-dependency-injection', frameworkName).then(function(name){
          (<any>window).System.map['aurelia-dependency-injection'] = name;
        }));

        toLoad.push((<any>window).System.normalize('aurelia-router', bootstrapperName).then(function(name){
          (<any>window).System.map['aurelia-router'] = name;
        }));

        toLoad.push((<any>window).System.normalize('aurelia-logging-console', bootstrapperName).then(function(name){
          (<any>window).System.map['aurelia-logging-console'] = name;
        }));

        if(!('import' in document.createElement('link'))){
          logger.debug('loading the HTMLImports polyfill');
          toLoad.push((<any>window).System.normalize('webcomponentsjs/HTMLImports.min', loaderName).then(function(name){
            return (<any>window).System.import(name);
          }));
        }

        if(!("content" in document.createElement("template"))){
          logger.debug('loading the HTMLTemplateElement polyfill');
          toLoad.push((<any>window).System.normalize('aurelia-html-template-element', loaderName).then(function(name){
            return (<any>window).System.import(name);
          }));
        }

        return Promise.all(toLoad);
      });
    });
  });
}

var installedDevelopmentLogging = false;

function configureAurelia(aurelia){
  return (<any>window).System.normalize('aurelia-bootstrapper').then(function(bName){
    var toLoad = [];

    toLoad.push((<any>window).System.normalize('aurelia-templating-binding', bName).then(templatingBinding => {
      aurelia.use.defaultBindingLanguage = function(){
        aurelia.use.plugin(templatingBinding);
        return this;
      };
    }));

    toLoad.push((<any>window).System.normalize('aurelia-templating-router', bName).then(templatingRouter => {
      aurelia.use.router = function(){
        aurelia.use.plugin(templatingRouter);
        return this;
      };
    }));

    toLoad.push((<any>window).System.normalize('aurelia-history-browser', bName).then(historyBrowser => {
      aurelia.use.history = function(){
         aurelia.use.plugin(historyBrowser);
         return this;
       };
    }));

    toLoad.push((<any>window).System.normalize('aurelia-templating-resources', bName).then(name => {
      (<any>window).System.map['aurelia-templating-resources'] = name;
      aurelia.use.defaultResources = function(){
        aurelia.use.plugin(name);
        return this;
      }
    }));

    toLoad.push((<any>window).System.normalize('aurelia-event-aggregator', bName).then(eventAggregator => {
      (<any>window).System.map['aurelia-event-aggregator'] = eventAggregator;
      aurelia.use.eventAggregator = function(){
        aurelia.use.plugin(eventAggregator);
        return this;
      };
    }));

    aurelia.use.standardConfiguration = function(){
      aurelia.use
        .defaultBindingLanguage()
        .defaultResources()
        .history()
        .router()
        .eventAggregator();
      return this;
    };

    aurelia.use.developmentLogging = function(){
      if(!installedDevelopmentLogging){
        installedDevelopmentLogging = true;
        LogManager.addAppender(new ConsoleAppender());
        LogManager.setLevel(LogManager.logLevel.debug);
      }
      return this;
    }

    return Promise.all(toLoad);
  });
}

function runningLocally(){
  return window.location.protocol !== 'http' && window.location.protocol !== 'https';
}

function handleApp(appHost){
  var configModuleId = appHost.getAttribute('aurelia-app'),
      aurelia, loader;

  if(configModuleId){
    loader = new (<any>window).AureliaLoader();

    return loader.loadModule(configModuleId)
      .then(m => {
        aurelia = new Aurelia(loader);
        aurelia.host = appHost;
        return configureAurelia(aurelia).then(() => { return m.configure(aurelia); });
      }).catch(e => {
        setTimeout(function(){ throw e; }, 0);
      });
  }else{
    aurelia = new Aurelia();
    aurelia.host = appHost;

    return configureAurelia(aurelia).then(() => {
      if(runningLocally()){
        aurelia.use.developmentLogging();
      }

      aurelia.use.standardConfiguration();

      return aurelia.start().then(a => a.setRoot());
    }).catch(e => {
      setTimeout(function(){ throw e; }, 0);
    });
  }
}

function run() {
  return ready(window).then((doc:any) => {
    var appHost = doc.querySelectorAll("[aurelia-app]");

    return ensureLoader().then(() => {
      return preparePlatform().then(function(){
        var i, ii;

        for (i = 0, ii = appHost.length; i < ii; ++i) {
          handleApp(appHost[i]);
        }

        isReady = true;
        for (i = 0, ii = readyQueue.length; i < ii; ++i) {
          readyQueue[i]();
        }
        readyQueue = [];
      });
    });
  });
}

run();
