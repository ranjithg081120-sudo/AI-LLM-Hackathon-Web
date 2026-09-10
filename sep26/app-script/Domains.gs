function getDomainById(domainId) {
  const normalizedDomainId = String(domainId || "").trim().toUpperCase();
  const domains = getSheetRecords(SHEET_NAMES.DOMAINS);

  for (let i = 0; i < domains.length; i++) {
    if (String(domains[i].DomainID).trim().toUpperCase() === normalizedDomainId) {
      return domains[i];
    }
  }

  return null;
}


function getActiveDomains() {
  return getSheetRecords(SHEET_NAMES.DOMAINS).filter(function(domain) {
    return String(domain.Status).trim().toUpperCase() === DOMAIN_STATUS.ACTIVE;
  });
}


function getLockedSelectionCountByDomain(domainId) {
  const normalizedDomainId = String(domainId || "").trim().toUpperCase();

  return getSheetRecords(SHEET_NAMES.SELECTIONS).filter(function(selection) {
    return String(selection.DomainID).trim().toUpperCase() === normalizedDomainId &&
      String(selection.Status).trim().toUpperCase() === SELECTION_STATUS.LOCKED;
  }).length;
}


function getParticipantDomains(idToken) {
  requireTeamLeader(idToken);

  return getActiveDomains().map(function(domain) {
    const maximumTeams = parsePositiveInteger(domain.MaximumTeams);
    const currentLockedTeams = getLockedSelectionCountByDomain(domain.DomainID);
    const remainingCapacity = Math.max(maximumTeams - currentLockedTeams, 0);

    return {
      domainId: String(domain.DomainID).trim().toUpperCase(),
      domainName: String(domain.DomainName || "").trim(),
      maximumTeams: maximumTeams,
      currentLockedTeams: currentLockedTeams,
      remainingCapacity: remainingCapacity,
      available: remainingCapacity > 0
    };
  });
}


function parsePositiveInteger(value) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : 0;
}