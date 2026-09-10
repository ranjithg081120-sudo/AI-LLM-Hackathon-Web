function generateNextTeamId() {
  const lock = LockService.getScriptLock();

  // Wait up to 10 seconds if another registration is running.
  lock.waitLock(10000);

  try {
    const sheet = getSheet(SHEET_NAMES.TEAMS);
    const lastRow = sheet.getLastRow();

    // Only headers exist → first team.
    if (lastRow < 2) {
      return TEAM_ID_PREFIX + "001";
    }

    // Read the TeamID column only.
    const teamIds = sheet
      .getRange(2, 1, lastRow - 1, 1)
      .getValues()
      .flat();

    let maxNumber = 0;

    teamIds.forEach(function (teamId) {
      if (!teamId) {
        return;
      }

      const value = String(teamId).trim();

      if (!value.startsWith(TEAM_ID_PREFIX)) {
        return;
      }

      const numberPart = value.substring(TEAM_ID_PREFIX.length);
      const number = parseInt(numberPart, 10);

      if (!isNaN(number)) {
        maxNumber = Math.max(maxNumber, number);
      }
    });

    const nextNumber = maxNumber + 1;

    return TEAM_ID_PREFIX + String(nextNumber).padStart(3, "0");

  } finally {
    lock.releaseLock();
  }
}


function validateTeamRegistration(data) {
  if (!data) {
    throw new Error("Registration data is required.");
  }

  // -----------------------------
  // Team name
  // -----------------------------
  const teamName = String(data.teamName || "").trim();

  if (!teamName) {
    throw new Error("Team name is required.");
  }

  // -----------------------------
  // Leader details
  // -----------------------------
  const leaderName = String(data.leaderName || "").trim();

  if (!leaderName) {
    throw new Error("Leader name is required.");
  }

  const leaderEmail = normalizeEmail(data.leaderEmail);

  if (!leaderEmail) {
    throw new Error("Leader email is required.");
  }

  if (!leaderEmail.endsWith(COLLEGE_EMAIL_DOMAIN)) {
    throw new Error("Only @bitsathy.ac.in email addresses are allowed.");
  }

  const leaderRegisterNumber =
    normalizeRegisterNumber(data.leaderRegisterNumber);

  if (!leaderRegisterNumber) {
    throw new Error("Leader register number is required.");
  }

  const leaderDepartment =
    String(data.leaderDepartment || "").trim();

  if (!leaderDepartment) {
    throw new Error("Leader department is required.");
  }

  // -----------------------------
  // Member details
  // -----------------------------
  const members = data.members || [];

  if (!Array.isArray(members)) {
    throw new Error("Members must be provided as an array.");
  }

  if (members.length > 4) {
    throw new Error("A team can have a maximum of 4 members besides the leader.");
  }

  // -----------------------------
  // Validate each member
  // -----------------------------
  members.forEach(function (member, index) {

    const memberNumber = index + 1;

    if (!member) {
      throw new Error(`Member ${memberNumber} data is invalid.`);
    }

    const name = String(member.name || "").trim();

    const registerNumber =
      normalizeRegisterNumber(member.registerNumber);

    const department =
      String(member.department || "").trim();

    if (!name) {
      throw new Error(`Member ${memberNumber} name is required.`);
    }

    if (!registerNumber) {
      throw new Error(
        `Member ${memberNumber} register number is required.`
      );
    }

    if (!department) {
      throw new Error(
        `Member ${memberNumber} department is required.`
      );
    }
  });

  return true;
}

