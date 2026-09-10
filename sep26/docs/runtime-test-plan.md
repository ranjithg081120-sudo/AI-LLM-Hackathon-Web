# Backend Runtime Test Plan

This plan is for testing the currently deployed Google Apps Script web app. It documents the current implementation only. It does not claim that any runtime test has passed.

## Test status

All tests in this document are **PENDING** until executed against the deployed Apps Script Web App with a real spreadsheet and real Google ID tokens.

No runtime tests were executed while preparing this plan.

## Scope

Participant actions:

- `REGISTER_TEAM`
- `GET_DOMAINS`
- `GET_PROBLEMS`
- `SELECT_PROBLEM`
- `GET_MY_SELECTION`

Admin actions:

- `ADMIN_GET_STATS`
- `ADMIN_GET_TEAMS`
- `ADMIN_ADD_TEAM`
- `ADMIN_UPDATE_TEAM`
- `ADMIN_ENABLE_TEAM`
- `ADMIN_DISABLE_TEAM`
- `ADMIN_GET_PROBLEMS`
- `ADMIN_ADD_PROBLEM`
- `ADMIN_UPDATE_PROBLEM`
- `ADMIN_ENABLE_PROBLEM`
- `ADMIN_DISABLE_PROBLEM`
- `ADMIN_GET_DOMAINS`
- `ADMIN_UPDATE_DOMAIN`
- `ADMIN_RELEASE_NOW`
- `ADMIN_CLOSE_SELECTION`
- `ADMIN_OPEN_SELECTION`

## Prerequisites

### Deployment

1. Deploy the Apps Script project as a Web App.
2. Record the deployment URL:

   ```text
   https://script.google.com/macros/s/DEPLOYMENT_ID/exec
   ```

3. Execute the Web App as the spreadsheet/script owner or another account with the required Sheets permissions.
4. Use the deployed version containing the current `app-script/` files.
5. Confirm the deployment accepts POST requests and returns JSON.

### Spreadsheet

The active spreadsheet must contain exactly the expected application sheets and headers:

- `Teams`
- `Problems`
- `Selections`
- `Domains`
- `Admins`
- `Config`

Expected key headers:

- Teams: `TeamID`, `TeamName`, `LeaderName`, `LeaderEmail`, leader register/department fields, four member groups, `Status`, `CreatedAt`.
- Problems: `PSID`, `DomainID`, `Title`, `Description`, `WhatToBuild`, `Status`.
- Selections: `TeamID`, `DomainID`, `PSID`, `SelectedAt`, `Status`.
- Domains: `DomainID`, `DomainName`, `MaximumTeams`, `Status`.
- Admins: `Email`, `Name`, `Status`.
- Config: `Key`, `Value`.

Use a spreadsheet copy or a dedicated test spreadsheet. Do not run mutation tests against production data without a written cleanup record.

### Recommended fixtures

Create clearly marked test fixtures, for example:

- Test teams with names beginning `RUNTIME-TEST-`.
- Test register numbers in a reserved range that is not used by students.
- Test problem titles beginning `RUNTIME-TEST-`.
- Test domains only if the test spreadsheet is isolated. The production business rule expects the four fixed domains `AGR`, `SKL`, `EDU`, and `GOV`.
- An active admin row for the admin test account.
- A disabled admin row for the disabled-admin test account.
- At least two active team leaders with separate verified college accounts.
- At least one disabled team.
- At least one active and one disabled problem.
- At least one locked selection and, where needed, one cancelled selection.

Do not use `testCreateTeam()` or `testDoPost()` casually in a production-bound spreadsheet. These helper functions can create team rows.

### Config setup

Record the original values of these keys before changing them:

- `HackathonStatus`
- `ProblemReleaseDate`
- `ProblemReleaseTime`
- `SelectionStatus`
- `ProblemReleaseOverride`, if present

Use `Asia/Kolkata` when preparing release fixtures. `isProblemReleased()` compares the configured date/time with Apps Script server time. A value of `ProblemReleaseOverride = TRUE` releases problems immediately and persists until manually changed in Config; there is no API reset action.

### Google ID tokens

Prepare separate tokens or token-producing accounts for:

- A valid verified `@bitsathy.ac.in` team leader.
- A second valid verified `@bitsathy.ac.in` team leader.
- A valid verified college account not present in the Teams sheet.
- A valid verified college account present in Admins with `ACTIVE` status.
- A valid verified college account present in Admins with `DISABLED` status.
- A non-college Google account.
- A token issued for a different OAuth audience.
- An expired token.
- A malformed token string.

Never place real tokens in source control, logs, screenshots, or this document.

## Request helper

Use the deployed URL with a JSON POST body. Examples below use `$WEB_APP_URL` as a local shell variable placeholder.

```bash
curl -i -X POST "$WEB_APP_URL" `
  -H "Content-Type: application/json" `
  --data-raw '{"action":"GET_DOMAINS","idToken":"GOOGLE_ID_TOKEN"}'
```

