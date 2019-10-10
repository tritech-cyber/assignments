"use strict";

var numDataPoints = 720;

var divFromSelector = function divFromSelector(selector) {
  return _.first($(selector));
};

var borderColors = ["rgba(156,99,169,1)", "rgba(151,187,205,1)", "rgba(230,22,22,1)", "rgba(22,230,57,1)", "rgba(230,22,210,1)", "rgba(220,220,220,1)", "rgba(204,104,0,1)"];
var backgroundColors = ["rgba(156,99,169,0.2)", "rgba(151,187,205,0.2)", "rgba(230,22,22,0.2)", "rgba(22,230,57,0.2)", "rgba(230,22,210,0.2)", "rgba(220,220,220,0.2)", "rgba(204,104,0,0.2)"];
var scoreboardChartSettings = {
  scales: {
    yAxes: [{
      gridLines: {
        display: false
      }
    }],
    xAxes: [{
      gridLines: {
        display: false
      }
    }]
  }
};
var teamChartSettings = {
  scales: {
    yAxes: [{
      gridLines: {
        display: false
      }
    }],
    xAxes: [{
      gridLines: {
        display: false
      }
    }]
  }
};

var timestampsToBuckets = function timestampsToBuckets(samples, key, min, max, seconds) {
  var bucketNumber = function bucketNumber(number) {
    return Math.floor((number - min) / seconds);
  };

  var continuousBucket = {};
  var maxBuckets = bucketNumber(max);

  for (var i = 0; i < maxBuckets; i++) {
    continuousBucket[i] = [];
  }

  var buckets = _.groupBy(samples, function (sample) {
    return bucketNumber(sample[key]);
  });

  return _.extend(continuousBucket, buckets);
};

var maxValuesFromBucketsExtended = function maxValuesFromBucketsExtended(buckets, sampleKey) {
  var maxValues = [];
  var lastInsertedValue = 0;

  _.each(buckets, function (samples) {
    var values = _.pluck(samples, sampleKey);

    if (values.length > 0) {
      var maxValue = _.max(values);

      maxValues.push(maxValue);
      lastInsertedValue = maxValue;
    } else {
      maxValues.push(lastInsertedValue);
    }
  });

  return maxValues;
};

var progressionDataToPoints = function progressionDataToPoints(data, dataPoints, currentDate) {
  if (currentDate == null) {
    currentDate = 0;
  }

  var sortedData = _.sortBy(_.flatten(data), function (submission) {
    return submission.time;
  });

  var min = _.first(sortedData).time - 60 * 5;

  var lastTime = _.last(sortedData).time;

  var max = currentDate === 0 ? lastTime : Math.min(lastTime + 3600 * 24, currentDate);
  var bucketWindow = Math.max(Math.floor((max - min) / dataPoints), 1);
  var dataSets = [];

  _.each(data, function (teamData) {
    var buckets = timestampsToBuckets(teamData, "time", min, max, bucketWindow);
    var steps = maxValuesFromBucketsExtended(buckets, "score");

    if (steps.length > dataPoints) {
      steps = _.rest(steps, steps.length - dataPoints);
    }

    dataSets.push(steps);
  }); //Avoid returning a two dimensional array with 1 element


  if (dataSets.length > 1) {
    return dataSets;
  } else {
    return _.first(dataSets);
  }
};

