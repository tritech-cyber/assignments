"use strict";

window.apiCall = function (method, url, data, ga_event_class, ga_event) {
  var params = {
    method: method,
    url: url,
    dataType: "json",
    beforeSend: function beforeSend(request) {
      request.setRequestHeader("X-CSRF-Token", $.cookie("token"));
    },
    timeout: 60000,
    error: function error(jqXHR, textStatus, errorThrown) {
      // Notify for errors with no HTTP response code. Otherwise handle when calling @apiCall
      if (errorThrown === "" && !jqXHR.responseJSON) {
        gtag('event', 'APIOffline', {
          'event_category': 'Error',
          'event_label': url
        });
        $.notify("The server is currently down. We will work to fix this error right away.", "error");
      } else {
        if (ga_event_class && ga_event) {
          gtag('event', ga_event, {
            'event_category': ga_event_class,
            'event_label': "Failure::".concat(jqXHR.responseJSON.message)
          });
        }
      }
    },
    success: function success(data, textStatus, jqXHR) {
      var cached_routes = ['/api/v1/user', '/api/v1/status', '/api/v1/groups'];

      if (method === "GET" && cached_routes.indexOf(url) > -1) {
        // restrict to needed
        window.localStorage.setItem(url, JSON.stringify(data));
      }

      if (ga_event_class && ga_event) {
        gtag('event', ga_event, {
          'event_category': ga_event_class,
          'event_label': 'Success'
        });
      }
    }
  };

  if (data) {
    params.data = JSON.stringify(data);
    params.contentType = "application/json";
  }

  return $.ajax(params);
}; // Hackish: use primarily for user and status calls which occur every page load


window.addAjaxListener = function (id, url, onSuccess, onFail, ga_event_class, ga_event) {
  // Check session storage first, in case the initial call already returned
  var localValue = JSON.parse(window.localStorage.getItem(url));

  if (localValue !== null) {
    onSuccess(localValue);
  } else {
    // Not cached in sessionStorage, add to any pending calls
    var eventId = id + '--' + url;

    var listenHandler = function listenHandler(event, xhr, settings) {
      if (settings.url === url) {
        if (xhr.statusText === "success" && onSuccess) {
          onSuccess(xhr.responseJSON);
          gtag('event', ga_event, {
            'event_category': ga_event_class,
            'event_label': 'Success'
          });
        } else if (xhr.statusText === "error") {
          gtag('event', ga_event, {
            'event_category': ga_event_class,
            'event_label': "Failure::".concat(xhr.responseJSON.message)
          });

          if (onFail) {
            onFail(xhr);
          }
        }
      }
    }; // Avoid adding duplicate listeners


    $(document).ajaxComplete(function (event, xhr, settings) {
      $(document).off(eventId).on(eventId, listenHandler);
      $(document).trigger(eventId, [xhr, settings]);
    });
  }
};

window.redirectIfNotLoggedIn = function () {
  return addAjaxListener("redirectIfNotLoggedIn", "/api/v1/user", function (data) {
    if (!data.logged_in) {
      window.location.href = "/";
    }
  }, undefined, "Redirect", "NotLoggedIn");
};

window.redirectIfLoggedIn = function () {
  return addAjaxListener("redirectIfLoggedIn", "/api/v1/user", function (data) {
    if (data.logged_in) {
      window.location.href = "/news";
    }
  }, undefined, "Redirect", "LoggedIn");
};

window.redirectIfTeacher = function () {
  return addAjaxListener("redirectIfTeacher", "/api/v1/user", function (data) {
    if (data.teacher) {
      window.location.href = "/classroom";
    }
  }, undefined, "Redirect", "Teacher");
};

window.redirectIfNotTeacher = function () {
  return addAjaxListener("redirectIfNotTeacher", "/api/v1/user", function (data) {
    if (!data.teacher) {
      window.location.href = "/";
    }
  }, undefined, "Redirect", "NotTeacher");
};

window.redirectIfNotAdmin = function () {
  return addAjaxListener("redirectIfNotAdmin", "/api/v1/user", function (data) {
    if (!data.admin) {
      window.location.href = "/";
    }
  }, undefined, "Redirect", "NotAdmin");
};

var getStyle = function getStyle(data) {
  var style = "info";

  switch (data.status) {
    case 0:
      style = "error";
      break;

    case 1:
      style = "success";
      break;
  }

  return style;
};

window.apiNotify = function (data, redirect) {
  var style = getStyle(data);
  $.notify(data.message, style);

  if (redirect && data.status === 1) {
    setTimeout(function () {
      return window.location = redirect;
    }, 1000);
  }
};

window.apiNotifyElement = function (elt, data, redirect) {
  var style = getStyle(data);
  elt.notify(data.message, style);

  if (redirect && data.status === 1) {
    setTimeout(function () {
      return window.location = redirect;
    }, 1000);
  }
};

window.numericalSort = function (data) {
  return data.sort(function (a, b) {
    return b - a;
  });
};

window.confirmDialog = function (message, title, yesButton, noButton, yesEvent, noEvent) {
  var renderDialogModal = _.template($("#modal-template").html());

  var dialog_content = renderDialogModal({
    message: message,
    title: title,
    yesButton: yesButton,
    noButton: noButton,
    submitButton: ""
  });
  $("#modal-holder").html(dialog_content);
  $("#confirm-modal").modal({
    backdrop: "static",
    keyboard: false
  }).one("click", "#modal-yes-button", yesEvent).one("click", "#modal-no-button", noEvent);
};

window.messageDialog = function (message, title, button, event) {
  var renderDialogModal = _.template($("#modal-template").html());

  var dialog_content = renderDialogModal({
    message: message,
    title: title,
    yesButton: button,
    noButton: "",
    submitButton: ""
  });
  $("#modal-holder").html(dialog_content);
  $("#confirm-modal").modal({
    backdrop: "static",
    keyboard: false
  }).one("click", "#modal-yes-button", event);
};

window.formDialog = function (message, title, button, defaultFocus, event) {
  var renderDialogModal = _.template($("#modal-template").html());

  var dialog_content = renderDialogModal({
    message: message,
    title: title,
    yesButton: "",
    noButton: "",
    submitButton: button
  });
  $("#modal-holder").html(dialog_content);
  $("#confirm-modal").modal({
    backdrop: "static",
    keyboard: false
  }).on("shown.bs.modal", function () {
    return $("#".concat(defaultFocus)).focus();
  }).on("click", "#modal-submit-button", event);
};

window.closeDialog = function () {
  return $("#confirm-modal").modal("hide");
};

window.logout = function () {
  return apiCall("GET", "/api/v1/user/logout", null, "Authentication", "LogOut").done(function (data) {
    window.localStorage.clear();
    document.location.href = "/";
  });
};

$.fn.apiNotify = function (data, configuration) {
  configuration["className"] = getStyle(data);
  $(this).notify(data.message, configuration);
}; // Source: http://stackoverflow.com/a/17488875


$.fn.serializeObject = function () {
  var o = {};
  var a = this.serializeArray();
  $.each(a, function () {
    if (o[this.name]) {
      if (!o[this.name].push) {
        o[this.name] = [o[this.name]];
      }

      o[this.name].push(this.value || "");
    } else {
      o[this.name] = this.value || "";
    }
  });
  return o;
}; // Don't wait for document ready, don't need DOM


apiCall("GET", "/api/v1/user");
apiCall("GET", "/api/v1/status");