PowerShell may require escaping JSON quotes differently. The important runtime conditions are the POST method, JSON content type, and exact request body.

## Common response rules

Success responses use:

```json
{
  "success": true,
  "data": {}
}
```

Failures use:

```json
{
  "success": false,
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

The current top-level router may return `INTERNAL_ERROR` for uncategorized validation exceptions. Record the exact response body during testing.

## Authentication tests

### AUTH-01 Valid college Google ID token

**Purpose:** Confirm token verification accepts a valid verified college account.

**Preconditions:** Valid non-expired token with the configured audience, verified email ending in `@bitsathy.ac.in`, and a team row if using a participant action.

**Request:**

```json
{
  "action": "GET_DOMAINS",
  "idToken": "VALID_COLLEGE_TEAM_LEADER_TOKEN"
}
```

**Expected response:** `success: true` with a domain array if the account is an active team leader. If the account is not in Teams, expect `TEAM_NOT_FOUND` after authentication succeeds.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

### AUTH-02 Missing token

**Purpose:** Confirm protected actions reject a missing token.

**Preconditions:** None.

**Request:**

```json
{
  "action": "GET_DOMAINS"
}
```

**Expected response:**

```json
{
  "success": false,
  "code": "AUTH_REQUIRED"
}
```

**Expected Google Sheet change:** None.

**Cleanup required:** None.

### AUTH-03 Invalid token

**Purpose:** Confirm malformed or rejected tokens are not accepted.

**Preconditions:** A malformed token string.

**Request:**

```json
{
  "action": "GET_DOMAINS",
  "idToken": "not-a-real-token"
}
```

**Expected response:** `success: false`, normally `INVALID_TOKEN`.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

### AUTH-04 Non-college account

**Purpose:** Confirm a valid Google identity outside the college domain is rejected.

**Preconditions:** Valid verified token whose email is not in `bitsathy.ac.in`.

**Request:** Use the AUTH-01 body with the non-college token.

**Expected response:** `success: false`, `COLLEGE_EMAIL_REQUIRED`.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

### AUTH-05 Invalid audience

**Purpose:** Confirm a valid Google token issued for a different OAuth client is rejected.

**Preconditions:** Token with an `aud` value different from `AUTH_CONFIG.GOOGLE_CLIENT_ID`.

**Request:** Use the AUTH-01 body with the wrong-audience token.

**Expected response:** `success: false`, `INVALID_AUDIENCE`.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

### AUTH-06 Expired token

**Purpose:** Confirm an expired token cannot call protected actions.

**Preconditions:** Expired token accepted by the test token source or a tokeninfo response with an expired value.

**Request:** Use the AUTH-01 body with the expired token.

**Expected response:** `success: false`, usually `INVALID_TOKEN` from tokeninfo or `TOKEN_EXPIRED` when the response reaches the explicit expiration check.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

## Registration tests

### REG-01 Successful participant registration

**Purpose:** Confirm verified identity becomes the leader email and registration is atomic.

**Preconditions:** Valid college token whose email is not already registered. Unique test register numbers. Teams sheet is ready.

**Request:**

```json
{
  "action": "REGISTER_TEAM",
  "idToken": "COLLEGE_LEADER_A_TOKEN",
  "data": {
    "teamName": "RUNTIME-TEST-Team-A",
    "leaderName": "Runtime Leader A",
    "leaderEmail": "spoofed@example.com",
    "leaderRegisterNumber": "RT001",
    "leaderDepartment": "CSE",
    "members": [
      {
        "name": "Runtime Member A1",
        "registerNumber": "RT002",
        "department": "CSE"
      }
    ]
  }
}
```

**Expected response:** `success: true` and a generated `data.teamId` such as `BIT-AI-###`.

**Expected Google Sheet change:** One `Teams` row with `Status = ACTIVE`, `LeaderEmail` equal to the verified token email rather than `spoofed@example.com`, and a server `CreatedAt` timestamp.

**Cleanup required:** Delete the created test row after all dependent tests, or mark it as test data and remove it from the isolated spreadsheet.

### REG-02 Duplicate leader

**Purpose:** Confirm the same verified leader email cannot register another team.

**Preconditions:** REG-01 completed and its team row remains available.

**Request:** Repeat REG-01 with a new team name and the same leader token/email.

**Expected response:** Failure. The current participant path may return the duplicate message with `INTERNAL_ERROR` because `createTeam()` propagates raw validation exceptions.

**Expected Google Sheet change:** No additional Teams row.

**Cleanup required:** REG-01 cleanup.

### REG-03 Duplicate register number

**Purpose:** Confirm a register number already used by another team cannot be reused.

**Preconditions:** An existing test team with a known register number.

**Request:** Submit a new registration using that existing number as leader or member.

**Expected response:** Failure. The current participant path may expose `INTERNAL_ERROR` rather than `DUPLICATE_REGISTER_NUMBER` because the lower-level validation throws a plain Error.

**Expected Google Sheet change:** No additional Teams row.

**Cleanup required:** Remove only any accidental test row; investigate if a row was written.

