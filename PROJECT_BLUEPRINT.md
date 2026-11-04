# CampusCode completion blueprint

## Implementation progress — 4 November 2026

### College demo payments — 5 November 2026

- Scope adjusted to the college website: no real provider integration is required for this demonstration. Earlier payment-unavailable notes below describe the previous state.
- Added explicit demo checkout outcomes, server-owned product prices, durable order history, completed-purchase delivery access, and saved price/license/source snapshots. Removed locally fabricated downloads and payment credential forms.
- A separate demo wallet records seller credits after a 10% simulated fee and balance-checked payouts. Unique operation/entitlement keys and transactions prevent duplicate sales and overspending. Legacy unmarked orders do not grant demo access.
- Purchases is available to students and clients; Demo Earnings and dashboard summaries use recorded transactions rather than sample charts or inferred earnings.
- Marketplace purchase/payment HTTP and real database concurrency checks added. Contract funding/release remains unimplemented; commissioned-work milestones continue to track delivery and approval. Recovery UI completion and a browser walkthrough remain outstanding.

### Core commissioned-work flow — 5 November 2026

- Traced and repaired client requirement -> student proposal -> acceptance -> shared project -> milestone delivery/revision/approval -> completed requirement -> contract review.
- Requirement creation is client-only, validates the brief, explicit budgets and future deadlines, and no longer invents default financial values. Open requirements with no proposals may be edited; closing preserves records instead of deleting proposal/contract references.
- Proposal submission and its requirement counter now commit together in a transaction. A unique sparse submission key protects new proposals; legacy proposals are checked as well. One student can submit one proposal per requirement. Invalid terms and duplicate submissions produce explicit errors.
- Proposal DTOs consistently separate student/request IDs from populated display data. Client inbox queries no longer apply a student-only filter. Project lists include projects where the actor is a member, including the workspace generated for a client's accepted contract.
- Posting redirects to the saved requirement. Proposal screens show the correct requirement/student, prevent repeat submission and acceptance of non-pending bids, report acceptance errors, and support messaging with the correct participant. Contract detail links to the project workspace. Status displays no longer label completed requirements as in-progress.
- Added a real authenticated HTTP journey in the disposable replica-set suite. It verifies role restrictions, invalid budgets, duplicate bids, bid privacy, client inbox data, unauthorized acceptance, linked workspace access, owner-only task changes, durable task progress, revisions, contract/requirement completion, and review receipt.
- Frontend build/helper checks and server checks pass. Browser automation remains outstanding; payments are still unavailable. This establishes the delivery-management core through HTTP, not a complete funded marketplace or a fully verified browser release.

### Recovery work in progress when automatic continuation was cleared — 5 November 2026

- Added preliminary backend AccountToken/MailJob models, hashed token redemption, encrypted queued SMTP delivery with retries, and database-backed limits for account endpoints. SMTP settings and the mail encryption key are documented in `.env.example`; delivery remains unavailable unless configured.
- New registrations no longer automatically claim verified email ownership. Existing stored verification flags were not migrated.
- Forgot Password now requests the backend and displays actual failures/generic queued-response text rather than immediate fake success. Its incomplete form markup was repaired before stopping.
- This recovery increment is NOT complete: Reset Password still needs its real form/API wiring, a Verify Email page and resend UI are missing, verified-email permissions are not enforced yet, and token/outbox/SMTP behavior needs dedicated unit/integration/local-mail tests. No real email was sent during this work.
- Existing builds/regression/integration checks were rerun as a cleanup check; they do not cover the newly added recovery paths. Resume from this section rather than treating recovery as finished.

### Revocable sessions and password changes — 5 November 2026

- JWTs now reference a stored, expiring Session record. Required and optional authentication verify that record, its expiry/revocation, the current user, and an account authentication version. Old JWTs without session identifiers are intentionally rejected, so users must sign in again after adopting this update.
- Logout revokes the current server session. Sign Out Everywhere increments the account version, invalidating all earlier sessions. Password change verifies the existing password and atomically changes the hash/increments that version; concurrent password changes use a hash condition to avoid stale overwrites.
- Settings now has working password/confirmation inputs and Sign Out Everywhere. Failed server revocation is reported rather than claiming a secure logout. The API helper notifies the auth provider on local 401 responses; transient 503 failures do not discard stored credentials. Cross-tab logout clears the other tab's visible account state.
- New password rules require at least eight characters and at most 72 UTF-8 bytes to avoid bcrypt truncation. Registration validates email format. User JSON omits the password, auth version and GitHub access token. Removed the unused frontend demo-login method; the endpoint remains disabled.
- Both builds pass. Standard server checks: 43; frontend helper checks: two. Eight real replica-set scenarios pass (nine test-runner entries including the parent), now including registration/login, single-session logout, wrong-current-password refusal, password-change invalidation, old-password refusal, logout-all and legacy-token refusal through actual HTTP requests.

