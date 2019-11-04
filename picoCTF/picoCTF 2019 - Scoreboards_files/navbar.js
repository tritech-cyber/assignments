"use strict";

var apiOffline = {
  News: "/news"
};
var teacherLoggedIn = {
  Game: "/game",
  "Challenge Problems": "/problems",
  Shell: "/shell",
  Scoreboards: "/scoreboard",
  Classroom: "/classroom",
  News: "/news"
};
var teacherLoggedInNoCompetition = {
  Scoreboards: "/scoreboard",
  Classroom: "/classroom",
  News: "/news"
};
var userLoggedIn = {
  Game: "/game",
  "Challenge Problems": "/problems",
  Shell: "/shell",
  Scoreboards: "/scoreboard",
  News: "/news"
};
var userLoggedInNoCompetition = {
  Scoreboards: "/scoreboard",
  News: "/news"
};
var userNotLoggedIn = {
  Login: "/",
  Scoreboards: "/scoreboard",
  News: "/news"
};
var adminLoggedIn = {
  Management: "/management"
};

var loadNavbar = function loadNavbar(renderNavbarLinks, renderNestedNavbarLinks) {
  var navbarLayout = {
    renderNavbarLinks: renderNavbarLinks,
    renderNestedNavbarLinks: renderNestedNavbarLinks
  };
  addAjaxListener("loadNavBar", "/api/v1/user", function (userData) {
    // onsuccess
    addAjaxListener("loadNavBar", "/api/v1/status", function (competitionData) {
      // onsuccess
      navbarLayout.links = userNotLoggedIn;
      navbarLayout.status = userData;
      navbarLayout.topLevel = true;

      if (userData["logged_in"]) {
        if (userData["teacher"]) {
          if (competitionData["competition_active"]) {
            navbarLayout.links = teacherLoggedIn;
          } else {
            navbarLayout.links = teacherLoggedInNoCompetition;
          }
        } else {
          if (competitionData["competition_active"]) {
            navbarLayout.links = userLoggedIn;
          } else {
            navbarLayout.links = userLoggedInNoCompetition;
          }
        }

        if (userData["admin"]) {
          $.extend(navbarLayout.links, adminLoggedIn);
        }
      } else {
        $(".show-when-logged-out").css("display", "inline-block");
      }

      $("#navbar-links").html(renderNavbarLinks(navbarLayout));
      $("#navbar-item-logout").on("click", logout);
    }, function () {
      // on fail
      navbarLayout.links = apiOffline;
      $("#navbar-links").html(renderNavbarLinks(navbarLayout));
    });
  }, function () {
    // on fail
    navbarLayout.links = apiOffline;
    $("#navbar-links").html(renderNavbarLinks(navbarLayout));
  });
};

$(function () {
  var renderNavbarLinks = _.template($("#navbar-links-template").remove().text());

  var renderNestedNavbarLinks = _.template($("#navbar-links-dropdown-template").remove().text());

  loadNavbar(renderNavbarLinks, renderNestedNavbarLinks);
  window.scoreUpdateTimer = setInterval(function () {
    apiCall("GET", "/api/v1/user").done(function () {
      loadNavbar(renderNavbarLinks, renderNestedNavbarLinks);
    });
  }, 60 * 1000);
});