### REG-04 Invalid team data

**Purpose:** Confirm missing required fields and more than four members are rejected.

**Preconditions:** Valid college team-leader token.

**Request:**

```json
{
  "action": "REGISTER_TEAM",
  "idToken": "COLLEGE_LEADER_A_TOKEN",
  "data": {
    "teamName": "",
    "leaderName": "",
    "leaderRegisterNumber": "",
    "leaderDepartment": "",
    "members": []
  }
}
```

**Expected response:** Failure with the current validation message; the current route may use `INTERNAL_ERROR` because validation errors are not consistently assigned codes.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

### REG-05 Disabled team

**Purpose:** Confirm a disabled team cannot use protected participant APIs.

**Preconditions:** A valid token whose leader email belongs to a `DISABLED` Teams row.

**Request:** Call `GET_DOMAINS`, `GET_PROBLEMS`, `SELECT_PROBLEM`, or `GET_MY_SELECTION`.

**Expected response:** `success: false`, `TEAM_DISABLED`.

**Expected Google Sheet change:** None.

**Cleanup required:** Restore the fixture team status if it is needed by later tests.

## Problem release and availability tests

### REL-01 Before configured release

**Purpose:** Confirm unreleased participant problem data never reaches the caller.

**Preconditions:** `ProblemReleaseOverride` absent or not `TRUE`; `ProblemReleaseDate` and `ProblemReleaseTime` are in the future; `SelectionStatus = OPEN`; active team leader token.

**Request:**

```json
{
  "action": "GET_PROBLEMS",
  "idToken": "COLLEGE_LEADER_A_TOKEN",
  "data": { "domainId": "AGR" }
}
```

**Expected response:**

```json
{
  "success": false,
  "error": "Problem statements have not been released yet.",
  "code": "PROBLEMS_NOT_RELEASED"
}
```

The response must not contain PSIDs, titles, descriptions, WhatToBuild, or problem arrays.

**Expected Google Sheet change:** None.

**Cleanup required:** Restore the original Config values.

### REL-02 After configured release

**Purpose:** Confirm participant problem retrieval works after server-side release.

**Preconditions:** Release date/time is in the past in `Asia/Kolkata`, `ProblemReleaseOverride` is not needed, selection is open, active domain with capacity, and at least one active unlocked problem exists.

**Request:** Use the REL-01 request.

**Expected response:** `success: true` with only currently available problem fields: `PSID`, `Title`, `Description`, `WhatToBuild`, and `DomainID`.

**Expected Google Sheet change:** None.

**Cleanup required:** Restore release and selection Config values if changed.

### REL-03 Release Now

**Purpose:** Confirm the admin release override bypasses a future configured release time.

**Preconditions:** Valid active admin token. Set a future release date/time first.

**Request:**

```json
{
  "action": "ADMIN_RELEASE_NOW",
  "idToken": "ACTIVE_ADMIN_TOKEN"
}
```

**Expected response:**

```json
{
  "success": true,
  "data": { "problemsReleased": true }
}
```

**Expected Google Sheet change:** Config contains `ProblemReleaseOverride = TRUE`.

**Cleanup required:** Manually restore or remove `ProblemReleaseOverride` in the isolated test spreadsheet. There is no reset API.

### REL-04 Closed selection

**Purpose:** Confirm closed selection blocks participant problem retrieval.

**Preconditions:** Active team leader. Set `SelectionStatus = CLOSED` using the admin action or isolated Config fixture.

**Request:** Call `GET_PROBLEMS` with a valid domain.

**Expected response:** Failure with `SELECTION_CLOSED` and no problem data.

**Expected Google Sheet change:** None from GET_PROBLEMS.

**Cleanup required:** Run `ADMIN_OPEN_SELECTION` or restore `SelectionStatus = OPEN`.

### AVAIL-01 Active problem

**Purpose:** Confirm an active unlocked problem in an active domain with capacity is returned after release.

**Preconditions:** Released problems, open selection, active team, active domain, active problem, no locked selection for PSID, domain below capacity.

**Request:** `GET_PROBLEMS` for the problem's domain.

**Expected response:** Problem appears with exactly the participant fields `PSID`, `Title`, `Description`, `WhatToBuild`, and `DomainID`.

**Expected Google Sheet change:** None.

**Cleanup required:** None unless the problem is later selected.

### AVAIL-02 Disabled problem

**Purpose:** Confirm disabled problems are excluded from participant availability.

**Preconditions:** Released/open state and an active domain containing a `DISABLED` problem.

**Request:** `GET_PROBLEMS` for that domain.

**Expected response:** Success response does not contain the disabled PSID.

**Expected Google Sheet change:** None from GET_PROBLEMS.

**Cleanup required:** Restore problem status if changed.

### AVAIL-03 Locked problem

**Purpose:** Confirm a locked problem is excluded from other teams' availability.

**Preconditions:** A `LOCKED` Selections row for the target PSID and another active team.

**Request:** `GET_PROBLEMS` for the locked problem's domain using the other team leader token.