Remaining identity work: email verification and single-use password recovery, provider configuration, rate limiting, stronger deployment-secret policy, session/device listing, cookie-session/CSRF design review, and full browser verification. Token storage remains localStorage during this implementation stage.

### Real database verification and CI — 5 November 2026

- Added a separate `npm run test:integration` command using `mongodb-memory-server-core` and an actual disposable MongoDB 7.0.24 replica set. The suite generates its own loopback URI/database, never uses the configured project database, and awaits disconnect/shutdown/temporary-data cleanup. The downloaded runtime is stored under ignored node_modules, not committed source.
- Seven real-database scenarios pass: concurrent proposal acceptance and retry reuse; rollback after a late contract-validation failure; competing final milestone approvals; duplicate-review prevention; accurate aggregate ratings from concurrent reviews on separate completed engagements; conversation/message uniqueness under concurrent retries; and authenticated HTTP ownership/moderation flows.
- HTTP checks exercise persisted project/task creation and reload, denied outsider access, protected-field rejection, disabled admin registration, private draft visibility, seller submission, admin-only publication, paid delivery-link redaction, and re-review after seller edits.
- Integration output reports eight passing tests including its parent group. The standard server suite still passes 41 checks. This closes the previously unverified database invariants for the specific scenarios above; it does not establish every endpoint, failure mode, or browser flow.
- Added `.github/workflows/ci.yml` to install from lockfiles, build/test both sides and run the disposable-database suite on a Windows/Node 24 runner. The workflow is written and reviewed locally; a hosted GitHub Actions run is not yet verified. It uses read-only repository permissions and no project credentials.

Remaining verification: browser journeys, account/session recovery, release uploads/downloads, provider test payments, broader fault injection, deployment/restore testing, and hosted CI execution. The project remains incomplete despite the expanded green checks.

### Catalog and moderation update — 5 November 2026

- New products are private drafts. Submission validates documentation, delivery links and pricing before moving to pending review. Only administrator moderation can publish a pending listing. Rejection/archive requires a reason, and moderation stores actor/time/reason history. Status/timestamp conditions reject stale decisions.
- Seller edits clear publication approval and return the listing to draft. Deletion archives instead of destroying purchase-referenced product records. My Products supplies seller-owned listing/status/feedback, draft editing, resubmission and archiving. The sell wizard saves a draft then submits it and reports review status accurately.
- Public catalog/detail requires both published status and recorded moderation approval. Older automatically-published listings remain visible to their sellers/admins, but must be edited and resubmitted before public visibility. No live database migration or record deletion was performed.
- New defaults no longer invent product reviews or quality scores. Until purchase-backed reviews are implemented, serialized products report no product reviews and omit quality assessments; catalog cards show “No reviews yet.” Existing stored legacy scores are not treated as verified reviews and are not deleted by this change.
- Product inputs validate strings, arrays, URLs, screenshots and prices. Catalog search treats user text literally and bounds its length. Hidden product requests no longer increment view counters, and published product views use an atomic increment.
- Both builds and all 42 checks pass (41 server, including HTTP serving, plus one frontend helper). Seven new isolated tests cover validation, drafts, public filtering, legacy visibility, editing/resubmission and stale moderation. Browser flow and live database concurrency verification are still required.

Marketplace completion still requires private release assets, real acquisition entitlements, purchase history/download authorization, payment verification, purchase-backed reviews, and complete browser/database tests. Screenshots currently accept bounded image data/links; this does not implement scanned private package uploads.

### Persistent reviews update — 5 November 2026

- Added a functional Review model, authenticated routes, transactional creation service, and unique contract/reviewer constraint. Only participants in a completed contract may review the opposite participant; self-review and duplicate review submissions are rejected.
- Four integer ratings are validated server-side. Overall score is derived from those ratings, and reviewee/verification fields are determined by the server. Profile rating/count is recomputed from saved verified reviews within the same transaction.
- Completed contract pages now display a persistent review form and saved-review confirmation. The Reviews page loads received feedback, total/average/distribution across all pages, and paginated results, with loading/error/empty states. “Completed contract” verifies work eligibility, not money received.
- Added `npm test` scripts to client and server. Both builds pass. Full server suite passes 34 checks (33 isolated tests plus the existing HTTP serving check); client passes one helper test, for 35 total. Review tests exercise validation, eligibility, duplicate rejection, transaction propagation, summary scoping and pagination. Browser and live MongoDB concurrency coverage remain outstanding.

