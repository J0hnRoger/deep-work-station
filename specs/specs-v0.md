# PRD — Deep Work Station (SPA React)
Version: 1.0 — Portée POC mono-utilisateur

0. Résumé exécutif

Deep Work Station est une SPA React/TypeScript/Vite déployée sur k3s via ArgoCD (VPS).
Objectif : favoriser le focus en combinant une playlist de sons + timer + raccord WakaTime + gamification R3F (forêt enchantée).

Trois phases :

- Deep Work Sound — lecteur audio (MP3) + timer Pomodoro, stockage local.
- Time Tracker — .NET 9 BFF + Redis + WakaTime API pour rapprocher le temps d’activité et les sessions de focus ; journal & stats.
- Gamification — React Three Fiber : une forêt qui « pousse » au fil des sessions.

## 1. Objectifs & KPIs

- Démarrer une session < 1 s via Ctrl+K → « Start 50m/10m ».
- Gapless + crossfade propres entre pistes ; absence de “clicks/pops”.
- 90 % des actions réalisables sans souris.
- Scène R3F 60 fps sur laptop standard (iGPU)

## 2. Hors périmètre (v1)
Multi-utilisateurs, paiement, comptes, recommandations ML, mobile natif, Tauri.

## 3. Personas & parcours
Power user PC, clavier-centric.
Parcours clé : ouvrir l’app → pop-up pseudo (1ère visite) → Ctrl+K → « Start 50m (Deep Work) » → lecture audio → fin de session → (option) renseigner projet/renommer → journal → (phase 2) rapprochement WakaTime.

## 4. Fonctionnalités par phase

### Phase 1 — Deep Work Sound (SPA seule)
- Audio
    - Formats : mp3 (44.1kHz).
    - Gapless : lecture via Web Audio API (buffer source) avec pré-buffer de la piste suivante + transition sample-accurate.
    - Crossfade (configurable, défaut 3s) + fade-in/out (20–50 ms) pour éviter les artefacts.
    - EQ simple (BiquadFilterNode) avec presets (Neutral/Light/Boost).
    - Streaming simple (HTTP), sans adaptation pour l’instant.

- Sources audio
    - Option A (préférée) : lien SharePoint “Anyone” (anonyme).
    - Option B : Azure Blob Storage (public read) si “Anyone” indisponible.
- Timer
    Modes : 50/10, 25/5, custom.
    Auto-pause optionnelle si onglet inactif > N min ; reprise manuelle.

- Sessions créées même sans projet/task (nom défaut : YYYY-MM-DD HH:mm Deep Work).
- Stockage local
    - localStorage : préférences (volume, EQ, crossfade), dernières pistes, sessions P1.
- CLI/Palette (Ctrl+K)
    Commandes : start 50, pause, resume, stop, next, prev, volume 30, eq neutral|light|boost, project set <name>, rename <text>, pomodoro 50/10.
    - Palette type VS Code (fuzzy, aide ?).