**Expected response:** Success response does not contain the locked PSID.

**Expected Google Sheet change:** None.

**Cleanup required:** Preserve the locked row unless it is an isolated test fixture; remove only in the test spreadsheet.

### AVAIL-04 Wrong domain

**Purpose:** Confirm only problems belonging to the requested domain are returned.

**Preconditions:** Released/open state and active problems in at least two domains.

**Request:** Request `domainId = AGR` while checking for an `SKL` PSID.

**Expected response:** The SKL PSID is absent. Selecting the SKL PSID while requesting AGR must return `PROBLEM_DOMAIN_MISMATCH`.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

## Selection tests

### SEL-01 Successful selection

**Purpose:** Confirm the selection engine creates one authoritative locked row.

**Preconditions:** Valid active team leader token, open selection, released problems, active domain below capacity, active unlocked PSID.

**Request:**

```json
{
  "action": "SELECT_PROBLEM",
  "idToken": "COLLEGE_LEADER_A_TOKEN",
  "data": {
    "domainId": "AGR",
    "psId": "AGR-03"
  }
}
```

**Expected response:** `success: true`, `data.status = LOCKED`, owner TeamID derived from the token, and problem content under `data.problem`.

**Expected Google Sheet change:** One `Selections` row with `TeamID`, requested `DomainID`, `PSID`, server `SelectedAt`, and `Status = LOCKED`.

**Cleanup required:** Remove the isolated test selection or reset the isolated sheet. Do not delete production selections.

### SEL-02 Same team selects a second problem

**Purpose:** Confirm one locked selection per team.

**Preconditions:** SEL-01 locked row remains.

**Request:** Select a different active available PSID with the same leader token.

**Expected response:** Failure with `TEAM_ALREADY_HAS_SELECTION`.

**Expected Google Sheet change:** No second locked row.

**Cleanup required:** SEL-01 cleanup.

### SEL-03 Already locked PS

**Purpose:** Confirm another team cannot lock an already locked problem.

**Preconditions:** Target PSID has a locked selection owned by another team; second team is active and has no selection.

**Request:** Submit `SELECT_PROBLEM` for that PSID using the second team token.

**Expected response:** `PROBLEM_ALREADY_LOCKED`.

**Expected Google Sheet change:** No new row.

**Cleanup required:** Preserve owner row until dependent owner retrieval tests finish.

### SEL-04 Domain capacity reached

**Purpose:** Confirm no selection is added when locked count is at or above MaximumTeams.

**Preconditions:** Active domain whose locked selection count equals or exceeds `MaximumTeams`; active team with no selection; released/open state.

**Request:** Select an active unlocked problem in the full domain.

**Expected response:** `DOMAIN_CAPACITY_REACHED`.

**Expected Google Sheet change:** No new selection row.

**Cleanup required:** Restore isolated domain/selection fixtures.

### SEL-05 Cancelled selection

**Purpose:** Confirm a cancelled selection does not consume capacity or keep the PSID locked.

**Preconditions:** A Selections row for the domain/PSID with `Status = CANCELLED`, no locked row for that PSID, and available domain capacity.

**Request:** Call `GET_DOMAINS`, `GET_PROBLEMS`, then optionally select the PSID with an eligible team.

**Expected response:** Cancelled row is excluded from capacity. The PSID may appear in GET_PROBLEMS and may be selected if all other conditions pass.

**Expected Google Sheet change:** A successful optional selection adds a new `LOCKED` row; the cancelled historical row remains.

**Cleanup required:** Remove isolated selection rows after the test.

### SEL-06 Disabled team

**Purpose:** Confirm a disabled team cannot select.

**Preconditions:** Disabled team leader token and otherwise available released/open problem.

**Request:** `SELECT_PROBLEM` with valid domain and PSID.

**Expected response:** `TEAM_DISABLED`.

**Expected Google Sheet change:** No new selection row.

**Cleanup required:** Restore team status if reused.

### SEL-07 Closed selection

**Purpose:** Confirm selection closure blocks writes.

**Preconditions:** Active team and available released problem. Set Config `SelectionStatus = CLOSED` through `ADMIN_CLOSE_SELECTION`.

**Request:** `SELECT_PROBLEM` with valid domain and PSID.

**Expected response:** `SELECTION_CLOSED`.

**Expected Google Sheet change:** No new selection row; Config changes to `CLOSED`.

**Cleanup required:** Run `ADMIN_OPEN_SELECTION` and verify release state separately.

### SEL-08 GET_MY_SELECTION after selection

**Purpose:** Confirm owner retrieval returns the locked problem.

**Preconditions:** Locked selection owned by the requesting leader.

**Request:**

```json
{
  "action": "GET_MY_SELECTION",
  "idToken": "COLLEGE_LEADER_A_TOKEN"
}
```

**Expected response:** `hasSelection = true` with the owner TeamID, domain, PSID, `LOCKED` status, and problem content.

**Expected Google Sheet change:** None.

**Cleanup required:** Selection fixture cleanup after all dependent tests.