Remaining review work: product-purchase reviews tied to verified entitlements, public profile review display, moderation/reporting policy, and isolated replica-set integration tests. Existing fabricated/demo product ratings are not reconciled by this change.

### Delivery workflow update — 5 November 2026

- Added stable-ID milestone actions for starting work, submitting delivery, requesting revisions, and approving work. Actor permissions and state transitions are enforced in the service, including prior-milestone ordering and terminal-contract checks.
- Each action appends actor, timestamp, notes, and validated HTTP(S) delivery links to durable milestone history. Completion updates the requirement in the same MongoDB transaction as final approval. No financial records are created by work approval.
- Contract serialization supplies stable milestone IDs, populated participant data, and the requirement title consistently after both reads and mutations.
- The contract page uses server-confirmed results, preserves failed submission/revision input, renders delivery/revision history, and exposes Start Work for eligible pending milestones. It explicitly states that payment/escrow is unavailable and labels monetary figures as work values, not released/held funds.
- Removed the local-only review submission modal; persistent verified reviews are still required and will restore that capability.
- Both builds and 29 isolated regression tests pass (28 backend, one frontend). New coverage checks the complete work/revision/approval sequence, serialization after model reconstruction, unauthorized actions, unsafe links, premature/duplicate approvals, and transaction session propagation. This is not proof of real replica-set concurrency or full browser correctness.

Remaining: payment/funding lifecycle, cancellations/disputes, verified reviews, notifications, bounded history/retention, and isolated database/browser integration coverage. Starting work currently tracks unfunded delivery; it does not assert payment readiness or enable a funded contract marketplace.

Fifth foundation increment implemented:

- Added authenticated POST `/messages/conversations` for the contact actions already present on proposal, contract, and profile screens. It validates recipients, reuses existing two-person histories, and uses a normalized unique key for new direct conversations.
- Added author-only edit and soft-delete endpoints with conversation membership checks. Deleted content is cleared and hidden from message history and conversation previews; timestamps retain evidence of the operation.
- Text messages validate length and content and normalize response sender IDs/types to the chat UI. New frontend sends carry a retry identifier; a unique sender/request index and idempotent upsert return the saved message on repeat sends and reject changed payloads using the same key.
- Conversation participant rendering accepts the actual API shape. Chat waits for saved results; failed send/edit retains the draft, failed deletion retains the visible message, and errors are displayed. Switching conversations guards against stale history responses.
- Attachment sending is explicitly disabled pending private asset storage, validation, and scanning. Existing attachment records remain viewable; secure attachment delivery is not complete.
- Both builds and 26 isolated regression tests pass (25 backend and one frontend). These tests cover conversation reuse, duplicate-key recovery, retry behavior, message validation, authorship/membership, and edit/delete persistence, but do not replace browser or replica-set integration tests.

Remaining messaging work: bounded history pagination, secure attachments, read-receipt boundaries/per-participant cursors, rate limits/blocking, notifications, and database/browser integration tests. Real-time transport remains deferred until polling behavior is verified end to end.

Fourth foundation increment implemented:

- New projects start with empty tasks/milestones and zero progress, rather than invented completed work.
- Task create/update/delete uses project-scoped routes; authorization verifies a task belongs to the project named in the URL. Existing unscoped task routes remain available with ownership checks for compatibility.
- Task validation covers titles, status, priority, labels, dates, and subtask values. Creation uses server IDs and the authenticated creator. Subtask updates strip unsupported nested fields.
- Workspace mutations wait for successful server writes, then reload persisted tasks. Failed writes retain current UI/form state and show errors. Status changes, deletion, and subtask checkboxes no longer silently change only the browser state.
- Project list/detail progress is derived from saved tasks. Project completion rejects empty or unfinished task lists. Completion/task concurrency and archive/reopen policies still need further work.
- Project creation waits for a successful response before clearing its form. Both builds and 19 regression tests pass (18 backend, one frontend); these remain isolated tests rather than full browser/database coverage.

Remaining workspace work: member/editor capabilities, assignments, comments, contract-linked archive rules, concurrent editing policies, and either implementing or hiding the unsupported GitHub controls.

Third foundation increment implemented:

