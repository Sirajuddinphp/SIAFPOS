expect(
  db
    .prepare(
      "SELECT COUNT(*) AS count FROM migration_history"
    )
    .get()
).toEqual({ count: 23 });