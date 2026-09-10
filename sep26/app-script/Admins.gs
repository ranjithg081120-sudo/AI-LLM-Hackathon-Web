function requireAdminAction(idToken) {
  return requireAdmin(idToken);
}


function getTeamRegisterNumbers(team) {
  return [
    team.LeaderRegisterNumber,
    team.Member1RegisterNumber,
    team.Member2RegisterNumber,
    team.Member3RegisterNumber,
    team.Member4RegisterNumber
  ].map(normalizeRegisterNumber).filter(Boolean);
}


function validateAdminTeamData(data) {
  try {
    validateTeamRegistration(data);
  } catch (error) {
    throwApiError(error.message, "INVALID_TEAM_DATA");
  }

  const email = normalizeEmail(data.leaderEmail);

  if (!email.endsWith(COLLEGE_EMAIL_DOMAIN)) {
    throwApiError("The team leader must use a college email address.", "INVALID_TEAM_DATA");
  }
}


function checkAdminTeamDuplicates(data, excludedTeamId) {
  const submittedNumbers = [data.leaderRegisterNumber].concat(
    (data.members || []).map(function(member) {
      return member.registerNumber;
    })
  ).map(normalizeRegisterNumber);
  const uniqueNumbers = new Set(submittedNumbers);

  if (uniqueNumbers.size !== submittedNumbers.length) {
    throwApiError("Register numbers must be unique within the team.", "DUPLICATE_REGISTER_NUMBER");
  }

  const email = normalizeEmail(data.leaderEmail);
  const teams = getSheetRecords(SHEET_NAMES.TEAMS);

  teams.forEach(function(team) {
    if (excludedTeamId && String(team.TeamID).trim() === String(excludedTeamId).trim()) {
      return;
    }

    if (normalizeEmail(team.LeaderEmail) === email) {
      throwApiError("This team leader email is already registered.", "TEAM_ALREADY_REGISTERED");
    }

    const existingNumbers = getTeamRegisterNumbers(team);

    submittedNumbers.forEach(function(registerNumber) {
      if (existingNumbers.includes(registerNumber)) {
        throwApiError(
          "Register number " + registerNumber + " is already registered in another team.",
          "DUPLICATE_REGISTER_NUMBER"
        );
      }
    });
  });
}


function getAdminTeam(team, lockedSelections) {
  const members = [];
  [1, 2, 3, 4].forEach(function(index) {
    const name = String(team["Member" + index + "Name"] || "").trim();
    const registerNumber = normalizeRegisterNumber(team["Member" + index + "RegisterNumber"]);
    const department = String(team["Member" + index + "Department"] || "").trim();

    if (name || registerNumber || department) {
      members.push({ name: name, registerNumber: registerNumber, department: department });
    }
  });

  const selection = lockedSelections.find(function(item) {
    return String(item.TeamID).trim() === String(team.TeamID).trim();
  }) || null;

  return {
    TeamID: String(team.TeamID).trim(),
    TeamName: String(team.TeamName || "").trim(),
    LeaderName: String(team.LeaderName || "").trim(),
    LeaderEmail: normalizeEmail(team.LeaderEmail),
    LeaderRegisterNumber: normalizeRegisterNumber(team.LeaderRegisterNumber),
    LeaderDepartment: String(team.LeaderDepartment || "").trim(),
    Members: members,
    Status: String(team.Status || "").trim().toUpperCase(),
    CreatedAt: team.CreatedAt,
    Selection: selection ? formatSelection(selection) : null
  };
}


function getAdminTeams(data) {
  const filter = String(data && data.status || "").trim().toUpperCase();
  const lockedSelections = getSheetRecords(SHEET_NAMES.SELECTIONS).filter(function(selection) {
    return String(selection.Status).trim().toUpperCase() === SELECTION_STATUS.LOCKED;
  });

  return getSheetRecords(SHEET_NAMES.TEAMS)
    .filter(function(team) {
      return !filter || String(team.Status).trim().toUpperCase() === filter;
    })
    .map(function(team) {
      return getAdminTeam(team, lockedSelections);
    });
}


function adminAddTeam(data) {
  validateAdminTeamData(data || {});
  checkAdminTeamDuplicates(data, null);
  return createTeam(data);
}