- Proposal acceptance now runs in one MongoDB transaction: authorize the request owner, conditionally claim the open requirement, create a linked project and contract, accept the winning proposal, and reject competing pending bids. Repeated acceptance returns the original contract. Transaction-capable MongoDB is required; failures return an unavailable response rather than falling back to partial writes.
- Newly accepted contracts start as `created`, without implying paid/funded status. Real funding and contract activation remain pending.
- Proposal creation checks student eligibility, existing/open requirements, self-bidding, positive amounts, milestone totals and durations.
- A shared frontend request helper adds bearer authentication only to the application's API. Existing frontend fetch calls now use it. Private workspace/admin routes enforce sign-in/role checks while marketplace and requirement browsing remain public.
- Profile saves use the backend's flat fields, hydrate from the loaded profile, and show errors instead of false success. Message list/history reads now use the server's existing routes.
- Both builds pass; eleven backend regression tests and one frontend helper test pass. Acceptance tests use session/model stubs to verify retry handling, authorization, session propagation, and state checks. Actual parallel transaction rollback and race behavior still require isolated replica-set integration tests; these results do not prove live concurrency correctness.

Next: database-backed acceptance tests, revocable sessions, remaining message/conversation routes, persistent task/milestone actions, and removal of false success states throughout the interface. The project is not release-ready.

Second foundation increment implemented:

- Project/task, proposal, and contract reads now require authentication. Project lists retain actor membership scope even when a different `userId` is requested; contract lists use the authenticated participant; proposal lists include the author's proposals and bids on the actor's requirements.
- Detail routes enforce project membership, proposal author/request ownership, and contract participation. Project/task edits currently require the project owner; granular editor invitations remain future work.
- Product and requirement mutations require ownership. Generic updates reject unknown/protected fields and run schema validators.
- Conversation reads, sends, and read receipts verify membership. Notification read updates are scoped to their recipient. Public requirement responses no longer expose other students' bids or client emails.
- Public paid-product responses omit delivery URLs and documentation. Unpublished products are hidden from visitors; sellers and admins can inspect their listings. Buyer entitlement downloads are still pending and legacy mock orders are not trusted as payment evidence.
- Milestone updates restrict client/student actions and reject invalid transitions or missing milestones.
- Server build and nine regression tests pass (`node --test tests/security.test.mjs tests/access.test.mjs`). These tests use isolated model stubs, not a live database.

Remaining Phase 0 work includes atomic proposal acceptance/concurrency protection, revocable sessions, and comprehensive database-backed authorization tests. Phase 1 must update frontend requests to supply authentication consistently now that private reads are enforced.

First foundation increment implemented:

- Public registration rejects administrator/unknown roles before database access; demo login is disabled in every environment.
- JWT signing and verification require an explicitly configured secret. New tokens expire after one day. Authentication loads the current account and role, so deleted accounts and stale admin claims cannot retain access through those paths.
- Payment-order and payout endpoints return 503 without creating fake financial records. The product purchase handler prevents paid checkout from reporting completion while verification is unavailable.
- Product detail routing reads the existing `:id` parameter correctly.
- Frontend/backend builds and four security regression tests pass. Run `cd server`, `npm run build`, then `node --test tests/security.test.mjs`.

This is a partial Phase 0 increment. Resource ownership/membership policies, private read scoping, session revocation, protected downloads, atomic acceptance, and payment-provider integration remain outstanding. Existing mock financial records have not been modified. Existing configured secrets are not rotated automatically; credentials and administrative accounts need a separate audit before deployment.

Reviewed: 4 November 2026. Scope: current React frontend, Express routes/controllers, authentication, core MongoDB models, build setup, and existing tests. This is a source-code review and implementation plan, not a production penetration test or an exhaustive browser test. No live purchases, database mutations, or account changes were performed for this review. Findings below are confirmed in source; proposed architecture is explicitly a recommendation.

## 1. Assessment and definition of complete

CampusCode has a substantial interface and basic database CRUD, but the two core commercial journeys are incomplete. Screens often imply capabilities that the API does not implement. Successful compilation and the existing static-serving test do not establish business-flow correctness.

A complete first release should let a student publish approved software, let a buyer acquire and later download it, and let a client post a requirement, select one proposal, manage delivery, approve work, and leave a verified review. Every action must survive reload, enforce ownership, report failures honestly, and create consistent records.

Recommended delivery strategy: repair shared foundations first, finish the software marketplace end to end, then complete commissioned work. Defer AI and GitHub automation until these journeys pass tests. A demo release can use explicitly labeled provider test mode; real-money readiness is a separate release gate.

