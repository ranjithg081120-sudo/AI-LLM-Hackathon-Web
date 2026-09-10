const mockDomains = [
  {
    domainId: "AGR",
    domainName: "Agriculture & Rural Development",
    maximumTeams: 12,
    currentLockedTeams: 1,
    remainingCapacity: 11,
    available: true
  },
  {
    domainId: "EDU",
    domainName: "Education & Skills",
    maximumTeams: 10,
    currentLockedTeams: 2,
    remainingCapacity: 8,
    available: true
  }
];

const mockProblems = {
  AGR: [
    {
      PSID: "AGR-01",
      Title: "Smart Crop Planning",
      Description: "Create a tool that helps small farms plan seasonal crops.",
      WhatToBuild: "Build a crop planning dashboard.",
      DomainID: "AGR"
    },
    {
      PSID: "AGR-02",
      Title: "Rural Water Planning",
      Description: "Help communities monitor and plan local water resources.",
      WhatToBuild: "Build a community water planning tool.",
      DomainID: "AGR"
    }
  ],
  EDU: [
    {
      PSID: "EDU-01",
      Title: "Accessible Learning Paths",
      Description: "Help learners discover practical study paths.",
      WhatToBuild: "Build a learning path planner.",
      DomainID: "EDU"
    }
  ]
};

let mockSelection = null;

function success(data) {
  return Promise.resolve({
    success: true,
    data
  });
}

function failure(code, error) {
  return Promise.resolve({
    success: false,
    code,
    error
  });
}

function selectionFor(problem) {
  return {
    teamId: "BIT-AI-DEV-001",
    domainId: problem.DomainID,
    psId: problem.PSID,
    selectedAt: "2026-09-10T00:00:00.000Z",
    status: "LOCKED",
    problem: {
      title: problem.Title,
      description: problem.Description,
      whatToBuild: problem.WhatToBuild
    }
  };
}

export function apiGetDomains() {
  return success(mockDomains);
}

export function apiGetProblems(_idToken, data) {
  const domainId = String(data && data.domainId || "").trim().toUpperCase();
  const problems = mockProblems[domainId];

  if (!problems) {
    return failure("DOMAIN_NOT_FOUND", "The requested domain was not found.");
  }

  return success(problems);
}

export function apiRegisterTeam() {
  return success({
    teamId: "BIT-AI-DEV-001"
  });
}

export function apiGetMySelection() {
  return success({
    hasSelection: mockSelection !== null,
    selection: mockSelection
  });
}

export function apiSelectProblem(_idToken, data) {
  if (mockSelection) {
    return failure(
      "TEAM_ALREADY_HAS_SELECTION",
      "This team already has a locked problem."
    );
  }

  const domainId = String(data && data.domainId || "").trim().toUpperCase();
  const psId = String(data && data.psId || "").trim().toUpperCase();
  const problem = (mockProblems[domainId] || []).find(function(candidate) {
    return candidate.PSID === psId;
  });

  if (!problem) {
    return failure("PROBLEM_NOT_FOUND", "The requested problem was not found.");
  }

  mockSelection = selectionFor(problem);
  return success(mockSelection);
}

export function apiAdminGetStats() {
  return success({
    registeredTeams: 1,
    activeTeams: 1,
    disabledTeams: 0,
    lockedSelections: mockSelection ? 1 : 0,
    pendingTeams: mockSelection ? 0 : 1,
    totalProblems: 3,
    activeProblems: 3,
    disabledProblems: 0,
    availableProblems: 3,
    totalActiveDomains: 2,
    domains: mockDomains,
    selectionStatus: "OPEN",
    hackathonStatus: "REGISTRATION_OPEN",
    problemReleaseDate: "2026-09-10",
    problemReleaseTime: "10:30",
    problemsReleased: true
  });
}

export function apiAdminGetTeams() {
  return success([]);
}

export function apiAdminAddTeam() {
  return success({ teamId: "BIT-AI-DEV-002" });
}

export function apiAdminUpdateTeam() {
  return success({ teamId: "BIT-AI-DEV-001" });
}

export function apiAdminEnableTeam(_idToken, data) {
  return success({ teamId: data && (data.teamId || data.TeamID), status: "ACTIVE" });
}

export function apiAdminDisableTeam(_idToken, data) {
  return success({ teamId: data && (data.teamId || data.TeamID), status: "DISABLED" });
}

export function apiAdminGetProblems() {
  return success(Object.values(mockProblems).flat());
}

export function apiAdminAddProblem() {
  return success({ psId: "AGR-03" });
}

export function apiAdminUpdateProblem(_idToken, data) {
  return success({ psId: data && (data.psId || data.PSID) });
}

export function apiAdminEnableProblem(_idToken, data) {
  return success({ psId: data && (data.psId || data.PSID), status: "ACTIVE" });
}

export function apiAdminDisableProblem(_idToken, data) {
  return success({ psId: data && (data.psId || data.PSID), status: "DISABLED" });
}

export function apiAdminGetDomains() {
  return success(mockDomains);
}

export function apiAdminUpdateDomain(_idToken, data) {
  return success({ domainId: data && (data.domainId || data.DomainID) });
}

export function apiAdminReleaseNow() {
  return success({ problemsReleased: true });
}

export function apiAdminCloseSelection() {
  return success({ selectionStatus: "CLOSED" });
}

export function apiAdminOpenSelection() {
  return success({ selectionStatus: "OPEN" });
}
