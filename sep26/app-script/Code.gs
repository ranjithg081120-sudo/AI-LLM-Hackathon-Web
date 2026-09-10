function testBackend() {
  const spreadsheet = getSpreadsheet();

  const sheetNames = Object.values(SHEET_NAMES);

  const result = {};

  sheetNames.forEach(function (sheetName) {
    const sheet = spreadsheet.getSheetByName(sheetName);

    result[sheetName] = sheet !== null;
  });

  console.log("Spreadsheet:", spreadsheet.getName());
  console.log("Sheets:", result);

  return result;
}

function testTeamIdGeneration() {
  const teamId = generateNextTeamId();

  console.log("Generated Team ID:", teamId);

  return teamId;
}


function testTeamRegistrationValidation() {
  const testData = {
    teamName: "Test Team",

    leaderName: "Test Leader",
    leaderEmail: "test@bitsathy.ac.in",
    leaderRegisterNumber: "BIT001",
    leaderDepartment: "CSE",

    members: [
      {
        name: "Member One",
        registerNumber: "BIT002",
        department: "CSE"
      },
      {
        name: "Member Two",
        registerNumber: "BIT003",
        department: "IT"
      }
    ]
  };

  const result = validateTeamRegistration(testData);

  console.log("Validation result:", result);

  return result;
}

function testDuplicateCheck() {
  const testData = {
    teamName: "Test Team",

    leaderName: "Test Leader",
    leaderEmail: "test2@bitsathy.ac.in",
    leaderRegisterNumber: "BIT101",
    leaderDepartment: "CSE",

    members: [
      {
        name: "Member One",
        registerNumber: "BIT102",
        department: "CSE"
      },
      {
        name: "Member Two",
        registerNumber: "BIT103",
        department: "IT"
      }
    ]
  };

  const result = checkDuplicateTeamRegistration(testData);

  console.log("Duplicate check:", result);

  return result;
}