### SEL-09 GET_MY_SELECTION before selection

**Purpose:** Confirm an active team with no locked selection receives a successful empty result.

**Preconditions:** Active team leader with no `LOCKED` selection.

**Request:** GET_MY_SELECTION with that token.

**Expected response:** `success: true`, `hasSelection = false`, `selection = null`.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

## Admin authorization tests

### ADM-AUTH-01 Valid admin

**Purpose:** Confirm an active Admins-sheet entry can call admin actions.

**Preconditions:** Valid verified college token; matching `Admins.Email`; `Admins.Status = ACTIVE`.

**Request:** `ADMIN_GET_STATS` with the active admin token.

**Expected response:** `success: true` with live statistics.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

### ADM-AUTH-02 Non-admin

**Purpose:** Confirm a valid college participant cannot call an admin action.

**Preconditions:** Valid college token not present in Admins or not active.

**Request:** `ADMIN_GET_STATS` with the participant token.

**Expected response:** `ADMIN_NOT_FOUND`, `ADMIN_DISABLED`, or `ADMIN_REQUIRED` according to the Admins-sheet state.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

### ADM-AUTH-03 Disabled admin

**Purpose:** Confirm a disabled Admins-sheet entry cannot use admin actions.

**Preconditions:** Valid verified college token with matching Admins row set to `DISABLED`.

**Request:** `ADMIN_GET_STATS`.

**Expected response:** `ADMIN_DISABLED`.

**Expected Google Sheet change:** None.

**Cleanup required:** Restore the admin status in the isolated sheet.

## Admin statistics and read APIs

### ADM-READ-01 ADMIN_GET_STATS

**Purpose:** Verify live counts and release/selection state.

**Preconditions:** Seed known teams, problems, locked/cancelled selections, domains, and Config values.

**Request:**

```json
{
  "action": "ADMIN_GET_STATS",
  "idToken": "ACTIVE_ADMIN_TOKEN"
}
```

**Expected response:** Success. Verify `registeredTeams`, `activeTeams`, `disabledTeams`, `lockedSelections`, `pendingTeams`, problem counts, `availableProblems`, `totalActiveDomains`, domain utilization, `selectionStatus`, `hackathonStatus`, release values, and `problemsReleased` against Sheets.

**Expected Google Sheet change:** None.

**Cleanup required:** None for read-only fixtures.

### ADM-READ-02 ADMIN_GET_TEAMS

**Purpose:** Verify all team fields, selection information, and optional status filtering.

**Preconditions:** At least active and disabled test teams, with and without locked selections.

**Request:** Use `ADMIN_GET_TEAMS` with and without `data.status`.

**Expected response:** Success. No filter returns all teams; `status = ACTIVE` returns only active teams. Team output uses `TeamID`, `TeamName`, leader fields, `Members`, `Status`, `CreatedAt`, and `Selection`.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

### ADM-READ-03 ADMIN_GET_PROBLEMS

**Purpose:** Verify admins can see all problem rows, including disabled and unreleased problems.

**Preconditions:** At least active and disabled problems.

**Request:**

```json
{
  "action": "ADMIN_GET_PROBLEMS",
  "idToken": "ACTIVE_ADMIN_TOKEN"
}
```

**Expected response:** Success with `PSID`, `DomainID`, `Title`, `Description`, `WhatToBuild`, and `Status` for every problem. This is intentionally different from participant `GET_PROBLEMS`.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

### ADM-READ-04 ADMIN_GET_DOMAINS

**Purpose:** Verify all domains and server-calculated utilization.

**Preconditions:** Active and disabled domains, and known locked selections.

**Request:** `ADMIN_GET_DOMAINS` with an active admin token.

**Expected response:** Success with all domains and `CurrentLockedTeams`, `RemainingCapacity`, and `Available` calculated from Sheets.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

## Admin team operations

### ADM-TEAM-01 ADMIN_ADD_TEAM

**Purpose:** Verify admin-created teams use the same validation and atomic TeamID generation as participant registration.

**Preconditions:** Active admin token, unique leader email/register numbers, valid full team data.

**Request:**

```json
{
  "action": "ADMIN_ADD_TEAM",
  "idToken": "ACTIVE_ADMIN_TOKEN",
  "data": {
    "teamName": "RUNTIME-TEST-ADMIN-TEAM",
    "leaderName": "Admin Created Leader",
    "leaderEmail": "admin-test-leader@bitsathy.ac.in",
    "leaderRegisterNumber": "RTA001",
    "leaderDepartment": "CSE",
    "members": []
  }
}
```

**Expected response:** Success with generated `data.teamId`.

**Expected Google Sheet change:** One active Teams row. No client-supplied TeamID is used.

**Cleanup required:** Delete the isolated test row after dependent tests.

### ADM-TEAM-02 ADMIN_UPDATE_TEAM

**Purpose:** Verify complete team data can be updated without changing TeamID.

**Preconditions:** A test team created by ADM-TEAM-01 or a dedicated fixture. Use the complete current team data.

