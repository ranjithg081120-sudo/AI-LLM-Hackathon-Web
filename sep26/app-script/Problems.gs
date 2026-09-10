function getProblemById(psId) {
  const normalizedPsId = String(psId || "").trim().toUpperCase();
  const problems = getSheetRecords(SHEET_NAMES.PROBLEMS);

  for (let i = 0; i < problems.length; i++) {
    if (String(problems[i].PSID).trim().toUpperCase() === normalizedPsId) {
      return problems[i];
    }
  }

  return null;
}


function getProblemsByDomain(domainId) {
  const normalizedDomainId = String(domainId || "").trim().toUpperCase();

  return getSheetRecords(SHEET_NAMES.PROBLEMS).filter(function(problem) {
    return String(problem.DomainID).trim().toUpperCase() === normalizedDomainId;
  });
}


function isProblemLocked(psId) {
  const normalizedPsId = String(psId || "").trim().toUpperCase();

  return getSheetRecords(SHEET_NAMES.SELECTIONS).some(function(selection) {
    return String(selection.PSID).trim().toUpperCase() === normalizedPsId &&
      String(selection.Status).trim().toUpperCase() === SELECTION_STATUS.LOCKED;
  });
}


function getAvailableProblemsByDomain(domainId) {
  return getProblemsByDomain(domainId)
    .filter(function(problem) {
      return String(problem.Status).trim().toUpperCase() === PROBLEM_STATUS.ACTIVE &&
        !isProblemLocked(problem.PSID);
    })
    .map(function(problem) {
      return {
        PSID: String(problem.PSID).trim(),
        Title: String(problem.Title || "").trim(),
        Description: String(problem.Description || "").trim(),
        WhatToBuild: String(problem.WhatToBuild || "").trim(),
        DomainID: String(problem.DomainID).trim().toUpperCase()
      };
    });
}


function getParticipantProblems(idToken, data) {
  requireTeamLeader(idToken);

  const domainId = String(data && data.domainId || "").trim().toUpperCase();
  const domain = getDomainById(domainId);

  if (!domain) {
    throwApiError("The requested domain was not found.", "DOMAIN_NOT_FOUND");
  }

  if (String(domain.Status).trim().toUpperCase() !== DOMAIN_STATUS.ACTIVE) {
    throwApiError("The requested domain is disabled.", "DOMAIN_DISABLED");
  }

  if (!isProblemReleased()) {
    throwApiError(
      "Problem statements have not been released yet.",
      "PROBLEMS_NOT_RELEASED"
    );
  }

  if (!isSelectionOpen()) {
    throwApiError("Problem selection is closed.", "SELECTION_CLOSED");
  }

  const maximumTeams = parsePositiveInteger(domain.MaximumTeams);
  const currentLockedTeams = getLockedSelectionCountByDomain(domainId);

  if (currentLockedTeams >= maximumTeams) {
    throwApiError(
      "The requested domain has reached its team capacity.",
      "DOMAIN_CAPACITY_REACHED"
    );
  }

  return getAvailableProblemsByDomain(domainId);
}