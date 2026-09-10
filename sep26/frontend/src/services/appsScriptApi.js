import * as localMockApi from "./localMockApi";

const useLocalMock = import.meta.env.DEV;

function getAppsScriptRunner() {
  const runner = window.google && window.google.script && window.google.script.run;

  if (!runner) {
    const error = new Error(
      "Apps Script communication is available only when served by Apps Script HTML Service."
    );
    error.code = "APPS_SCRIPT_UNAVAILABLE";
    throw error;
  }

  return runner;
}

function callAppsScript(functionName, ...args) {
  return new Promise((resolve, reject) => {
    let runner;

    try {
      runner = getAppsScriptRunner();
    } catch (error) {
      reject(error);
      return;
    }

    runner
      .withSuccessHandler(resolve)
      .withFailureHandler((error) => {
        const transportError = new Error(
          error && error.message
            ? error.message
            : "Unable to reach the Apps Script backend."
        );
        transportError.code = "APPS_SCRIPT_REQUEST_FAILED";
        reject(transportError);
      })[functionName](...args);
  });
}

function callApi(functionName, ...args) {
  const hasAppsScriptRunner = Boolean(
    typeof window !== "undefined" &&
    window.google &&
    window.google.script &&
    window.google.script.run
  );

  if (useLocalMock && !hasAppsScriptRunner) {
    return localMockApi[functionName](...args);
  }

  return callAppsScript(functionName, ...args);
}

export function apiRegisterTeam(idToken, data) {
  return callApi("apiRegisterTeam", idToken, data);
}

export function apiGetDomains(idToken) {
  return callApi("apiGetDomains", idToken);
}

export function apiSelectDomain(idToken, domainId) {
  return callApi("apiSelectDomain", idToken, domainId);
}

export function apiGetProblems(idToken, data) {
  return callApi("apiGetProblems", idToken, data);
}

export function apiSelectProblem(idToken, data) {
  return callApi("apiSelectProblem", idToken, data);
}

export function apiGetMySelection(idToken) {
  return callApi("apiGetMySelection", idToken);
}

export function apiAdminGetStats(idToken) {
  return callApi("apiAdminGetStats", idToken);
}

export function apiAdminGetTeams(idToken, data) {
  return callApi("apiAdminGetTeams", idToken, data);
}

export function apiAdminAddTeam(idToken, data) {
  return callApi("apiAdminAddTeam", idToken, data);
}

export function apiAdminUpdateTeam(idToken, data) {
  return callApi("apiAdminUpdateTeam", idToken, data);
}

export function apiAdminEnableTeam(idToken, data) {
  return callApi("apiAdminEnableTeam", idToken, data);
}

export function apiAdminDisableTeam(idToken, data) {
  return callApi("apiAdminDisableTeam", idToken, data);
}

export function apiAdminGetProblems(idToken) {
  return callApi("apiAdminGetProblems", idToken);
}

export function apiAdminAddProblem(idToken, data) {
  return callApi("apiAdminAddProblem", idToken, data);
}

export function apiAdminUpdateProblem(idToken, data) {
  return callApi("apiAdminUpdateProblem", idToken, data);
}

export function apiAdminEnableProblem(idToken, data) {
  return callApi("apiAdminEnableProblem", idToken, data);
}

export function apiAdminDisableProblem(idToken, data) {
  return callApi("apiAdminDisableProblem", idToken, data);
}

export function apiAdminGetDomains(idToken) {
  return callApi("apiAdminGetDomains", idToken);
}

export function apiAdminUpdateDomain(idToken, data) {
  return callApi("apiAdminUpdateDomain", idToken, data);
}

export function apiAdminReleaseNow(idToken) {
  return callApi("apiAdminReleaseNow", idToken);
}

export function apiAdminCloseSelection(idToken) {
  return callApi("apiAdminCloseSelection", idToken);
}

export function apiAdminOpenSelection(idToken) {
  return callApi("apiAdminOpenSelection", idToken);
}