function adminUpdateTeam(data) {
  const teamId = String(data && (data.teamId || data.TeamID) || "").trim();

  if (!teamId) {
    throwApiError("TeamID is required.", "INVALID_TEAM_DATA");
  }

  const existingTeam = getSheetRecords(SHEET_NAMES.TEAMS).find(function(team) {
    return String(team.TeamID).trim() === teamId;
  });

  if (!existingTeam) {
    throwApiError("The requested team was not found.", "TEAM_NOT_FOUND");
  }

  const updated = {
    teamName: data.teamName,
    leaderName: data.leaderName,
    leaderEmail: data.leaderEmail,
    leaderRegisterNumber: data.leaderRegisterNumber,
    leaderDepartment: data.leaderDepartment,
    members: data.members || []
  };

  validateAdminTeamData(updated);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    checkAdminTeamDuplicates(updated, teamId);
    const rowNumber = findSheetRowNumber(SHEET_NAMES.TEAMS, "TeamID", teamId);

    if (!rowNumber) {
      throwApiError("The requested team was not found.", "TEAM_NOT_FOUND");
    }

    const sheet = getSheet(SHEET_NAMES.TEAMS);
    const headerMap = getSheetHeaderMap(SHEET_NAMES.TEAMS);
    const values = {
      TeamName: String(updated.teamName).trim(),
      LeaderName: String(updated.leaderName).trim(),
      LeaderEmail: normalizeEmail(updated.leaderEmail),
      LeaderRegisterNumber: normalizeRegisterNumber(updated.leaderRegisterNumber),
      LeaderDepartment: String(updated.leaderDepartment).trim()
    };

    [1, 2, 3, 4].forEach(function(index) {
      const member = updated.members[index - 1] || {};
      values["Member" + index + "Name"] = String(member.name || "").trim();
      values["Member" + index + "RegisterNumber"] = normalizeRegisterNumber(member.registerNumber);
      values["Member" + index + "Department"] = String(member.department || "").trim();
    });

    Object.keys(values).forEach(function(header) {
      sheet.getRange(rowNumber, headerMap[header]).setValue(values[header]);
    });

    return { success: true, data: { teamId: teamId } };
  } finally {
    lock.releaseLock();
  }
}


function setTeamStatus(teamId, status) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const rowNumber = findSheetRowNumber(SHEET_NAMES.TEAMS, "TeamID", teamId);

    if (!rowNumber) {
      throwApiError("The requested team was not found.", "TEAM_NOT_FOUND");
    }

    const headerMap = getSheetHeaderMap(SHEET_NAMES.TEAMS);
    getSheet(SHEET_NAMES.TEAMS).getRange(rowNumber, headerMap.Status).setValue(status);

    return { success: true, data: { teamId: String(teamId).trim(), status: status } };
  } finally {
    lock.releaseLock();
  }
}


function adminEnableTeam(teamId) {
  return setTeamStatus(teamId, TEAM_STATUS.ACTIVE);
}


function adminDisableTeam(teamId) {
  return setTeamStatus(teamId, TEAM_STATUS.DISABLED);
}


function getAdminProblems() {
  return getSheetRecords(SHEET_NAMES.PROBLEMS).map(function(problem) {
    return {
      PSID: String(problem.PSID).trim(),
      DomainID: String(problem.DomainID).trim().toUpperCase(),
      Title: String(problem.Title || "").trim(),
      Description: String(problem.Description || "").trim(),
      WhatToBuild: String(problem.WhatToBuild || "").trim(),
      Status: String(problem.Status || "").trim().toUpperCase()
    };
  });
}


function validateProblemFields(data) {
  if (!String(data.title || "").trim() ||
      !String(data.description || "").trim() ||
      !String(data.whatToBuild || "").trim()) {
    throwApiError("Title, description, and whatToBuild are required.", "INVALID_PROBLEM_DATA");
  }
}


function generateNextProblemIdWithoutLock(domainId) {
  const prefix = String(domainId).trim().toUpperCase() + "-";
  let maxNumber = 0;

  getProblemsByDomain(domainId).forEach(function(problem) {
    const psId = String(problem.PSID).trim().toUpperCase();

    if (psId.indexOf(prefix) !== 0) {
      return;
    }

    const number = parseInt(psId.substring(prefix.length), 10);

    if (!isNaN(number)) {
      maxNumber = Math.max(maxNumber, number);
    }
  });

  return prefix + String(maxNumber + 1).padStart(2, "0");
}


