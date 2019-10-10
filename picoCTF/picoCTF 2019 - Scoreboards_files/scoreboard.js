"use strict";

var renderScoreboardTeamScore = _.template($("#scoreboard-teamscore-template").remove().text());

var renderScoreboard = _.template($("#scoreboard-template").remove().text());

var renderScoreboardPage = _.template($("#scoreboard-page-template").remove().text());

window.reloadGraph = function () {
  var reload = function reload() {
    $(".progression-graph").empty();
    var active_tab = $("ul#scoreboard-tabs li.active").data();

    if (active_tab.sid !== undefined) {
      window.drawTopTeamsProgressionGraph(".progression-graph", {
        'scoreboard_id': active_tab.sid
      });
    } else if (active_tab.gid !== undefined) {
      window.drawTopTeamsProgressionGraph(".progression-graph", {
        'group_id': active_tab.gid
      });
    }
  };

  setTimeout(reload, 100);
};

var render_scoreboard = function render_scoreboard(board_key, search) {
  // Re-render the scoreboard display, including the paginator
  // Build the scoreboard page endpoint URL
  var scoreboard_endpoint = '/api/v1/';

  if (board_key.hasOwnProperty('group_id')) {
    scoreboard_endpoint += 'groups/' + board_key.group_id + '/scoreboard';
  } else {
    scoreboard_endpoint += 'scoreboards/' + board_key.scoreboard_id + '/scoreboard';
  }

  if (search !== undefined) {
    scoreboard_endpoint += '?search=' + search;
  } // If non-group scoreboard, get scoreboard metadata


  var scoreboard_metadata_endpoint = null;

  if (board_key.hasOwnProperty('scoreboard_id')) {
    scoreboard_metadata_endpoint = '/api/v1/scoreboards/' + board_key.scoreboard_id;
  } // Fetch the scoreboard page and re-render the scoreboard display


  $.when(apiCall("GET", scoreboard_endpoint), function () {
    if (scoreboard_metadata_endpoint !== null) {
      return apiCall("GET", scoreboard_metadata_endpoint);
    } else {
      return null;
    }
  }()).done(function (scoreboard_data, scoreboard_metadata) {
    var user_data = JSON.parse(localStorage.getItem("/api/v1/user"));
    var scoreboard_properties = {
      scorepage: scoreboard_data[0].scoreboard,
      current_page: scoreboard_data[0].current_page,
      total_pages: scoreboard_data[0].total_pages,
      scoreboard_name: null,
      scoreboard_sponsor: null,
      scoreboard_logo: null,
      user_tid: user_data.tid
    };

    if (scoreboard_metadata !== null) {
      scoreboard_properties = Object.assign(scoreboard_properties, {
        scoreboard_name: scoreboard_metadata[0].name,
        scoreboard_sponsor: scoreboard_metadata[0].sponsor,
        scoreboard_logo: scoreboard_metadata[0].logo
      });
    } else {
      scoreboard_properties.scoreboard_name = $("ul#scoreboard-tabs li.active")[0].innerText;
    }

    var scoreboardContent = renderScoreboard(scoreboard_properties);
    $("#scoreboard-container").html(scoreboardContent).promise().then(function () {
      // Once content has loaded, set up paginator
      $("#pagination").bootstrapPaginator({
        totalPages: scoreboard_data[0].total_pages,
        bootstrapMajorVersion: 3,
        numberOfPages: 10,
        currentPage: scoreboard_data[0].current_page,
        onPageClicked: function onPageClicked(e, eOriginal, type, page) {
          var query = $("#search").val();
          render_scoreboard_page(board_key, query, page);
        }
      });
    });
  }).fail(function (jqXHR) {
    return apiNotify({
      status: 0,
      message: jqXHR.responseJSON.message
    });
  });
};

var render_scoreboard_page = function render_scoreboard_page(board_key, search, page) {
  // Re-render only the scoreboard page, keeping search field and pagination
  var searchValue = $("#search").val(); // Build the scoreboard page endpoint URL

  var scoreboard_endpoint = '/api/v1/';

  if (board_key.hasOwnProperty('group_id')) {
    scoreboard_endpoint += 'groups/' + board_key.group_id + '/scoreboard';
  } else {
    scoreboard_endpoint += 'scoreboards/' + board_key.scoreboard_id + '/scoreboard';
  }

  scoreboard_endpoint += '?page=' + page;

  if (search !== "") {
    scoreboard_endpoint += '&search=' + searchValue;
  } // Fetch the scoreboard page and re-render the scoreboard display


  apiCall("GET", scoreboard_endpoint).done(function (scoreboard_data) {
    var user_data = JSON.parse(localStorage.getItem("/api/v1/user"));
    var scoreboardPageContent = renderScoreboardPage({
      scorepage: scoreboard_data.scoreboard,
      current_page: scoreboard_data.current_page,
      user_tid: user_data.tid
    });
    $("#scoreboard-container tbody").html(scoreboardPageContent);
  }).fail(function (jqXHR) {
    return apiNotify({
      status: 0,
      message: jqXHR.responseJSON.message
    });
  });
};

