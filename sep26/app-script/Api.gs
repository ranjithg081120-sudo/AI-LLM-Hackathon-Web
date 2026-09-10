function apiRegisterTeam(idToken, data) {
  return apiCall_(function() {
    requireAuthenticatedUser(idToken);
    return registerTeam(idToken, data);
  });
}


function apiGetDomains(idToken) {
  return apiCall_(function() {
    if (idToken) {
      requireTeamLeader(idToken);
    }
    return getParticipantDomains(idToken);
  });
}


function apiSelectDomain(idToken, dataOrDomainId) {
  return apiCall_(function() {
    requireTeamLeader(idToken);
    return selectDomain(idToken, dataOrDomainId);
  });
}


function apiGetProblems(idToken, data) {
  return apiCall_(function() {
    requireTeamLeader(idToken);
    return getParticipantProblems(idToken, data);
  });
}


function apiSelectProblem(idToken, data) {
  return apiCall_(function() {
    requireTeamLeader(idToken);
    return selectProblem(idToken, data);
  });
}


function apiGetMySelection(idToken) {
  return apiCall_(function() {
    requireTeamLeader(idToken);
    return getMySelection(idToken);
  });
}


function apiAdminGetStats(idToken) {
  return apiCall_(function() {
    requireAdmin(idToken);
    return getAdminDashboardStats();
  });
}


function apiAdminGetTeams(idToken, data) {
  return apiCall_(function() {
    requireAdmin(idToken);
    return getAdminTeams(data);
  });
}


function apiAdminAddTeam(idToken, data) {
  return apiCall_(function() {
    requireAdmin(idToken);
    return adminAddTeam(data);
  });
}


function apiAdminUpdateTeam(idToken, data) {
  return apiCall_(function() {
    requireAdmin(idToken);
    return adminUpdateTeam(data);
  });
}


function apiAdminEnableTeam(idToken, data) {
  return apiCall_(function() {
    requireAdmin(idToken);
    return adminEnableTeam(getRequestedTeamId(data));
  });
}


function apiAdminDisableTeam(idToken, data) {
  return apiCall_(function() {
    requireAdmin(idToken);
    return adminDisableTeam(getRequestedTeamId(data));
  });
}


function apiAdminGetProblems(idToken) {
  return apiCall_(function() {
    requireAdmin(idToken);
    return getAdminProblems();
  });
}


function apiAdminAddProblem(idToken, data) {
  return apiCall_(function() {
    requireAdmin(idToken);
    return adminAddProblem(data);
  });
}


function apiAdminUpdateProblem(idToken, data) {
  return apiCall_(function() {
    requireAdmin(idToken);
    return adminUpdateProblem(data);
  });
}


function apiAdminEnableProblem(idToken, data) {
  return apiCall_(function() {
    requireAdmin(idToken);
    return adminEnableProblem(getRequestedProblemId(data));
  });
}


function apiAdminDisableProblem(idToken, data) {
  return apiCall_(function() {
    requireAdmin(idToken);
    return adminDisableProblem(getRequestedProblemId(data));
  });
}


function apiAdminGetDomains(idToken) {
  return apiCall_(function() {
    requireAdmin(idToken);
    return getAdminDomains();
  });
}


function apiAdminUpdateDomain(idToken, data) {
  return apiCall_(function() {
    requireAdmin(idToken);
    return adminUpdateDomain(data);
  });
}


function apiAdminReleaseNow(idToken) {
  return apiCall_(function() {
    requireAdmin(idToken);
    return adminReleaseNow();
  });
}


function apiAdminCloseSelection(idToken) {
  return apiCall_(function() {
    requireAdmin(idToken);
    return adminSetSelectionStatus(SELECTION_STATUS.CLOSED);
  });
}


function apiAdminOpenSelection(idToken) {
  return apiCall_(function() {
    requireAdmin(idToken);
    return adminSetSelectionStatus(SELECTION_STATUS.OPEN);
  });
}


function apiCall_(operation) {
  try {
    const result = operation();
    const serializedResult = serializeApiValue_(result);

    if (serializedResult && serializedResult.success !== undefined &&
        serializedResult.data !== undefined) {
      return serializedResult;
    }

    return {
      success: true,
      data: serializedResult
    };
  } catch (error) {
    return {
      success: false,
      code: error && error.code || "INTERNAL_ERROR",
      error: error && error.message || "Unexpected error."
    };
  }
}


function serializeApiValue_(value) {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeApiValue_);
  }

  if (value && typeof value === "object") {
    const result = {};

    Object.keys(value).forEach(function(key) {
      result[key] = serializeApiValue_(value[key]);
    });

    return result;
  }

  return value === undefined ? null : value;
}