function adminAddProblem(data) {
  const domainId = String(data && data.domainId || "").trim().toUpperCase();
  const domain = getDomainById(domainId);

  if (!domain) {
    throwApiError("The requested domain was not found.", "DOMAIN_NOT_FOUND");
  }

  if (String(domain.Status).trim().toUpperCase() !== DOMAIN_STATUS.ACTIVE) {
    throwApiError("The requested domain is disabled.", "DOMAIN_DISABLED");
  }

  validateProblemFields(data || {});

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const currentDomain = getDomainById(domainId);

    if (!currentDomain || String(currentDomain.Status).trim().toUpperCase() !== DOMAIN_STATUS.ACTIVE) {
      throwApiError("The requested domain is disabled.", "DOMAIN_DISABLED");
    }

    const psId = generateNextProblemIdWithoutLock(domainId);
    getSheet(SHEET_NAMES.PROBLEMS).appendRow([
      psId,
      domainId,
      String(data.title).trim(),
      String(data.description).trim(),
      String(data.whatToBuild).trim(),
      PROBLEM_STATUS.ACTIVE
    ]);

    return { success: true, data: { psId: psId } };
  } finally {
    lock.releaseLock();
  }
}


function getProblemRequestId(data) {
  return String(data && (data.psId || data.PSID) || "").trim().toUpperCase();
}


function setProblemStatus(psId, status) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const rowNumber = findSheetRowNumber(SHEET_NAMES.PROBLEMS, "PSID", psId);

    if (!rowNumber) {
      throwApiError("The requested problem was not found.", "PROBLEM_NOT_FOUND");
    }

    const headerMap = getSheetHeaderMap(SHEET_NAMES.PROBLEMS);
    getSheet(SHEET_NAMES.PROBLEMS).getRange(rowNumber, headerMap.Status).setValue(status);

    return { success: true, data: { psId: psId, status: status } };
  } finally {
    lock.releaseLock();
  }
}


function adminUpdateProblem(data) {
  const psId = getProblemRequestId(data);
  const existing = getProblemById(psId);

  if (!existing) {
    throwApiError("The requested problem was not found.", "PROBLEM_NOT_FOUND");
  }

  const domainId = String(data.domainId || existing.DomainID).trim().toUpperCase();
  const domain = getDomainById(domainId);

  if (!domain) {
    throwApiError("The requested domain was not found.", "DOMAIN_NOT_FOUND");
  }

  if (String(domain.Status).trim().toUpperCase() !== DOMAIN_STATUS.ACTIVE) {
    throwApiError("The destination domain is disabled.", "DOMAIN_DISABLED");
  }

  if (getLockedSelectionByProblemId(psId) &&
      String(existing.DomainID).trim().toUpperCase() !== domainId) {
    throwApiError(
      "A locked problem cannot be moved to another domain.",
      "PROBLEM_ALREADY_LOCKED"
    );
  }

  const updated = {
    title: data.title === undefined ? existing.Title : data.title,
    description: data.description === undefined ? existing.Description : data.description,
    whatToBuild: data.whatToBuild === undefined ? existing.WhatToBuild : data.whatToBuild
  };
  validateProblemFields(updated);

  const status = data.status === undefined
    ? String(existing.Status).trim().toUpperCase()
    : String(data.status).trim().toUpperCase();

  if (status !== PROBLEM_STATUS.ACTIVE && status !== PROBLEM_STATUS.DISABLED) {
    throwApiError("Problem status is invalid.", "INVALID_PROBLEM_DATA");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const currentDomain = getDomainById(domainId);

    if (!currentDomain || String(currentDomain.Status).trim().toUpperCase() !== DOMAIN_STATUS.ACTIVE) {
      throwApiError("The destination domain is disabled.", "DOMAIN_DISABLED");
    }

    const lockedSelection = getLockedSelectionByProblemId(psId);
    const currentProblem = getProblemById(psId);

    if (lockedSelection && currentProblem &&
        String(currentProblem.DomainID).trim().toUpperCase() !== domainId) {
      throwApiError(
        "A locked problem cannot be moved to another domain.",
        "PROBLEM_ALREADY_LOCKED"
      );
    }

    const rowNumber = findSheetRowNumber(SHEET_NAMES.PROBLEMS, "PSID", psId);
    const sheet = getSheet(SHEET_NAMES.PROBLEMS);
    const headerMap = getSheetHeaderMap(SHEET_NAMES.PROBLEMS);
    const values = {
      DomainID: domainId,
      Title: String(updated.title).trim(),
      Description: String(updated.description).trim(),
      WhatToBuild: String(updated.whatToBuild).trim(),
      Status: status
    };

    Object.keys(values).forEach(function(header) {
      sheet.getRange(rowNumber, headerMap[header]).setValue(values[header]);
    });

    return { success: true, data: { psId: psId } };
  } finally {
    lock.releaseLock();
  }
}