**Request:** `ADMIN_UPDATE_TEAM` with `teamId` plus team name, leader fields, and members.

**Expected response:** Success with the unchanged `teamId`.

**Expected Google Sheet change:** The existing row changes in place. TeamID and CreatedAt remain unchanged.

**Cleanup required:** Restore or delete the isolated test row.

### ADM-TEAM-03 Duplicate team constraints

**Purpose:** Verify admin add/update rejects duplicate leader email and register numbers.

**Preconditions:** Existing fixture with known leader email/register number.

**Request:** ADMIN_ADD_TEAM or ADMIN_UPDATE_TEAM using a duplicate.

**Expected response:** `TEAM_ALREADY_REGISTERED` or `DUPLICATE_REGISTER_NUMBER`.

**Expected Google Sheet change:** No new row and no partial update.

**Cleanup required:** None unless a defect creates a row/update.

### ADM-TEAM-04 Enable and disable team

**Purpose:** Verify status controls and participant enforcement.

**Preconditions:** Test team and a valid leader token.

**Request:**

```json
{
  "action": "ADMIN_DISABLE_TEAM",
  "idToken": "ACTIVE_ADMIN_TOKEN",
  "data": { "teamId": "BIT-AI-TEST" }
}
```

Repeat with `ADMIN_ENABLE_TEAM`.

**Expected response:** Success with `status = DISABLED` or `ACTIVE`. While disabled, participant protected actions return `TEAM_DISABLED`.

**Expected Google Sheet change:** Only the Teams `Status` cell changes. Existing selection rows remain.

**Cleanup required:** Restore original status.

## Admin problem operations

### ADM-PROB-01 ADMIN_ADD_PROBLEM and PSID generation

**Purpose:** Verify per-domain PSID generation and atomic insertion.

**Preconditions:** Active admin, active domain, unique test content.

**Request:** ADMIN_ADD_PROBLEM with domain, title, description, and WhatToBuild; do not send PSID.

**Expected response:** Success with a generated `psId` such as `AGR-01`.

**Expected Google Sheet change:** One active Problems row with generated PSID and supplied content.

**Cleanup required:** Delete the isolated test problem after dependent tests.

### ADM-PROB-02 Update problem

**Purpose:** Verify title, description, WhatToBuild, domain, and status update behavior.

**Preconditions:** Existing unlocked problem and active destination domain.

**Request:** ADMIN_UPDATE_PROBLEM with `psId` and changed fields.

**Expected response:** Success with the same `psId`.

**Expected Google Sheet change:** Existing row updates in place; PSID remains unchanged.

**Cleanup required:** Restore or delete the isolated problem.

### ADM-PROB-03 Locked problem protection

**Purpose:** Verify a locked problem cannot be moved to another domain.

**Preconditions:** Problem has a `LOCKED` selection and destination domain is active.

**Request:** ADMIN_UPDATE_PROBLEM with a different `domainId`.

**Expected response:** `PROBLEM_ALREADY_LOCKED`.

**Expected Google Sheet change:** No domain change; locked selection remains.

**Cleanup required:** Preserve production locked selections. Remove only isolated fixtures.

### ADM-PROB-04 Enable and disable problem

**Purpose:** Verify status changes preserve selections and availability rules.

**Preconditions:** Existing problem, including one locked problem for the preservation check.

**Request:** ADMIN_DISABLE_PROBLEM and ADMIN_ENABLE_PROBLEM.

**Expected response:** Success with the requested status.

**Expected Google Sheet change:** Only the Problems `Status` cell changes. Existing Selections rows remain. A locked problem remains unavailable even after re-enable.

**Cleanup required:** Restore original status.

## Admin domain operations

### ADM-DOM-01 Update domain capacity and status

**Purpose:** Verify domain configuration validation and utilization semantics.

**Preconditions:** Existing domain and active admin token.

**Request:** ADMIN_UPDATE_DOMAIN with domainId, domainName, positive maximumTeams, and `ACTIVE` or `DISABLED` status.

**Expected response:** Success with the domainId.

**Expected Google Sheet change:** Existing domain row updates. DomainID is unchanged.

**Cleanup required:** Restore original domain values.

### ADM-DOM-02 Invalid capacity

**Purpose:** Confirm zero, negative, or non-integer capacity is rejected.

**Preconditions:** Active admin.

**Request:** ADMIN_UPDATE_DOMAIN with `maximumTeams = 0`, `-1`, or a non-integer string.

**Expected response:** `INVALID_DOMAIN_DATA`.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

### ADM-DOM-03 Capacity below current locked count

**Purpose:** Verify existing selections are not removed when capacity is lowered.

**Preconditions:** Domain with known locked count `N`; choose a positive maximum less than `N`.

**Request:** ADMIN_UPDATE_DOMAIN with the lower capacity.

**Expected response:** Success.

**Expected Google Sheet change:** MaximumTeams is lowered; Selections rows remain unchanged.