function checkDuplicateTeamRegistration(data) {
  const sheet = getSheet(SHEET_NAMES.TEAMS);
  const lastRow = sheet.getLastRow();

  // No teams registered yet.
  if (lastRow < 2) {
    return {
      duplicate: false
    };
  }

  const rows = sheet
    .getRange(2, 1, lastRow - 1, sheet.getLastColumn())
    .getValues();

  const leaderEmail = normalizeEmail(data.leaderEmail);
  const leaderRegisterNumber =
    normalizeRegisterNumber(data.leaderRegisterNumber);

  const submittedRegisterNumbers = [
    leaderRegisterNumber
  ];

  // Add member register numbers.
  (data.members || []).forEach(function(member) {
    const registerNumber =
      normalizeRegisterNumber(member.registerNumber);

    submittedRegisterNumbers.push(registerNumber);
  });

  // --------------------------------
  // Check duplicates within submission
  // --------------------------------

  const uniqueRegisterNumbers =
    new Set(submittedRegisterNumbers);

  if (uniqueRegisterNumbers.size !== submittedRegisterNumbers.length) {
    throwApiError(
      "The same register number cannot appear more than once in a team.",
      "DUPLICATE_REGISTER_NUMBER"
    );
  }

  // --------------------------------
  // Check existing teams
  // --------------------------------

  for (let i = 0; i < rows.length; i++) {

    const row = rows[i];

    const existingLeaderEmail =
      normalizeEmail(row[3]);

    const existingRegisterNumbers = [];

    // Leader
    existingRegisterNumbers.push(
      normalizeRegisterNumber(row[4])
    );

    // Members 1–4
    existingRegisterNumbers.push(
      normalizeRegisterNumber(row[7])
    );

    existingRegisterNumbers.push(
      normalizeRegisterNumber(row[10])
    );

    existingRegisterNumbers.push(
      normalizeRegisterNumber(row[13])
    );

    existingRegisterNumbers.push(
      normalizeRegisterNumber(row[16])
    );

    // Check leader email.
    if (
      leaderEmail &&
      existingLeaderEmail === leaderEmail
    ) {
      throwApiError(
        "This team leader email is already registered.",
        "TEAM_ALREADY_REGISTERED"
      );
    }

    // Check register numbers.
    for (let j = 0; j < submittedRegisterNumbers.length; j++) {

      const submittedNumber =
        submittedRegisterNumbers[j];

      if (
        submittedNumber &&
        existingRegisterNumbers.includes(submittedNumber)
      ) {
        throwApiError(
          `Register number ${submittedNumber} is already registered in another team.`,
          "DUPLICATE_REGISTER_NUMBER"
        );
      }
    }
  }

  return {
    duplicate: false
  };
}


function createTeam(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    try {
      validateTeamRegistration(data);
    } catch (error) {
      if (error.code) {
        throw error;
      }

      throwApiError(error.message, "INVALID_TEAM_DATA");
    }

    checkDuplicateTeamRegistration(data);

    const teamId = generateNextTeamIdWithoutLock();
    const sheet = getSheet(SHEET_NAMES.TEAMS);
    const members = data.members || [];

    function getMember(index) {
      return members[index] || {};
    }

    const member1 = getMember(0);
    const member2 = getMember(1);
    const member3 = getMember(2);
    const member4 = getMember(3);

    const row = [
      teamId,
      String(data.teamName).trim(),
      String(data.leaderName).trim(),
      normalizeEmail(data.leaderEmail),
      normalizeRegisterNumber(data.leaderRegisterNumber),
      String(data.leaderDepartment).trim(),
      String(member1.name || "").trim(),
      normalizeRegisterNumber(member1.registerNumber),
      String(member1.department || "").trim(),
      String(member2.name || "").trim(),
      normalizeRegisterNumber(member2.registerNumber),
      String(member2.department || "").trim(),
      String(member3.name || "").trim(),
      normalizeRegisterNumber(member3.registerNumber),
      String(member3.department || "").trim(),
      String(member4.name || "").trim(),
      normalizeRegisterNumber(member4.registerNumber),
      String(member4.department || "").trim(),
      TEAM_STATUS.ACTIVE,
      new Date()
    ];

    sheet.appendRow(row);

    return {
      success: true,
      data: {
        teamId: teamId
      }
    };
  } finally {
    lock.releaseLock();
  }
}


function registerTeam(idToken, data) {
  const user = requireAuthenticatedUser(idToken);
  const registration = data || {};

  registration.leaderEmail = user.email;

  return createTeam(registration);
}


function generateNextTeamIdWithoutLock() {
  const sheet = getSheet(SHEET_NAMES.TEAMS);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return TEAM_ID_PREFIX + "001";
  }

  const teamIds = sheet
    .getRange(2, 1, lastRow - 1, 1)
    .getValues()
    .flat();

  let maxNumber = 0;

  teamIds.forEach(function(teamId) {
    if (!teamId) {
      return;
    }

    const value = String(teamId).trim();

    if (!value.startsWith(TEAM_ID_PREFIX)) {
      return;
    }

    const number = parseInt(value.substring(TEAM_ID_PREFIX.length), 10);

    if (!isNaN(number)) {
      maxNumber = Math.max(maxNumber, number);
    }
  });

  return TEAM_ID_PREFIX + String(maxNumber + 1).padStart(3, "0");
}