var attachSearchListeners = function attachSearchListeners() {
  // Attach search field listener
  $("form[role=search]").on("submit", function (e) {
    e.preventDefault();
  });
  $("#search").on("keyup", function (e) {
    e.preventDefault();
    var board_key;
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(function () {
      var active_tab = $("#scoreboard-tabs li.active").data();

      if (active_tab.sid !== undefined) {
        board_key = {
          'scoreboard_id': active_tab.sid
        };
      } else if (active_tab.gid !== undefined) {
        board_key = {
          'group_id': active_tab.gid
        };
      }

      var searchValue = $("#search").val();
      render_scoreboard(board_key, searchValue);
    }, 250);
  });
};

var render_scoreboard_navigation = function render_scoreboard_navigation() {
  return addAjaxListener("renderScoreboardNav", "/api/v1/user", function (data) {
    if (!data.logged_in) {
      apiCall("GET", "/api/v1/scoreboards").done(function (scoreboard_data) {
        var eligibleScoreboards = _.filter(scoreboard_data, function (scoreboard) {
          return scoreboard['priority'] === 99;
        });

        var teamGroups = [];

        var scoreboardTabTemplate = _.template($("#scoreboard-tabs-template").remove().text());

        var nav_content = scoreboardTabTemplate({
          eligibleScoreboards: eligibleScoreboards,
          teamGroups: teamGroups,
          renderScoreboard: renderScoreboard
        });
        $("#scoreboard-tabs").html(nav_content).promise().done(function () {
          $("#search").val("");
          var active_tab = $("#scoreboard-tabs li").data();
          var board_key = {
            'scoreboard_id': active_tab.sid
          };
          reloadGraph();
          render_scoreboard(board_key);
          attachSearchListeners();
          $("#scoreboard-tabs li a").first().trigger("click");
        });
      });
    } else {
      $.when(apiCall("GET", "/api/v1/scoreboards"), apiCall("GET", "/api/v1/team"), apiCall("GET", "/api/v1/groups")).done(function (scoreboard_data, team_data, group_data) {
        if (!team_data[0].eligibilities.length) {
          $("scoreboard-container").html('<div class="text-center well">No eligible scoreboards</div>');
          return;
        } // Update the team score


        $("#scoreboard-teamscore").html(renderScoreboardTeamScore({
          teamscore: team_data[0].score
        })); // Create the eligible scoreboard and group tabs

        var eligibleScoreboards = scoreboard_data[0];
        eligibleScoreboards = _.sortBy(eligibleScoreboards, 'name');
        eligibleScoreboards = _.sortBy(eligibleScoreboards, function (scoreboard) {
          // Sort by ascending priority order (0 is typically global)
          return scoreboard['priority'];
        });

        var teamGroups = _.sortBy(group_data[0], 'name');

        var scoreboardTabTemplate = _.template($("#scoreboard-tabs-template").remove().text());

        var nav_content = scoreboardTabTemplate({
          eligibleScoreboards: eligibleScoreboards,
          teamGroups: teamGroups,
          renderScoreboard: renderScoreboard
        });
        $("#scoreboard-tabs").html(nav_content).promise().done(function () {
          // Attach listeners to tab links
          var tab_set = $("#scoreboard-tabs li a");
          var board_key;
          tab_set.on("click", function (e) {
            $("#search").val("");
            var active_tab = $(e.target).parent().data();

            if (active_tab.sid !== undefined) {
              board_key = {
                'scoreboard_id': active_tab.sid
              };
            } else if (active_tab.gid !== undefined) {
              board_key = {
                'group_id': active_tab.gid
              };
            }

            reloadGraph();
            render_scoreboard(board_key);
          }); // Attach search field listener

          attachSearchListeners(); // Automatically render the first scoreboard

          tab_set.first().trigger("click");
        });
      }).fail(function (jqXHR) {
        return apiNotify({
          status: 0,
          message: jqXHR.responseJSON.message
        });
      });
    }
  });
};

$(function () {
  render_scoreboard_navigation();
});