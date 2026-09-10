function validateSelectionRequest(data) {
  const domainId = String(data && data.domainId || "").trim().toUpperCase();
  const psId = String(data && data.psId || "").trim().toUpperCase();

  if (!domainId || !psId) {
    throwApiError(
      "Both domainId and psId are required.",
      "INVALID_REQUEST"
    );
  }

  return {
    domainId: domainId,
    psId: psId
  };
}


function getSelectionByTeamId(teamId) {
  const normalizedTeamId = String(teamId || "").trim();

  return getSheetRecords(SHEET_NAMES.SELECTIONS).find(function(selection) {
    return String(selection.TeamID).trim() === normalizedTeamId;
  }) || null;
}


function getLockedSelectionByTeamId(teamId) {
  const normalizedTeamId = String(teamId || "").trim();

  return getSheetRecords(SHEET_NAMES.SELECTIONS).find(function(selection) {
    return String(selection.TeamID).trim() === normalizedTeamId &&
      String(selection.Status).trim().toUpperCase() === SELECTION_STATUS.LOCKED;
  }) || null;
}


function getSelectionByProblemId(psId) {
  const normalizedPsId = String(psId || "").trim().toUpperCase();

  return getSheetRecords(SHEET_NAMES.SELECTIONS).find(function(selection) {
    return String(selection.PSID).trim().toUpperCase() === normalizedPsId;
  }) || null;
}


function getLockedSelectionByProblemId(psId) {
  const normalizedPsId = String(psId || "").trim().toUpperCase();

  return getSheetRecords(SHEET_NAMES.SELECTIONS).find(function(selection) {
    return String(selection.PSID).trim().toUpperCase() === normalizedPsId &&
      String(selection.Status).trim().toUpperCase() === SELECTION_STATUS.LOCKED;
  }) || null;
}


function getLockedSelectionByTeam(teamId) {
  return getLockedSelectionByTeamId(teamId);
}


function getSelectionProblem(selection) {
  if (!selection) {
    return null;
  }

  const problem = getProblemById(selection.PSID);

  if (!problem) {
    return null;
  }

  return {
    title: String(problem.Title || "").trim(),
    description: String(problem.Description || "").trim(),
    whatToBuild: String(problem.WhatToBuild || "").trim()
  };
}


function formatSelection(selection) {
  if (!selection) {
    return null;
  }

  return {
    teamId: String(selection.TeamID).trim(),
    domainId: String(selection.DomainID).trim().toUpperCase(),
    psId: String(selection.PSID).trim(),
    selectedAt: selection.SelectedAt,
    status: String(selection.Status).trim().toUpperCase(),
    problem: getSelectionProblem(selection)
  };
}


function selectProblem(idToken, data) {
  // Authenticate before entering the transaction, then repeat all critical
  // state checks after acquiring the lock.
  requireTeamLeader(idToken);
  const request = validateSelectionRequest(data);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const authorization = requireTeamLeader(idToken);
    const team = authorization.team;
    const domain = getDomainById(request.domainId);

    if (!domain) {
      throwApiError("The requested domain was not found.", "DOMAIN_NOT_FOUND");
    }

    if (String(domain.Status).trim().toUpperCase() !== DOMAIN_STATUS.ACTIVE) {
      throwApiError("The requested domain is disabled.", "DOMAIN_DISABLED");
    }

    if (!isSelectionOpen()) {
      throwApiError("Problem selection is closed.", "SELECTION_CLOSED");
    }

    if (!isProblemReleased()) {
      throwApiError(
        "Problem statements have not been released yet.",
        "PROBLEMS_NOT_RELEASED"
      );
    }

    const problem = getProblemById(request.psId);

    if (!problem) {
      throwApiError("The requested problem was not found.", "PROBLEM_NOT_FOUND");
    }

    if (String(problem.Status).trim().toUpperCase() !== PROBLEM_STATUS.ACTIVE) {
      throwApiError("The requested problem is disabled.", "PROBLEM_DISABLED");
    }

    if (String(problem.DomainID).trim().toUpperCase() !== request.domainId) {
      throwApiError(
        "The problem does not belong to the requested domain.",
        "PROBLEM_DOMAIN_MISMATCH"
      );
    }

    if (getLockedSelectionByTeamId(team.TeamID)) {
      throwApiError(
        "This team already has a locked problem.",
        "TEAM_ALREADY_HAS_SELECTION"
      );
    }

    if (getLockedSelectionByProblemId(problem.PSID)) {
      throwApiError(
        "The requested problem has already been selected.",
        "PROBLEM_ALREADY_LOCKED"
      );
    }

    const maximumTeams = parsePositiveInteger(domain.MaximumTeams);
    const currentLockedTeams = getLockedSelectionCountByDomain(domain.DomainID);

    if (currentLockedTeams >= maximumTeams) {
      throwApiError(
        "The requested domain has reached its team capacity.",
        "DOMAIN_CAPACITY_REACHED"
      );
    }

    const selectedAt = new Date();
    getSheet(SHEET_NAMES.SELECTIONS).appendRow([
      String(team.TeamID).trim(),
      request.domainId,
      String(problem.PSID).trim(),
      selectedAt,
      SELECTION_STATUS.LOCKED
    ]);

    return {
      success: true,
      data: formatSelection({
        TeamID: team.TeamID,
        DomainID: request.domainId,
        PSID: problem.PSID,
        SelectedAt: selectedAt,
        Status: SELECTION_STATUS.LOCKED
      })
    };
  } finally {
    lock.releaseLock();
  }
}


function getMySelection(idToken) {
  const authorization = requireTeamLeader(idToken);
  const selection = getLockedSelectionByTeamId(authorization.team.TeamID);

  return {
    success: true,
    data: {
      hasSelection: selection !== null,
      selection: formatSelection(selection)
    }
  };
}