# Corps de PR pré-rédigés

L’agent (ou le dev) rédige ici le markdown complet **avant** `gh pr create`, puis :

```powershell
.\scripts\create-pr.ps1 `
  -Title "feat(ticket): résumé court" `
  -BodyFile ".github/pr-bodies/mon-ticket.md"
```

Convention de nommage : `{ticket-id}-{slug}.md` (ex. `p5-06-in-app-feedback.md`).

Ne pas coller la description à la main sur GitHub — le script utilise `--body-file`.
