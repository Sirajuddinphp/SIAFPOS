setPriority(
  kotUuid: string,
  priority: number
): KotTicketDetail {
  if (![0, 1, 2].includes(priority)) {
    throw new Error("INVALID_KOT_PRIORITY");
  }

  const existing = this.repository.getDetail(kotUuid);

  if (!existing) {
    throw new Error("KOT_NOT_FOUND");
  }

  if (existing.status === "completed") {
    throw new Error("KOT_ALREADY_COMPLETED");
  }

  this.repository.updatePriority(kotUuid, priority);

  const updated = this.repository.getDetail(kotUuid);

  if (!updated) {
    throw new Error("KOT_NOT_FOUND");
  }

  return updated;
}

setStation(
  kotUuid: string,
  stationCode: string | null
): KotTicketDetail {
  const existing = this.repository.getDetail(kotUuid);

  if (!existing) {
    throw new Error("KOT_NOT_FOUND");
  }

  if (existing.status === "completed") {
    throw new Error("KOT_ALREADY_COMPLETED");
  }

  const normalizedStationCode =
    stationCode?.trim().toUpperCase() || null;

  this.repository.updateStation(
    kotUuid,
    normalizedStationCode
  );

  const updated = this.repository.getDetail(kotUuid);

  if (!updated) {
    throw new Error("KOT_NOT_FOUND");
  }

  return updated;
}

listActive(
  stationCode?: string | null
): KotTicketSummary[] {
  return this.repository.listActiveTickets(
    stationCode?.trim().toUpperCase() || null
  );
}