function adminEnableProblem(psId) {
  return setProblemStatus(psId, PROBLEM_STATUS.ACTIVE);
}


function adminDisableProblem(psId) {
  return setProblemStatus(psId, PROBLEM_STATUS.DISABLED);
}


function getAdminDomains() {
  return getSheetRecords(SHEET_NAMES.DOMAINS).map(function(domain) {
    const maximumTeams = parsePositiveInteger(domain.MaximumTeams);
    const currentLockedTeams = getLockedSelectionCountByDomain(domain.DomainID);

    return {
      DomainID: String(domain.DomainID).trim().toUpperCase(),
      DomainName: String(domain.DomainName || "").trim(),
      MaximumTeams: maximumTeams,
      Status: String(domain.Status || "").trim().toUpperCase(),
      CurrentLockedTeams: currentLockedTeams,
      RemainingCapacity: Math.max(maximumTeams - currentLockedTeams, 0),
      Available: String(domain.Status).trim().toUpperCase() === DOMAIN_STATUS.ACTIVE &&
        currentLockedTeams < maximumTeams
    };
  });
}


function adminUpdateDomain(data) {
  const domainId = String(data && (data.domainId || data.DomainID) || "").trim().toUpperCase();
  const existing = getDomainById(domainId);

  if (!existing) {
    throwApiError("The requested domain was not found.", "DOMAIN_NOT_FOUND");
  }

  const domainName = String(data.domainName === undefined ? existing.DomainName : data.domainName).trim();
  const maximumTeams = parsePositiveInteger(
    data.maximumTeams === undefined ? existing.MaximumTeams : data.maximumTeams
  );
  const status = String(data.status === undefined ? existing.Status : data.status).trim().toUpperCase();

  if (!domainName || maximumTeams <= 0 ||
      (status !== DOMAIN_STATUS.ACTIVE && status !== DOMAIN_STATUS.DISABLED)) {
    throwApiError("Domain name, positive capacity, and valid status are required.", "INVALID_DOMAIN_DATA");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    if (!getDomainById(domainId)) {
      throwApiError("The requested domain was not found.", "DOMAIN_NOT_FOUND");
    }

    const rowNumber = findSheetRowNumber(SHEET_NAMES.DOMAINS, "DomainID", domainId);
    const headerMap = getSheetHeaderMap(SHEET_NAMES.DOMAINS);
    const sheet = getSheet(SHEET_NAMES.DOMAINS);

    sheet.getRange(rowNumber, headerMap.DomainName).setValue(domainName);
    sheet.getRange(rowNumber, headerMap.MaximumTeams).setValue(maximumTeams);
    sheet.getRange(rowNumber, headerMap.Status).setValue(status);

    return { success: true, data: { domainId: domainId } };
  } finally {
    lock.releaseLock();
  }
}


function getTeamStatistics(teams, selections) {
  const activeTeams = teams.filter(function(team) {
    return String(team.Status).trim().toUpperCase() === TEAM_STATUS.ACTIVE;
  }).length;
  const disabledTeams = teams.filter(function(team) {
    return String(team.Status).trim().toUpperCase() === TEAM_STATUS.DISABLED;
  }).length;
  const activeTeamIds = new Set(teams.filter(function(team) {
    return String(team.Status).trim().toUpperCase() === TEAM_STATUS.ACTIVE;
  }).map(function(team) {
    return String(team.TeamID).trim();
  }));
  const lockedTeamIds = new Set(selections.filter(function(selection) {
    return String(selection.Status).trim().toUpperCase() === SELECTION_STATUS.LOCKED;
  }).map(function(selection) {
    return String(selection.TeamID).trim();
  }).filter(function(teamId) {
    return activeTeamIds.has(teamId);
  }));

  return {
    registeredTeams: teams.length,
    activeTeams: activeTeams,
    disabledTeams: disabledTeams,
    pendingTeams: Math.max(activeTeams - lockedTeamIds.size, 0)
  };
}


