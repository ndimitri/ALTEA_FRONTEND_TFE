Set-Location "C:\Users\Admin\Downloads\ALTEA_Projects\altea-frontend"
$env:GH_TOKEN = "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"
$gh = "C:\Program Files\GitHub CLI\gh.exe"
$repo = "ndimitri/ALTEA_FRONTEND_TFE"

# ── S'assurer qu'on est sur le bon commit de base ──────────────────
Write-Host "[1/3] Reset vers origin/main..."
git reset --soft 8ca7423
git stash  # stash temporaire si besoin

$head = git rev-parse HEAD
Write-Host "HEAD = $head"

# ── Dépiler le stash ──────────────────────────────────────────────
git stash pop 2>$null

# ── Créer les commits proprement sans le fichier script ───────────
Write-Host "`n=== COMMIT 1 : skeleton ==="
git add src/app/shared/components/skeleton/skeleton.component.ts
git commit -m "feat: add reusable skeleton loader component

Composant SkeletonComponent avec props height, width, className.
Utilise dans dashboard, patients, planning, patient-detail.
Closes #1"

Write-Host "`n=== COMMIT 2 : modules ==="
git add src/app/features/modules/modules.component.ts
git add src/app/features/modules/modules.component.html
git add src/app/features/modules/modules.component.scss
git add src/app/app.component.ts
git add src/app/app.routes.ts
git commit -m "feat: add modules management page and dynamic navbar links

- Page /modules : liste des modules avec toggle ON/OFF
- ModuleService : getModules(), activate(), deactivate()
- Navbar : liens dynamiques par module actif avec icone/label
- Modele Module avec activeForUser
Closes #17"

Write-Host "`n=== COMMIT 3 : module landing page ==="
git add src/app/features/modules/module-detail/module-detail.component.ts
git add src/app/features/modules/module-detail/module-detail.component.html
git add src/app/features/modules/module-detail/module-detail.component.scss
git commit -m "feat: add module landing page with dynamic route /modules/:nom

- Hero colore par module avec gradient CSS
- paramMap.subscribe pour navigation sans rechargement composant
- Sections : features, acces rapide, templates, bientot
- 4 modules : INFIRMIERE, PEDICURE, KINE, AIDE_SOIGNANT
Closes #18"

Write-Host "`n=== COMMIT 4 : templates par module ==="
git add src/app/core/services/api.services.ts
git add src/app/core/models/models.ts
git commit -m "feat: add getByModule and getByModuleWithPersonnels to SoinTemplateService

- GET /soin-templates/module/{id} : templates globaux
- GET /soin-templates/module/{id}/all : globaux + personnels
- Champ global?: boolean dans SoinTemplate
- RendezVousService.getByPatient() ajoute
Closes #19"

Write-Host "`n=== COMMIT 5 : soins dans planning ==="
git add src/app/features/planning/planning.component.ts
git add src/app/features/planning/planning.component.html
git commit -m "feat: add soin management and RDV edit in planning detail panel

- Soins : liste, ajout (existant|nouveau via template), suppression
- Fix doublon : envoi id soin existant dans payload
- Edit RDV : formulaire inline avec tous les champs + autocomplete lieu
- Refonte UI : hero colore, layout flex-row lg, mode lecture/edition
Closes #20 Closes #21 Closes #22"

Write-Host "`n=== COMMIT 6 : dashboard ==="
git add src/app/features/dashboard/dashboard.component.ts
git add src/app/features/dashboard/dashboard.component.html
git commit -m "feat: improve dashboard - clickable RDV modal and soin chips

- RDV cliquables -> modal centree (bandeau couleur, soins, horaire)
- Redesign liste : barre coloree laterale, chips soins bleues
- weekRdvCount filtre sur statut PLANIFIE uniquement
- getSoinsForRdv(id) helper type-safe
Closes #23 Closes #24"

Write-Host "`n=== COMMIT 7 : patient-detail ==="
git add src/app/features/patients/patient-detail/patient-detail.component.ts
git add src/app/features/patients/patient-detail/patient-detail.component.html
git add src/app/app.config.ts
git commit -m "feat: patient-detail - soin edit, RDV history with filters, fr-FR locale

- Soins cliquables -> modal edition (PUT /soins/:id)
- Onglet Rendez-vous : historique via GET /rendezvous/patient/:id
- Filtres multi-selection par statut (tags + groupes visuels)
- Chips soins bleues dans chaque carte RDV
- LOCALE_ID fr-FR + registerLocaleData -> dates en francais partout
- getSoinsForRdv() helper type-safe
Closes #25 Closes #26 Closes #27"

Write-Host "`n=== COMMIT 8 : fichiers restants ==="
git add src/app/features/map/map.component.ts
git add src/app/features/map/map.component.html
git add src/app/features/patients/patient-list/patient-list.component.ts
git add src/app/features/patients/patient-list/patient-list.component.html
$remaining = git diff --cached --name-only
if ($remaining) {
  git commit -m "refactor: misc improvements to map and patient-list components"
}

Write-Host "`n=== LOG ==="
git log --oneline -10

Write-Host "`n=== PUSH ==="
git push origin main --force 2>&1

Write-Host "`n=== DONE ==="