- UX
    Écran unique (lecteur centré + minuterie).: cf "specs/maquettes/home"
    Pop-up pseudo à la 1ère visite (stocké localement).
    Image "SplashScreen" ou future scene 3D (toggle bloqué pour l'instant) - trouver un service de splashscreen en ligne pour voir des images adaptées (focus/nature/apaisante/chill)

### Phase 2 — Time Tracker (BFF .NET 9 + Redis + WakaTime)
- Backend
    .NET 9 Minimal API (Kestrel), Redis (Bitnami).
    Sécurité POC : header X-API-Key (SealedSecret/ArgoCD). Pas de comptes utilisateurs.

    Endpoints (draft) :
GET /api/health
GET /api/tracks → liste des URLs MP3 (SharePoint/Azure Blob).
POST /api/sessions, PATCH /sessions/{id}, GET /sessions?from&to&project, GET /sessions/export.csv
GET /api/projects, POST /projects (min)
GET /api/wakatime/summary?from&to (proxy WakaTime)
POST /api/settings/wakatime-key (écrit en redis/associé au pseudo)

- Rapprochement WakaTime ⟷ Sessions
    - Base sur Projet (inspiration TaskWarrior pour la nomenclature).

- Stratégie : pour chaque session, cherche la fenêtre dominante côté WakaTime (overlap ±X min, défaut 10).

Si présent : associe session.project = wakatime.project.

Historisation : source = 'manual' | 'wakatime-merge'.
Persistance
Redis : dws:sessions:{id} (hash), index dws:sessions:byDate, dws:projects.
TTL : infini (journal à vie).
Vues/statistiques
Journal (jour/semaine/mois), totaux par projet, tendance 4 semaines, export CSV.

- Ergonomie
    Édition post-session (projet/titre), complétion fuzzy des projets.

### Phase 3 — Gamification (React Three Fiber)

- Forêt enchantée (remplace la splash et agit comme “dashboard visuel”).
1 session réussie = 1 pousse. Raretés selon durée.

- Actifs glTF/GLB (assets open source à sourcer), instanced meshes, frustum culling.
- Plugin system : API interne pour ajouter un “biome” (ex : lac, clairière).

## 5. Contraintes & risques

- SharePoint anonyme : dépend du paramétrage tenant (“Anyone links”). 
- Autoplay : certaines plateformes mobiles bloquent l’audio sans interaction ; desktop prioritaire.
- Gapless : nécessite buffering + planification par Web Audio API ; test multi-navigateurs.
- Fusion WakaTime : mapping simple au début (par projet), puis règles avancées si besoin.

## 6. Architecture & Stack

Frontend
- React 18 / TS / Vite
- State : Zustand ; I/O : TanStack Query.
- Audio : Web Audio API (nodes : BufferSource, Gain, BiquadFilter) + <audio> fallback.

- UI : palette Ctrl+K (cmdk ou maison), raccourcis globaux, A11y.

Backend
- .NET 9 Minimal API, Redis ⇒ StackExchange.Redis côté .NET.

WakaTime : clé API en SealedSecret, appels sortants serveur-side only.

Logs : Serilog (console/JSON).
CORS : un reverse-proxy Traeffik en edge (ingress) pour router les appels à /api vers mon backend 

Données (types)

```ts
type Session = {
  id: string
  start: string // ISO
  end?: string
  durationSec?: number
  project?: string | null
  tags?: string[]
  title: string // ex: "Deep Work" si orpheline
  source: 'manual' | 'wakatime-merge'
  quality?: 'low'|'mid'|'high'
}

type Project = { id: string; name: string }

type User = { pseudo: string } // localStorage seulement (POC)
```

7. UX/UI (écran unique)

Header : sélecteur playlist (Deep Work, Night, etc.).
Centre : minuteur XXL, bouton mode Pomodoro (50 Min Timer), commandes de transport.
Bas : palette Ctrl+K (apparition type terminal).
Pop-up pseudo : modale obligatoire à la 1ère visite, puis non intrusive.
Indicateurs : streak semaine, volume, EQ.

8. Commandes (palette/CLI) — v1
Session : start [25|50|custom], pause, resume, stop, rename <txt>
Audio : next, prev, volume <0-100>, eq <neutral|light|boost>
Projet : project set <name>, project new <name>
Timer : pomodoro 50/10
Stats : stats today|week|month

Admin (phase 2) : wakatime link (stocké côté serveur)

9. Déploiement & Ops (k3s + ArgoCD)
CI/CD
Build images (frontend + bff) → GHCR. (pour l'instant, uniquement le frontend, sur du Nginx)
Manifests Kustomize (base + overlays dev/prod pour tilt en local, avec k3d).
ArgoCD sync auto (prune & self-heal).

Réseau

Traefik (Ingress) + Let’s Encrypt (TLS).

Secrets
SealedSecrets : API_KEY, WAKATIME_API_KEY, REDIS_PASSWORD.

Redis
Chart bitnami/redis (standalone POC), persistence activée.

Probes
Front : GET / (200).
BFF : GET /api/_health (200, ping Redis OK).


12. Squelette de repos (proposé)

deep-work-station/
  frontend/
    src/
      audio/            # wrappers Web Audio (gapless, crossfade, EQ)
      components/
      features/
        sessions/
        player/
        command-palette/
      pages/App.tsx
      store/            # zustand
      api/              # react-query hooks
      styles/
    public/
    vite.config.ts
    package.json
  bff/
    Program.cs          # .NET 9 Minimal API
    Endpoints/          # Sessions, Projects, WakaTime, Tracks
    Services/
      RedisService.cs
      WakaTimeClient.cs
      TracksService.cs  # SharePoint/Azure Blob list
    appsettings.json
    Dockerfile
  deploy/
    kustomize/
      base/
        frontend-deployment.yaml
        bff-deployment.yaml
        redis.yaml
        ingress.yaml
      overlays/
        prod/
          kustomization.yaml
          sealedsecrets.yaml
  .github/workflows/
    ci.yml

13. Notes d’implémentation (audio)

Gapless : décoder la piste (AudioContext.decodeAudioData), calculer le crossfade avec deux BufferSource superposés (A sort, B entre) ; utiliser GainNode avec ramps linéaires (setValueAtTime, linearRampToValueAtTime).

Crossfade : défaut 3s ; clamp min 0.5s, max 10s.

EQ : 1 à 3 BiquadFilterNode(s) (low-shelf + peaking) — presets constants.

Préchargement : lancer le fetch N+1 à T-(crossfade + marge).

iOS/Chrome policies : démarrer audio seulement après une interaction utilisateur.

14. Critères d’acceptation (récap)

Lancer une session de 50 min via Ctrl+K et entendre la piste en <1 s.
Transition gapless/crossfade propre entre deux pistes.
Session enregistrée même sans projet (nom par défaut) et visible dans le journal.

(P2) Import WakaTime : total semaine ≈ total focus (écart ≤ 5 min, réglable).
(P3) Une nouvelle pousse est affichée après chaque session>N min ; scène 60 fps.

Prochaines étapes
- Valider la source audio (SharePoint “Anyone” ou Azure Blob).
Lien de la source des audios : https://jrogera5sys.sharepoint.com/:f:/s/DeepWorkStation/Eh3949Wtrg1Il0OEZktyT-4BpbXEPMl9ezyM7G79n10dww?e=UbQp02 

- Domaine cible: `deepwork.codincloud.net` pour préparer les manifests kustomize/ingress.