**Follow-up:** `GET_DOMAINS` reports remaining capacity zero and `SELECT_PROBLEM` for that domain returns `DOMAIN_CAPACITY_REACHED`.

**Cleanup required:** Restore original capacity.

## Admin configuration controls

### ADM-CONFIG-01 ADMIN_RELEASE_NOW

**Purpose:** Verify immediate global problem release.

**Preconditions:** Future scheduled release; active admin.

**Request:** ADMIN_RELEASE_NOW.

**Expected response:** Success with `problemsReleased = true`.

**Expected Google Sheet change:** Config key `ProblemReleaseOverride` becomes `TRUE`.

**Cleanup required:** Manually restore/remove the override and restore original release keys.

### ADM-CONFIG-02 ADMIN_CLOSE_SELECTION

**Purpose:** Verify selection closure.

**Preconditions:** Active admin; record original SelectionStatus.

**Request:** ADMIN_CLOSE_SELECTION.

**Expected response:** Success with `selectionStatus = CLOSED`.

**Expected Google Sheet change:** Config `SelectionStatus` becomes `CLOSED`; existing locked rows remain.

**Cleanup required:** Run ADMIN_OPEN_SELECTION or restore the original value.

### ADM-CONFIG-03 ADMIN_OPEN_SELECTION

**Purpose:** Verify reopening selection does not bypass release scheduling.

**Preconditions:** Active admin; selection currently closed; scheduled release still in the future and override not active.

**Request:** ADMIN_OPEN_SELECTION.

**Expected response:** Success with `selectionStatus = OPEN`.

**Expected Google Sheet change:** Config `SelectionStatus` becomes `OPEN`.

**Follow-up:** GET_PROBLEMS and SELECT_PROBLEM must still return `PROBLEMS_NOT_RELEASED` until release.

**Cleanup required:** Restore original selection/release values.

## Security tests

### SEC-01 Participant attempts an admin action

**Purpose:** Confirm frontend route protection is not the authorization boundary.

**Preconditions:** Valid college participant token not active in Admins.

**Request:** `ADMIN_GET_STATS` with the participant token.

**Expected response:** `ADMIN_NOT_FOUND`, `ADMIN_DISABLED`, or `ADMIN_REQUIRED` according to Admins sheet state. No statistics are returned.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

### SEC-02 Spoofed email during registration

**Purpose:** Confirm the request cannot choose LeaderEmail.

**Preconditions:** Valid college team-leader token; use a different email in `data.leaderEmail`.

**Request:** REGISTER_TEAM with `leaderEmail = attacker@example.com`.

**Expected response:** Success if all other data is valid, or the relevant validation failure.

**Expected Google Sheet change:** If successful, `Teams.LeaderEmail` equals the verified token email, not the request field.

**Cleanup required:** Delete the test row.

### SEC-03 Spoofed TeamID during selection

**Purpose:** Confirm SELECT_PROBLEM ignores client TeamID authorization data.

**Preconditions:** Active leader token for Team A and available problem. Team B exists.

**Request:** Include an extra `teamId` field set to Team B in SELECT_PROBLEM data.

**Expected response:** Success or normal selection error based on Team A state; it must not act as Team B.

**Expected Google Sheet change:** Any new row uses Team A's TeamID derived from the verified email.

**Cleanup required:** Remove isolated selection row.

### SEC-04 Spoofed role

**Purpose:** Confirm `role: ADMIN` does not grant admin access.

**Preconditions:** Valid participant token not active in Admins.

**Request:**

```json
{
  "action": "ADMIN_GET_STATS",
  "idToken": "PARTICIPANT_TOKEN",
  "role": "ADMIN"
}
```

**Expected response:** Admin authorization failure. No stats.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

### SEC-05 Retrieve another team's selection

**Purpose:** Confirm GET_MY_SELECTION is identity-derived and cannot accept an arbitrary TeamID.

**Preconditions:** Team A and Team B, with a locked selection for Team B; Team A leader token.

**Request:** GET_MY_SELECTION with Team A token and optional arbitrary data TeamID set to Team B.

**Expected response:** Team A's selection, or `hasSelection = false`; never Team B's selection.

**Expected Google Sheet change:** None.

**Cleanup required:** None.

### SEC-06 Select using another team's TeamID

**Purpose:** Confirm SELECT_PROBLEM cannot authorize from a supplied TeamID.

**Preconditions:** Team A token, Team B ID, available problem.

**Request:** SELECT_PROBLEM with an extra TeamID field set to Team B.

**Expected response:** Normal Team A result/error; no Team B authorization.

**Expected Google Sheet change:** Any row uses Team A's verified-team identity.

**Cleanup required:** Remove isolated selection row.

### SEC-07 Access unreleased problem content

**Purpose:** Confirm participant callers cannot obtain unreleased PSID or content.

**Preconditions:** Future release, override absent/false, active team leader.

**Request:** GET_PROBLEMS for a valid domain; also try guessed PSIDs through SELECT_PROBLEM.

