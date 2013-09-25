module.exports = Slide;

function Slide (number, slide, template) {
  var self = this;

  self.properties = slide.properties || {};
  self.source = slide.source || '';
  self.notes = slide.notes || '';
  self.number = function () {
    return number;
  };

  self.currentstep = -1;
  self.loopcount = 0;
  self.stepQueue = [];

  self.forward = forward;
  self.hasMoreSteps = hasMoreSteps;

  self.run = run;
  self.setup = setup;
  self.step = step;
  self.loop = loop;

  if (template) {
    inherit(self, template);
  }
}

function run() {
  var self = this;
  // if this is the first time slide is being run
  if (self.currentstep === -1 && self.userSetupFunction !== undefined) {
    self.userSetupFunction();
  }
  self.currentstep = 0;
}

function hasMoreSteps () {
  var self = this;

  return self.stepQueue.length > 0;
}

function forward() {
  var self = this;

  if (!self.hasMoreSteps()) {
    return self;
  }

  var stepresult = self.stepQueue[0].apply(self, [self.loopcount]); // add optional argument which is the loop count for the current transition
  if( stepresult === undefined || stepresult === true ) { // run the step
    self.stepQueue.shift(); // remove step
    self.currentstep += 1;
    self.loopcount = 0;
  } else {
    // don't remove step or advance, track number within current step
    self.loopcount += 1;
  }
}

function setup (userFunction) {
  this.userSetupFunction = userFunction;
  return this;
}

function step (userFunction) {
  this.stepQueue.push(function () { userFunction(); });
  return this;
}

function loop (userFunction) {
  this.stepQueue.push(userFunction);
  return this;
}

function inherit (slide, template) {
  inheritProperties(slide, template);
  inheritSource(slide, template);
  inheritNotes(slide, template);
}

function inheritProperties (slide, template) {
  var property
    , value
    ;

  for (property in template.properties) {
    if (!template.properties.hasOwnProperty(property) ||
        ignoreProperty(property)) {
      continue;
    }

    value = [template.properties[property]];

    if (property === 'class' && slide.properties[property]) {
      value.push(slide.properties[property]);
    }

    if (property === 'class' || slide.properties[property] === undefined) {
      slide.properties[property] = value.join(', ');
    }
  }
}

function ignoreProperty (property) {
  return property === 'name' ||
    property === 'layout';
}

function inheritSource (slide, template) {
  var expandedVariables;

  slide.properties.content = slide.source;
  slide.source = template.source;

  expandedVariables = slide.expandVariables(/* contentOnly: */ true);

  if (expandedVariables.content === undefined) {
    slide.source += slide.properties.content;
  }

  delete slide.properties.content;
}

function inheritNotes (slide, template) {
  if (template.notes) {
    slide.notes = template.notes + '\n\n' + slide.notes;
  }
}

Slide.prototype.expandVariables = function (contentOnly) {
  var properties = this.properties
    , expandResult = {}
    ;

  this.source = this.source.replace(/(\\)?(\{\{([^\}\n]+)\}\})/g,
    function (match, escaped, unescapedMatch, property) {
      var propertyName = property.trim()
        , propertyValue
        ;

      if (escaped) {
        return contentOnly ? match[0] : unescapedMatch;
      }

      if (contentOnly && propertyName !== 'content') {
        return match;
      }

      propertyValue = properties[propertyName];

      if (propertyValue !== undefined) {
        expandResult[propertyName] = propertyValue;
        return propertyValue;
      }

      return propertyName === 'content' ? '' : unescapedMatch;
    });

  return expandResult;
};