## 2. Confirmed defects, ordered by urgency

P0 means fix before exposing the service to untrusted users. P1 means required for a coherent working release. P2 means reliability, clarity, or maintainability work.

| Priority | Finding and evidence | Consequence | Required change |
|---|---|---|---|
| P0 | `server/src/controllers/authController.ts`, `register`: accepts `role: admin`; `demoLogin` grants an admin token without a password. Both routes are public in `authRoutes.ts`. | An unauthenticated visitor can obtain administrator access. | Public registration must allow only student/client. Provision administrators through a controlled offline process. Disable demo routes in production and isolate demo data. |
| P0 | `authController.ts` and `middleware/auth.ts` use a known fallback JWT secret. Tokens last 30 days; middleware trusts token claims without checking current account state. | Missing configuration can permit forged access; role changes or account removal need not invalidate existing access. | Require secrets at startup, implement session revocation/account-state checks, and define token lifetime/rotation. |
| P0 | `projectRoutes.ts`, `contractRoutes.ts`, `proposalRoutes.ts` use optional authentication for private lists/details. Controllers accept query identifiers or return unscoped lists. Solution details embed proposals. | Private projects, tasks, bids, contracts, and participant email addresses can be exposed. | Authenticate private reads; query by actor membership/ownership. Public listings need dedicated, limited response fields. |
| P0 | `projectController.ts`, `productController.ts`, `solutionController.ts` update/delete by ID without ownership checks; updates spread `req.body` into `$set`. | A signed-in user can modify another user's records and privileged fields. | Owner/member filters plus explicit editable-field allowlists and validation; never accept owner, status, or financial fields through generic editing. |
| P0 | `proposalController.ts::acceptProposal` has no request-owner or pending-state check. Saves proposal, contract, and request separately. | Unauthorized acceptance, duplicate contracts, multiple winners, and partially saved state. | Owner authorization, conditional state transition, unique winning acceptance, and one database transaction. |
| P0 | `messageController.ts` reads, writes, and marks messages read by supplied conversation ID without checking participants. `notificationController.ts::markRead` updates by ID alone. | Cross-user message access or modification and notification tampering. | Verify conversation membership on every operation; scope notification updates by authenticated user. |
| P0 | `paymentController.ts` trusts requested amount, immediately saves completed orders/earnings, and records completed payouts without checking balances or contacting a provider. | Fake purchases and fabricated financial history; payout records do not prove funds moved. | Server-owned prices, verified provider events, pending states, idempotency, and balance-backed payout handling. Keep real payments disabled until complete. |
| P1 | `App.jsx` defines `/marketplace/:id`, while `MarketplaceDetailPage.jsx` reads `useParams().product`. | Detail requests use `undefined`, so product detail pages fail. | Read `id` consistently and add a route-to-detail regression test. |
| P1 | `MarketplaceDetailPage.jsx::handlePurchaseOrFree` omits bearer authentication, ignores unsuccessful responses, generates a license locally, and reports completion. | A rejected purchase still appears successful. | Use authenticated API requests and show completion only after server-confirmed order state. |
| P1 | Product detail APIs serialize `driveUrl`, `githubUrl`, and `downloadUrl`; download UI opens these or generates a Markdown README. | Paid delivery is not access-controlled, and a generated README is not the promised software package. | Separate public product metadata from private release assets. Authorize downloads through purchase entitlements. |
| P1 | `ContractDetailPage.jsx` posts to `/contracts/:id/milestones`; server exposes PATCH `/contracts/:id/milestones/:milestoneIndex`. UI advances statuses locally despite errors. | Submission, approval, and revision appear to work but do not persist. | Adopt stable milestone IDs and explicit submit/approve/request-revision operations; persist evidence and return authoritative state. |
| P1 | `SettingsPage.jsx` sends nested `studentProfile`, but `updateProfile` expects flat fields. It reports success regardless of the returned result. | Bio, college, and other changes can silently disappear. | Agree on one validated payload; hydrate form after profile load; display success only when save succeeds. |
| P1 | Messages UI uses GET `/api/messages` and query-based message retrieval; API defines GET `/messages/conversations` and GET `/messages/:conversationId`. Several actions omit auth. | Conversation/message lists fail even for signed-in users. | Align routes and shared authentication handling. Implement or remove unsupported edit/delete actions. |
| P1 | Frontend calls missing routes: POST `/messages/conversations`, GET `/users/:slug`, `/admin/transactions`, `/admin/users/:id/verify`, project GitHub routes, and POST `/ai`. | Contact-user, portfolio, admin, GitHub, and AI buttons lead to failures or fallback behavior. | Implement approved endpoints or remove/disable actions until available. AI currently exposes `/ai/plan`, `/ai/analyze`, `/ai/proposal`. |
| P1 | `ProjectDetailPage.jsx` updates tasks through project-scoped task URLs/query parameters; server updates through `/projects/tasks/:taskId`. | Task changes can fail to persist. | Standardize task routes and check parent-project permissions. |
| P1 | Admin overview/users and earnings reads omit Authorization headers; admin product actions update local state after failed calls. | Authorized users see empty data or false moderation success. | Central API helper; check response status and refetch/invalidate only after committed mutations. |
| P1 | Forgot/reset password pages toggle success state without an API; contact form uses a delay; review submission is local state; `ReviewsPage.jsx` uses an empty array. | The UI promises emails, saved messages, and reviews that do not exist. | Implement real persistence/delivery or hide those promises. |
| P1 | Products are created as published with rating 5 and reviewCount 1. Public queries do not filter publication status. Product schema supplies high default quality scores. | Moderation can be bypassed and new products show unearned trust signals. | Draft/review/published lifecycle; public visibility filters; zero reviews initially; quality scores only from actual assessments. |
| P2 | New projects contain already-completed tasks/milestones. `createSolutionRequest` silently substitutes default budgets for zero/missing values. | Project progress and financial intent are misrepresented. | Empty or explicit template initialization; validate budget and date inputs rather than inventing values. |
| P2 | `useUserData` is a local-state hook, not a shared store; each caller fetches five collections and maintains its own copies. | Repeated requests, inconsistent counters, and stale views after mutations. | Shared domain cache/provider and per-domain queries with invalidation. |
| P2 | Admin totals sum every transaction then apply a fixed 10%; frontend earnings can derive sales times current price. | Revenue/payout/refund totals can disagree and historical values change with catalog prices. | Calculate from recorded transaction types/statuses and immutable order price/fee snapshots. |
| P2 | `DashboardLayout.jsx` chooses admin navigation from the URL; `App.jsx` has no protected route wrapper. | Users can open inappropriate screens. This does not itself bypass protected API routes. | Explicit signed-in and role guards; server authorization remains mandatory. |
| P2 | AI controllers return fixed templates; no notification creation was found in reviewed controllers; seed/clear scripts reference source files not present in the tracked repository. | Advertised integrations and onboarding commands exceed current capabilities. | Label templates honestly, produce notifications from actual events, and restore safe development seeds or remove broken commands. |