window.drawTopTeamsProgressionGraph = function (selector, key) {
  var div = divFromSelector(selector);

  var drawgraph = function drawgraph(data) {
    return addAjaxListener("drawTopTeamsProgressionGraph", "/api/v1/status", function (statusdata) {
      var i;

      if (data.length >= 2 && $(selector).is(":visible")) {
        var scoreData = data.map(function (team) {
          return team.score_progression;
        }); //Ensure there are submissions to work with

        if (_.max(_.map(scoreData, function (submissions) {
          return submissions.length;
        })) > 0) {
          var chart;
          var dataPoints = progressionDataToPoints(scoreData, numDataPoints, statusdata.time);
          var datasets = [];

          for (i = 0; i < dataPoints.length; i++) {
            var points = dataPoints[i];
            datasets.push({
              label: data[i].name,
              data: points,
              pointBackgroundColor: borderColors[i % borderColors.length],
              borderColor: borderColors[i % borderColors.length],
              backgroundColor: backgroundColors[i % backgroundColors.length],
              pointHitRadius: 0,
              pointRadius: 1,
              lineTension: 0
            });
          }

          var result = [];

          for (i = 1; i < numDataPoints; i++) {
            result.push("");
          }

          data = {
            labels: result,
            datasets: datasets
          };
          $(div).empty();
          var canvas = $("<canvas>").appendTo(div);
          canvas.attr("width", $(div).width());
          canvas.attr("height", $(div).height());
          chart = new Chart(_.first(canvas).getContext("2d"), {
            type: "line",
            data: data,
            options: scoreboardChartSettings
          });
        }
      }
    });
  };

  if (key.hasOwnProperty('scoreboard_id') != 0) {
    apiCall("GET", "/api/v1/scoreboards/" + key.scoreboard_id + "/score_progressions").done(drawgraph).fail(function (jqXHR) {
      return apiNotify({
        status: 0,
        message: jqXHR.responseJSON.message
      });
    });
  } else if (key.hasOwnProperty('group_id') != 0) {
    apiCall("GET", "/api/v1/groups/" + key.group_id + "/score_progressions").done(drawgraph).fail(function (jqXHR) {
      return apiNotify({
        status: 0,
        message: jqXHR.responseJSON.message
      });
    });
  }
};

window.renderTeamRadarGraph = function (selector, tid) {
  var div = divFromSelector(selector);
  $(div).empty();
  var radarData = window.generateRadarData(tid);

  if (radarData.labels.length > 0) {
    var chart;
    var canvas = $("<canvas>").appendTo(div);
    canvas.attr("width", $(div).width());
    canvas.attr("height", 400);
    return chart = new Chart(_.first(canvas).getContext("2d"), {
      type: "radar",
      data: radarData,
      options: {
        scale: {
          ticks: {
            beginAtZero: true
          }
        }
      }
    });
  } else {
    return $("<p>Waiting for solved problems.</p>").appendTo(div);
  }
};

window.renderTeamProgressionGraph = function (selector, data) {
  var div = divFromSelector(selector);
  addAjaxListener("renderTeamProgressionGraph", "/api/v1/status", function (statusdata) {
    if (data.length > 0) {
      var chart;
      var dataPoints = progressionDataToPoints([data], numDataPoints, statusdata.time);
      var datasets = [{
        label: "Score",
        data: dataPoints,
        pointBackgroundColor: borderColors[0],
        borderColor: borderColors[0],
        backgroundColor: backgroundColors[0],
        pointHitRadius: 0,
        pointRadius: 0,
        lineTension: 0
      }];
      data = {
        labels: __range__(1, numDataPoints, true).map(function (i) {
          return "";
        }),
        datasets: datasets
      };
      $(div).empty();
      var canvas = $("<canvas>").appendTo(div);
      canvas.attr("width", $(div).width());
      canvas.attr("height", $(div).height());
      return chart = new Chart(_.first(canvas).getContext("2d"), {
        type: "line",
        data: data,
        options: teamChartSettings
      });
    } else {
      return $(selector).html("<p>No problems have been solved.</p>");
    }
  });
};

window.drawTeamProgressionGraph = function (selector) {
  return apiCall("GET", "/api/v1/team/score_progression").done(function (data) {
    return renderTeamProgressionGraph(selector, data);
  }).fail(function (jqXHR) {
    return apiNotify({
      status: 0,
      message: jqXHR.responseJSON.message
    });
  });
};

function __range__(left, right, inclusive) {
  var range = [];
  var ascending = left < right;
  var end = !inclusive ? right : ascending ? right + 1 : right - 1;

  for (var i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }

  return range;
}