function getProblemStatistics(problems, selections, domains) {
  const lockedPsIds = new Set(selections.filter(function(selection) {
    return String(selection.Status).trim().toUpperCase() === SELECTION_STATUS.LOCKED;
  }).map(function(selection) {
    return String(selection.PSID).trim().toUpperCase();
  }));
  const activeDomainIds = new Set(domains.filter(function(domain) {
    return String(domain.Status).trim().toUpperCase() === DOMAIN_STATUS.ACTIVE;
  }).map(function(domain) {
    return String(domain.DomainID).trim().toUpperCase();
  }));
  const fullDomainIds = new Set(domains.filter(function(domain) {
    return String(domain.Status).trim().toUpperCase() !== DOMAIN_STATUS.ACTIVE ||
      getLockedSelectionCountByDomain(domain.DomainID) >= parsePositiveInteger(domain.MaximumTeams);
  }).map(function(domain) {
    return String(domain.DomainID).trim().toUpperCase();
  }));

  return {
    totalProblems: problems.length,
    activeProblems: problems.filter(function(problem) {
      return String(problem.Status).trim().toUpperCase() === PROBLEM_STATUS.ACTIVE;
    }).length,
    disabledProblems: problems.filter(function(problem) {
      return String(problem.Status).trim().toUpperCase() === PROBLEM_STATUS.DISABLED;
    }).length,
    availableProblems: isProblemReleased() && isSelectionOpen() ? problems.filter(function(problem) {
      return String(problem.Status).trim().toUpperCase() === PROBLEM_STATUS.ACTIVE &&
        activeDomainIds.has(String(problem.DomainID).trim().toUpperCase()) &&
        !fullDomainIds.has(String(problem.DomainID).trim().toUpperCase()) &&
        !lockedPsIds.has(String(problem.PSID).trim().toUpperCase());
    }).length : 0
  };
}


function getDomainStatistics(domains, selections) {
  return domains.map(function(domain) {
    const maximumTeams = parsePositiveInteger(domain.MaximumTeams);
    const lockedTeams = selections.filter(function(selection) {
      return String(selection.Status).trim().toUpperCase() === SELECTION_STATUS.LOCKED &&
        String(selection.DomainID).trim().toUpperCase() === String(domain.DomainID).trim().toUpperCase();
    }).length;

    return {
      domainId: String(domain.DomainID).trim().toUpperCase(),
      domainName: String(domain.DomainName || "").trim(),
      maximumTeams: maximumTeams,
      lockedTeams: lockedTeams,
      remainingCapacity: Math.max(maximumTeams - lockedTeams, 0),
      status: String(domain.Status).trim().toUpperCase()
    };
  });
}


function getAdminDashboardStats() {
  const teams = getSheetRecords(SHEET_NAMES.TEAMS);
  const problems = getSheetRecords(SHEET_NAMES.PROBLEMS);
  const selections = getSheetRecords(SHEET_NAMES.SELECTIONS);
  const domains = getSheetRecords(SHEET_NAMES.DOMAINS);
  const teamStats = getTeamStatistics(teams, selections);
  const problemStats = getProblemStatistics(problems, selections, domains);

  return {
    registeredTeams: teamStats.registeredTeams,
    activeTeams: teamStats.activeTeams,
    disabledTeams: teamStats.disabledTeams,
    lockedSelections: selections.filter(function(selection) {
      return String(selection.Status).trim().toUpperCase() === SELECTION_STATUS.LOCKED;
    }).length,
    pendingTeams: teamStats.pendingTeams,
    totalProblems: problemStats.totalProblems,
    activeProblems: problemStats.activeProblems,
    disabledProblems: problemStats.disabledProblems,
    availableProblems: problemStats.availableProblems,
    totalActiveDomains: domains.filter(function(domain) {
      return String(domain.Status).trim().toUpperCase() === DOMAIN_STATUS.ACTIVE;
    }).length,
    domains: getDomainStatistics(domains, selections),
    selectionStatus: String(getConfigValue("SelectionStatus") || "").trim().toUpperCase(),
    hackathonStatus: String(getConfigValue("HackathonStatus") || "").trim().toUpperCase(),
    problemReleaseDate: getConfigValue("ProblemReleaseDate"),
    problemReleaseTime: getConfigValue("ProblemReleaseTime"),
    problemsReleased: isProblemReleased()
  };
}


function adminReleaseNow() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    setConfigValue("ProblemReleaseOverride", "TRUE");
    return { success: true, data: { problemsReleased: true } };
  } finally {
    lock.releaseLock();
  }
}


function adminSetSelectionStatus(status) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    setConfigValue("SelectionStatus", status);
    return { success: true, data: { selectionStatus: status } };
  } finally {
    lock.releaseLock();
  }
}