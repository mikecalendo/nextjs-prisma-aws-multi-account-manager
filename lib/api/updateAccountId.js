function updateAccountId(doc, accountId) {
    if (!doc.Statement) return;
    doc.Statement.forEach((stmt) => {
      if (Array.isArray(stmt.Resource)) {
        stmt.Resource = stmt.Resource.map((res) =>
          res.replace('<ACCOUNT_ID>', accountId)
        );
      }
    });
  }
  