## 3. Target architecture

Keep a modular MERN application: one React SPA, one Express service, MongoDB. The current esbuild/PostCSS tooling can remain. Replacing build tools again will not repair business workflows.

Organize backend code by domain: identity, catalog, orders, requirements, proposals, contracts, projects, messaging, notifications, administration. Within each domain use routes -> validation/authorization -> service -> persistence. Services own transitions and cross-document changes; controllers translate HTTP requests/responses.

Add one frontend API helper for base URLs, bearer tokens during the initial repair, JSON parsing, AbortSignal, and typed error categories. Move network operations into domain hooks. A shared query cache should clear on logout/account changes and invalidate affected records after mutations. A later same-origin cookie-session design should include HttpOnly/Secure cookies and CSRF defenses; choose it deliberately rather than mixing auth mechanisms.

Define request/response schemas and a checked API specification. Standardize IDs as strings, timestamps as ISO strings, money as integer minor units plus currency, and errors as `{error: {code, message, fields}, requestId}`. Runtime validation is necessary even with TypeScript. Add JSDoc for JavaScript consumers if useful.

Authorization must default to refusal and verify actor/resource relationships on every request, including nested resources. See [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html). Use single-document conditional writes where possible; use transactions for acceptance or accounting operations spanning records. MongoDB supports multi-document transactions on suitable deployments, with additional cost compared with single-document writes: [MongoDB atomicity guidance](https://www.mongodb.com/docs/v8.0/core/write-operations-atomicity/).

## 4. Complete flows and implementation contracts

### Identity and profiles

Register -> verify email -> sign in -> complete role-specific profile -> enter workspace. A visitor can browse approved products and public requirements. A student manages their products/proposals/projects; a client manages their requirements and selected contracts. Admin authority is explicitly provisioned. Decide whether a user may hold both buyer/client and student capabilities; do not let URL navigation decide privileges.

Implement hashed, expiring, single-use verification/reset tokens; generic reset responses; email delivery with retry; password update and session revocation. Add rate limits on auth endpoints and validate account status on access. Provide public profile DTOs without email or private account data.

Acceptance: reset token cannot be reused; refresh restores the session; changing one student's profile cannot affect another; public registration cannot create admins.

### Software marketplace

Student creates draft -> uploads versioned package/screenshots -> submits for review -> admin approves/rejects with reason -> published listing -> buyer creates order -> provider confirms payment -> entitlement appears in purchases -> authorized download.

Add ProductRelease, Asset, Order with price/license/version snapshots, PaymentEvent, and Entitlement records. Keep packages private; provide short-lived download access after authorization. Validate file size/type, scan uploads, and store upload status. Free products still create a zero-value acquisition entitlement. Buying your own product and duplicate purchases need explicit policy.

Use provider-hosted checkout rather than collecting card fields in the app. Choose the provider and supported marketplace settlement model before implementing real payouts. Verify provider signatures/events server-side; deduplicate event IDs; reject amount/currency mismatches. A browser callback alone cannot mark an order paid. Refunds revoke/adjust entitlements according to a documented policy.

Suggested endpoints: POST `/orders`, GET `/orders/mine`, GET `/orders/:id`, POST `/payments/webhook`, POST `/products/:id/download`, POST `/products/:id/submit-review`.

Acceptance: failed/cancelled payment never unlocks a package; webhook replay does not double-count sales; old orders retain their original price after product edits; unauthorized users cannot obtain private download URLs.

### Requirements, proposals, contracts

Client drafts and publishes requirement -> student submits proposal -> client compares bids -> client accepts one -> contract and linked project are created -> funding confirmed if applicable -> student submits deliverable -> client requests revision or approves -> all milestones complete -> verified review and settlement.

Proposals must reference an existing open requirement, come from eligible students, have positive amounts, valid duration, and milestone totals equal to the proposal total. Prevent self-bidding. Define one active proposal per student/request or support versioned revisions explicitly.

Acceptance service: authorize request owner, conditionally claim open request, conditionally accept pending proposal, create one contract/project, close competing proposals, and record notification events in one transaction. Add unique indexes and retry-safe request identifiers. Two concurrent acceptances must produce one winner.

Separate work and payment states. Proposed work states: created -> active -> in_review -> completed, with controlled cancellation/dispute paths. Milestones: pending -> in_progress -> submitted -> approved; submitted -> revision_requested -> submitted. Only the assigned student submits; only the client approves. Preserve revision history, notes, deliverable assets, timestamps, and audit actor. Use stable milestone IDs rather than array indexes.

Suggested endpoints: POST `/proposals/:id/accept`, POST `/contracts/:id/milestones/:milestoneId/submissions`, POST `.../approve`, POST `.../request-revision`, POST `/contracts/:id/disputes`.

Acceptance: reload preserves delivery and revision history; outsider access is denied; approval cannot happen before submission; duplicate approval cannot release money twice; completion follows server-verified milestones.

### Project workspace

Create project -> invite members -> define tasks/milestones -> assign and move tasks -> calculate progress -> optionally publish a product release. Define owner/editor/viewer capabilities. Tasks must belong to the authorized project and assignees must be members. Add invite/accept/remove-member endpoints and archive policies for projects linked to contracts.

Use one task route convention, preferably `/projects/:projectId/tasks/:taskId`. Keep business milestones separate from optional project planning milestones, with explicit links where necessary. Do not mark templates completed. GitHub integration should be hidden until OAuth, repository permissions, encrypted token storage, and synchronization/retry behavior are implemented.

Acceptance: drag/drop persists; unauthorized moves fail visibly and revert; progress is derived consistently; archiving does not destroy contract evidence.

### Messaging and notifications

Implement authenticated conversation creation, listing, paginated messages, and participant checks. Store attachments as authorized assets. If edit/delete are offered, define author-only permissions and retention. Start with working polling; add authenticated realtime delivery later. Use per-participant last-read positions for multi-user conversations.

Create notifications from proposal submission/acceptance, deliverable submission, review decisions, payment events, and messages. Store an event/outbox record with the business transaction; retry delivery without duplicates. Provide scoped read/unread actions and real preference persistence.

Acceptance: a conversation outsider cannot read/send/mark read; refresh preserves chat; reconnect catches up; notifications link to accessible resources.

### Reviews, administration, support

Restore a functional review domain with routes, persistence, and eligibility checks; the earlier unused Review model was removed because nothing referenced it, but the product capability still needs implementation. Restrict reviews to completed purchases/contracts and enforce one review per eligible transaction/reviewer. Compute ratings from actual records.

Implement admin moderation queues, user status actions, transaction reconciliation, disputes, and audit logs. Do not hard-delete records referenced by orders/contracts. Store contact submissions or deliver them through a real service; report failure if submission fails. Review public claims about verification, escrow, AI, realtime messaging, and user counts against implemented behavior before release.

## 5. Data and operational work

Add unique indexes for product slugs, provider event/order IDs, proposal acceptance, review eligibility, and normalized conversation participants. Add compound indexes for owner/status/date lists and conversation/date pagination. Validate ObjectIds before queries; bound page size and search length; escape literal searches rather than compiling arbitrary user regexes.

Before schema migrations, back up data and test on a copy. Audit fabricated ratings, completed mock payments, duplicate contracts, and public asset links. Flag questionable records for reconciliation rather than treating mock amounts as money actually received. Use repeatable migrations with dry-run summaries and rollback plans.

Add structured logs/request IDs, sanitized error responses, readiness that fails when MongoDB is unavailable, graceful shutdown, and startup checks for configuration. Provide one documented development command that starts builder/server and handles occupied ports clearly. Production should build both sides, serve versioned/cache-safe assets, use HTTPS, and preserve the expected server/client directory layout.

Maintain environment examples without real secrets; separate development/test/production databases. CI should install from lockfiles, build, run authorization/API integration tests and critical browser flows. Add backup-restore rehearsal and a staging deployment before release. Existing `server/tests/client.test.mjs` verifies serving only; it does not cover authentication or business behavior.

## 6. Ordered implementation backlog

| Phase | Deliverable | Depends on | Exit gate |
|---|---|---|---|
| 0 — Containment | Close admin registration/demo access, require secrets, protect private reads and all writes, disable misleading paid actions | None | Anonymous/outsider access matrix passes; no fake payment success |
| 1 — Contracts and plumbing | Shared API client, validation/DTOs, route alignment, route guards, truthful errors, profile fix, missing-route inventory | 0 | Every visible core action maps to a tested route; reload proves persistence |
| 2 — Complete marketplace | Product lifecycle, private uploads, order snapshots, test checkout, entitlements, purchases/download UI | 1 | Student -> admin -> buyer journey passes, including rejection/failure/replay |
| 3 — Complete commissioned work | Proposal validation/atomic acceptance, linked project, milestones, revisions, cancellation/disputes | 1; payment primitives from 2 if funded | One accepted proposal; authorized completion and durable evidence |
| 4 — Trust and operations | Messaging, notifications, verified reviews, real admin metrics, support and account recovery | 2–3 | Two-user flows and recovery paths pass; no fabricated success states |
| 5 — Release hardening | Pagination/indexes, backup/restore, CI, staging, logging, accessibility/mobile checks, settlement reconciliation | 0–4 | Release checklist below passes |
| Later — Optional enhancements | AI provider integration, GitHub synchronization, realtime chat, advanced recommendations | Stable core release | Individually measured and tested feature flags |

Sizing should follow Phase 1 because route mismatches and placeholder behavior materially change the work required. Avoid assigning a completion percentage based on page count.

## 7. Release acceptance checklist

- Fresh clone installs, builds, starts, and loads nested URLs using only documented commands.
- Anonymous, student A, student B, client A, client B, and admin tests cover every private resource and mutation.
- Registration, verification, reset, logout/revocation, and profile save work after reload.
- Public catalog exposes only published metadata; package access requires an entitlement.
- Payment failure, delayed callbacks, duplicate callbacks, refund, and payout failure reconcile correctly in test mode before live enablement.
- Parallel proposal acceptances create exactly one contract; interrupted operations leave no partial state.
- Delivery, revision, approval, completion, reviews, and notifications remain correct across sessions.
- API failures show actionable errors; buttons never claim success solely from local state.
- Messaging supports authorized participants, durable history, and retry without duplicate sends.
- No fake scores, unsupported security claims, or unimplemented buttons remain in release UI.
- Logs, readiness, backups, restore procedure, and deployment rollback are verified.

## 8. First concrete work package

Start with Phase 0, then a small repair PR for the marketplace `id` mismatch, shared authenticated API helper, settings payload alignment, and response-status handling. Follow with route-contract fixes for messaging/tasks/milestones and regression tests. This makes existing screens trustworthy before adding more features. Keep payment-provider and AI selection as explicit decisions when their phases begin.