**Expected response:** GET_PROBLEMS returns `PROBLEMS_NOT_RELEASED` with no problem data. SELECT_PROBLEM also returns `PROBLEMS_NOT_RELEASED` before any problem is written.

**Expected Google Sheet change:** None.

**Cleanup required:** Restore release Config values.

## Concurrency tests

### CON-01 Same PSID selected simultaneously

**Purpose:** Verify the selection transaction lock prevents two teams from locking one PSID.

**Preconditions:**

- Deployed Web App is running the current version.
- Two separate active team leaders, Team A and Team B.
- Selection is open and problems are released.
- Same active, unlocked PSID in an active domain with capacity for at least one team.
- Both teams have no locked selection.

**Procedure:**

1. Prepare two independent request bodies with the same `domainId` and `psId`, but different valid leader tokens.
2. Launch the two HTTP POST requests as close together as possible from separate processes, terminals, or a script that starts two asynchronous requests without awaiting the first.
3. Record response timestamps, status bodies, and request IDs if the client adds its own correlation identifier.
4. Read the Selections sheet after both responses arrive.

**Expected response:** Exactly one request succeeds with `status = LOCKED`. The other fails with `PROBLEM_ALREADY_LOCKED`.

**Expected Google Sheet change:** Exactly one new `LOCKED` row for the PSID. No duplicate locked PSID rows.

**Cleanup required:** Remove the isolated locked row and restore both test teams' selection state.

### CON-02 Final domain capacity slot selected simultaneously

**Purpose:** Verify two teams cannot consume the same final domain capacity slot.

**Preconditions:**

- Domain MaximumTeams is `N`.
- Exactly `N - 1` locked selections already exist in the domain.
- Two active teams without selections.
- Two different active unlocked problems in the same domain.
- Selection open and problems released.

**Procedure:**

1. Prepare two simultaneous SELECT_PROBLEM requests for different PSIDs in the same domain.
2. Send them concurrently from separate clients/processes.
3. Inspect both response bodies and the Selections sheet.

**Expected response:** Exactly one request succeeds. The other returns `DOMAIN_CAPACITY_REACHED`.

**Expected Google Sheet change:** The domain ends with exactly `N` locked selections, not `N + 1`.

**Cleanup required:** Remove only isolated test selections and restore the original domain capacity.

### CON-03 Team registration race smoke test

**Purpose:** Confirm the existing atomic registration boundary does not duplicate TeamID or register numbers under simultaneous requests.

**Preconditions:** Two valid unique registrations; isolated spreadsheet; no overlapping emails/register numbers.

**Procedure:** Send two REGISTER_TEAM requests concurrently.

**Expected response:** Both may succeed if their data is unique. Their TeamIDs must be different.

**Expected Google Sheet change:** Two rows with unique TeamIDs and no cross-team register-number collision.

**Cleanup required:** Delete both isolated test rows.

## Cleanup and rollback checklist

After mutation tests in the isolated spreadsheet:

1. Delete all rows whose IDs/names use the runtime test prefix.
2. Remove test `LOCKED` and `CANCELLED` selection rows.
3. Restore original team statuses.
4. Restore original problem statuses and domains.
5. Restore original domain capacities and statuses.
6. Restore `SelectionStatus`.
7. Restore or remove `ProblemReleaseOverride`.
8. Restore `ProblemReleaseDate`, `ProblemReleaseTime`, and `HackathonStatus`.
9. Restore test Admins rows or delete only test admin fixtures.
10. Run `testBackend()` from Apps Script and confirm all six sheets still exist.
11. Re-run `ADMIN_GET_STATS` and verify no test counts remain.

Do not delete the existing `BIT-AI-001` or `BIT-AI-002` rows blindly. Identify their ownership and confirm whether they are test data before cleanup.

## Implementation issues discovered during preparation

These are existing behavior notes, not changes made in Step 7:

- Participant authorization is leader-only because the Teams schema has `LeaderEmail` but no member-email columns.
- Participant team-validation exceptions can be returned as `INTERNAL_ERROR` rather than specific validation codes.
- `ADMIN_RELEASE_NOW` persists `ProblemReleaseOverride = TRUE`; there is no API to reset it.
- `ADMIN_GET_PROBLEMS` intentionally returns disabled and unreleased problem content to authorized admins, unlike participant `GET_PROBLEMS`.
- Admin team updates currently require the full team data payload; omitted members become an empty member list through the current implementation.
- `getSpreadsheet()` uses `SpreadsheetApp.getActiveSpreadsheet()`. The deployed script must remain bound to or otherwise have an active spreadsheet context containing the expected sheets.
- Runtime concurrency behavior has not been empirically verified in this environment.

## Completion criteria

The backend is ready for runtime testing when:

- The Web App deployment URL is available.
- All six Sheets tabs and exact headers exist.
- Config values are recorded and controlled.
- Test and admin identities are available.
- The test spreadsheet is isolated or a cleanup owner is assigned.
- Every pending test above has a recorded request, response, sheet observation, and cleanup result.

This document is a preparation plan only. It does not certify that the backend passed runtime tests.