function testCreateTeam() {
  const testData = {
    teamName: "Test Team",

    leaderName: "Test Leader",
    leaderEmail: "testleader@bitsathy.ac.in",
    leaderRegisterNumber: "BIT201",
    leaderDepartment: "CSE",

    members: [
      {
        name: "Member One",
        registerNumber: "BIT202",
        department: "CSE"
      },
      {
        name: "Member Two",
        registerNumber: "BIT203",
        department: "IT"
      }
    ]
  };

  const result = createTeam(testData);

  console.log("Created team:", result);

  return result;
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throwApiError("Request body is missing.", "INVALID_REQUEST");
    }

    let request;

    try {
      request = JSON.parse(e.postData.contents);
    } catch (error) {
      throwApiError("Request body must be valid JSON.", "INVALID_REQUEST");
    }

    if (!request.action) {
      throwApiError("Request action is required.", "INVALID_REQUEST");
    }

    switch (request.action) {

      case "REGISTER_TEAM":
        return createJsonResponse(registerTeam(request.idToken, request.data));

      case "GET_DOMAINS":
        return createJsonResponse({
          success: true,
          data: getParticipantDomains(request.idToken)
        });

      case "GET_PROBLEMS":
        return createJsonResponse({
          success: true,
          data: getParticipantProblems(request.idToken, request.data)
        });

      case "SELECT_PROBLEM":
        return createJsonResponse(selectProblem(request.idToken, request.data));

      case "GET_MY_SELECTION":
        return createJsonResponse(getMySelection(request.idToken));

      case "ADMIN_GET_STATS":
        requireAdmin(request.idToken);
        return createJsonResponse({ success: true, data: getAdminDashboardStats() });

      case "ADMIN_GET_TEAMS":
        requireAdmin(request.idToken);
        return createJsonResponse({ success: true, data: getAdminTeams(request.data) });

      case "ADMIN_ADD_TEAM":
        requireAdmin(request.idToken);
        return createJsonResponse(adminAddTeam(request.data || {}));

      case "ADMIN_UPDATE_TEAM":
        requireAdmin(request.idToken);
        return createJsonResponse(adminUpdateTeam(request.data || {}));

      case "ADMIN_ENABLE_TEAM":
        requireAdmin(request.idToken);
        return createJsonResponse(adminEnableTeam(getRequestedTeamId(request.data)));

      case "ADMIN_DISABLE_TEAM":
        requireAdmin(request.idToken);
        return createJsonResponse(adminDisableTeam(getRequestedTeamId(request.data)));

      case "ADMIN_GET_PROBLEMS":
        requireAdmin(request.idToken);
        return createJsonResponse({ success: true, data: getAdminProblems() });

      case "ADMIN_ADD_PROBLEM":
        requireAdmin(request.idToken);
        return createJsonResponse(adminAddProblem(request.data || {}));

      case "ADMIN_UPDATE_PROBLEM":
        requireAdmin(request.idToken);
        return createJsonResponse(adminUpdateProblem(request.data || {}));

      case "ADMIN_ENABLE_PROBLEM":
        requireAdmin(request.idToken);
        return createJsonResponse(adminEnableProblem(getRequestedProblemId(request.data)));

      case "ADMIN_DISABLE_PROBLEM":
        requireAdmin(request.idToken);
        return createJsonResponse(adminDisableProblem(getRequestedProblemId(request.data)));

      case "ADMIN_GET_DOMAINS":
        requireAdmin(request.idToken);
        return createJsonResponse({ success: true, data: getAdminDomains() });

      case "ADMIN_UPDATE_DOMAIN":
        requireAdmin(request.idToken);
        return createJsonResponse(adminUpdateDomain(request.data || {}));

      case "ADMIN_RELEASE_NOW":
        requireAdmin(request.idToken);
        return createJsonResponse(adminReleaseNow());

      case "ADMIN_CLOSE_SELECTION":
        requireAdmin(request.idToken);
        return createJsonResponse(adminSetSelectionStatus(SELECTION_STATUS.CLOSED));

      case "ADMIN_OPEN_SELECTION":
        requireAdmin(request.idToken);
        return createJsonResponse(adminSetSelectionStatus(SELECTION_STATUS.OPEN));

      default:
        throwApiError("The requested action is not supported.", "INVALID_ACTION");
    }

  } catch (error) {

    console.error(error && error.message ? error.message : error);

    return createJsonResponse({
      success: false,
      error: error.message || "An unexpected error occurred.",
      code: error.code || "INTERNAL_ERROR"
    });
  }
}


function throwApiError(message, code) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function testDoPost() {
  const testRequest = {
    action: "REGISTER_TEAM",

    data: {
      teamName: "API Test Team",

      leaderName: "API Test Leader",
      leaderEmail: "apitest@bitsathy.ac.in",
      leaderRegisterNumber: "BIT301",
      leaderDepartment: "CSE",

      members: [
        {
          name: "API Member One",
          registerNumber: "BIT302",
          department: "CSE"
        },
        {
          name: "API Member Two",
          registerNumber: "BIT303",
          department: "IT"
        }
      ]
    }
  };

  const fakeEvent = {
    postData: {
      contents: JSON.stringify(testRequest)
    }
  };

  const response = doPost(fakeEvent);

  console.log("API response:", response.getContent());
}


function doGet() {
  return HtmlService
    .createHtmlOutputFromFile("index")
    .setTitle("AI Hackathon");
}


function getHealth() {
  return {
    success: true,
    service: "AI Hackathon API",
    status: "ONLINE"
  };
}


function testAuthWithoutToken() {
  try {
    verifyGoogleIdToken("");

    console.log("ERROR: Invalid token was accepted.");

  } catch (error) {
    console.log("Expected authentication failure:", error.message);
  }
}


function getRequestedTeamId(data) {
  const teamId = String(data && (data.teamId || data.TeamID) || "").trim();

  if (!teamId) {
    throwApiError("TeamID is required.", "INVALID_REQUEST");
  }

  return teamId;
}


function getRequestedProblemId(data) {
  const psId = String(data && (data.psId || data.PSID) || "").trim().toUpperCase();

  if (!psId) {
    throwApiError("PSID is required.", "INVALID_REQUEST");
  }

  return psId;
}