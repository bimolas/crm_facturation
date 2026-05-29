# Implementation Tasks — Contract & Bidding

## Phase 1: Entity & Schema Changes (Backend)

- [x] 1. Extend `BusinessWorkflow` entity with new columns
  - Add `workflowType: enum('material','service','subscription')` column (required, set at creation)
  - Add `region: varchar(255)` nullable column
  - Add `requirements: simple-array` nullable column
  - Add `constraints: simple-array` nullable column
  - Add `conditions: text` nullable column
  - Add `evaluationCriteria: text` nullable column
  - Add `contractStartDate: date` nullable column (set on BC confirm)
  - Add `contractStatus: varchar(50)` nullable column (e.g. `ACTIVE`, `COMPLETED`)
  - Add `progressStepIndex: int` default 0 column
  - _Requirements: 1.2, 5.3, 5.4, 13.6_

- [x] 2. Extend `Devis` entity with bid lifecycle columns
  - Add `bidStatus: enum('SUBMITTED','NEGOTIATING','BC_PENDING_VENDOR','CONTRACT_ESTABLISHED','REJECTED')` column, default `SUBMITTED`
  - Add `isRejected: boolean` column, default `false`
  - Add `rejectionReason: text` nullable column
  - _Requirements: 4.6, 11.3, 12.4_

- [x] 3. Extend `BonDeCommande` entity with accepted bid FK
  - Add `acceptedDevisId: int` nullable FK column referencing `financial_documents.id`
  - Add `@ManyToOne(() => Devis)` relation `acceptedDevis`
  - _Requirements: 4.2_

- [x] 4. Create `NegotiationMessage` entity
  - Create `crm_facturation_api/src/contracting/negotiation/negotiation-message.entity.ts`
  - Table: `negotiation_messages`
  - Fields: `id`, `bid` (ManyToOne → Devis), `workflow` (ManyToOne → BusinessWorkflow), `senderCompany` (ManyToOne → Company), `senderUser` (ManyToOne → User), `content: text`, `messageType: enum('BUYER_MESSAGE','VENDOR_MESSAGE','SYSTEM_NOTE')`, `createdAt`
  - _Requirements: 3.1, 3.7_

- [x] 5. Create `Team` entity
  - Create `crm_facturation_api/src/teams/team.entity.ts`
  - Table: `teams`
  - Fields: `id`, `name: varchar(255)`, `description: text`, `manager` (ManyToOne → User), `company` (ManyToOne → Company), `tags: simple-array`, `createdAt`
  - _Requirements: 7.1_

- [x] 6. Create `TeamMember` entity
  - Create `crm_facturation_api/src/teams/team-member.entity.ts`
  - Table: `team_members`
  - Fields: `id`, `team` (ManyToOne → Team, onDelete CASCADE), `user` (ManyToOne → User), `joinedAt: datetime` (auto-set)
  - Add `@Unique(['team', 'user'])` constraint
  - _Requirements: 7.1, 7.2_

- [x] 7. Create `WorkItem` entity
  - Create `crm_facturation_api/src/contracting/work-item/work-item.entity.ts`
  - Table: `work_items`
  - Fields: `id`, `workflow` (ManyToOne → BusinessWorkflow, onDelete CASCADE), `title: varchar(255)`, `description: text`, `type: enum('material','service','subscription')`, `status: enum('PENDING','IN_PROGRESS','COMPLETED')` default `PENDING`, `assignedTeam` (ManyToOne → Team, nullable), `startDate: date`, `endDate: date`, `monthlyAmount: decimal(15,2)` nullable, `createdAt`
  - Add `@OneToMany(() => Task)` relation `tasks`
  - _Requirements: 6.1_

- [x] 8. Create `Task` entity
  - Create `crm_facturation_api/src/contracting/task/task.entity.ts`
  - Table: `tasks`
  - Fields: `id`, `workItem` (ManyToOne → WorkItem, onDelete CASCADE), `title: varchar(255)`, `description: text` nullable, `status: enum('todo','in-progress','completed')` default `todo`, `assigneeUser` (ManyToOne → User, nullable), `dueDate: date` nullable, `durationDays: int` default 1, `comments: json` default `[]`, `attachments: json` default `[]`, `createdAt`
  - _Requirements: 14.1_

- [x] 9. Create `Holiday` entity
  - Create `crm_facturation_api/src/calendar/holiday.entity.ts`
  - Table: `holidays`
  - Fields: `id`, `company` (ManyToOne → Company, onDelete CASCADE), `date: date`, `label: varchar(255)`
  - _Requirements: 9.2_

- [x] 10. Create `CalendarEvent` entity
  - Create `crm_facturation_api/src/calendar/calendar-event.entity.ts`
  - Table: `calendar_events`
  - Fields: `id`, `workItem` (ManyToOne → WorkItem, onDelete CASCADE), `workflow` (ManyToOne → BusinessWorkflow), `eventType: enum('PACKAGING','DEPARTURE','ARRIVAL','SERVICE_DAY','BILLING_CYCLE')`, `eventDate: date`, `hasConflict: boolean` default `false`, `conflictingWorkItemIds: simple-array` nullable
  - _Requirements: 8.1, 8.2, 9.1_

- [x] 11. Create `PaymentInstallment` entity
  - Create `crm_facturation_api/src/contracting/payment/payment-installment.entity.ts`
  - Table: `payment_installments`
  - Fields: `id`, `workItem` (ManyToOne → WorkItem, onDelete CASCADE), `dueDate: date`, `amount: decimal(15,2)`, `status: enum('PENDING','PAID','OVERDUE')` default `PENDING`, `paidAt: datetime` nullable
  - _Requirements: 10.2_

- [x] 12. Register all new entities in `AppModule`
  - Add `NegotiationMessage`, `Team`, `TeamMember`, `WorkItem`, `Task`, `Holiday`, `CalendarEvent`, `PaymentInstallment` to the `entities` array in `crm_facturation_api/src/app.module.ts`
  - Import and register the new modules: `ContractingModule`, `TeamsModule`, `CalendarModule`
  - _Requirements: all_

## Phase 2: Domain Services

- [x] 13. Create `WorkItemStatusService`
  - Create `crm_facturation_api/src/domain-services/work-item-status.service.ts`
  - Implement `derive(tasks: { status: string }[]): WorkItemStatus` — returns `COMPLETED` if all tasks are `completed`, `PENDING` if all are `todo` or no tasks, `IN_PROGRESS` otherwise
  - Export from `DomainServicesModule`
  - _Requirements: 6.5, 6.6, Property 2_

- [x] 14. Create `PaymentScheduleService`
  - Create `crm_facturation_api/src/domain-services/payment-schedule.service.ts`
  - Implement `firstBusinessDayOfMonth(year: number, month: number): Date` — returns first Mon–Fri of the given month
  - Implement `generate(startDate: Date, endDate: Date, monthlyAmount: number): { dueDate: Date; amount: number }[]` — one installment per calendar month, due date = first business day of each month
  - Export from `DomainServicesModule`
  - _Requirements: 10.1, 10.2, Property 3_

- [x] 15. Create `CalendarConflictService`
  - Create `crm_facturation_api/src/domain-services/calendar-conflict.service.ts`
  - Implement `getBusinessDays(startDate: Date, endDate: Date, holidays: Date[]): Date[]` — returns all Mon–Fri dates in range excluding holidays
  - Implement `detectMaterialConflicts(workItems: WorkItem[], sellerCompanyId: number): Map<number, number[]>` — returns map of workItemId → conflicting workItemIds for overlapping seller material items
  - Implement `detectServiceConflicts(workItems: WorkItem[], holidays: Date[], sellerCompanyId: number): Map<number, number[]>` — same for service items using business-day intersection
  - Export from `DomainServicesModule`
  - _Requirements: 8.3, 9.3, Property 4_

## Phase 3: Extend Existing Services & Controllers

- [x] 16. Extend `BusinessWorkflowService.create()` for new RFP fields
  - Accept `workflowType`, `region`, `requirements`, `constraints`, `conditions`, `evaluationCriteria` in the DTO
  - Persist all new fields on the `BusinessWorkflow` entity
  - Validate that `workflowType` is one of `material`, `service`, `subscription`; throw `BadRequestException` if missing or invalid
  - Update `CreateWorkflowDto` in `crm_facturation_api/src/marketplace/workflow/dto/create-workflow.dto.ts`
  - _Requirements: 1.2, 1.8_

- [x] 17. Extend `BusinessWorkflowService.acceptBid()` for BC generation and bid status updates
  - After accepting the bid, auto-generate a `BonDeCommande` with `clientPoReferenceNumber = BC-{YEAR}-{workflowId}-{sequence}`, copying `items`, `subTotalHT`, `totalTVA`, `totalTTC`, `deliveryLeadTime`, `downPaymentPercentage`, `balanceDueDays` from the accepted `Devis`; set `acceptedDevisId` FK
  - Set accepted bid's `bidStatus = BC_PENDING_VENDOR`
  - Set all other bids on the same workflow to `isRejected = true`, `bidStatus = REJECTED`, `rejectionReason = 'Automated: Another bid was accepted.'`
  - Notify seller company that BC is awaiting confirmation
  - Wrap all changes in the existing `saveWithHistory` transaction
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 18. Add `BusinessWorkflowService.confirmBC()` method
  - Validate that the actor's company is `chosenSellerCompany`; throw `ForbiddenException` otherwise
  - Set `BonDeCommande.signatureTimestamp = new Date()`
  - Set accepted bid's `bidStatus = CONTRACT_ESTABLISHED`
  - Set `workflow.contractStartDate = new Date()` and `workflow.contractStatus = 'ACTIVE'`
  - Save all changes atomically via `DataSource.transaction()`; record `WorkflowHistory` entry
  - Notify both buyer and seller companies
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 19. Add `BusinessWorkflowService.rejectBid()` method
  - Validate that the actor's company is `buyerCompany`; throw `ForbiddenException` otherwise
  - Set bid `isRejected = true`, `bidStatus = REJECTED`, `rejectionReason` from DTO
  - Record `WorkflowHistory` entry
  - _Requirements: 11.3, 17.6_

- [x] 20. Add `BusinessWorkflowService.listBids()` method
  - Return all `Devis` records for a workflow
  - Enforce that only `buyerCompany` or `PLATFORM_ADMIN` can call this; throw `ForbiddenException` otherwise
  - _Requirements: 11.5_

- [x] 21. Add `BusinessWorkflowService.getContractDetail()` method
  - Return full contract detail: `contractType`, `buyerCompany`, `sellerCompany`, `value` (totalTTC from BC), `contractStartDate`, `expectedDeliveryDate`, `contractStatus`, `conditions`, `progressStepIndex`, `workItems` (with tasks), `documents`
  - Include type-specific timeline steps array based on `workflowType`
  - _Requirements: 13.2, 13.3, 13.4, 13.5_

- [x] 22. Add `BusinessWorkflowService.advanceProgress()` method
  - Validate actor is `chosenSellerCompany` or `PLATFORM_ADMIN`
  - Determine max steps for the workflow's `workflowType` (material: 7, service: 6, subscription: 4)
  - If `progressStepIndex` is already at max, throw `BadRequestException`
  - Increment `progressStepIndex` by 1 and save
  - _Requirements: 13.6_

- [x] 23. Add `BusinessWorkflowService.listContracts()` method
  - Return all workflows where `stateCode IN (IN_PROGRESS, UNDER_TEST, FULLY_INVOICED)` AND (`buyerCompany.id === companyId` OR `chosenSellerCompany.id === companyId`)
  - _Requirements: 13.1_

- [x] 24. Extend `BusinessWorkflowController` with new endpoints
  - `GET /workflows/:id/bids` → calls `listBids()`
  - `POST /workflows/:id/bids/:bidId/reject` → calls `rejectBid()`
  - `POST /workflows/:id/bc/confirm` → calls `confirmBC()`
  - `GET /workflows/contracts` → calls `listContracts()` (add before `GET /workflows/:id` to avoid route conflict)
  - `GET /workflows/:id/contract` → calls `getContractDetail()`
  - `PATCH /workflows/:id/contract/progress` → calls `advanceProgress()`
  - _Requirements: 5.1, 11.3, 11.5, 13.1, 13.2, 13.6_

- [x] 25. Add filter support to `GET /workflows/active` and `GET /workflows`
  - `GET /workflows/active` — accept query params `technicalCategory`, `budgetCeiling` (max), `region`, `createdAfter` (ISO date); filter in service
  - `GET /workflows` — accept `?mine=true` query param; when present, filter to workflows where `buyerCompany.id === companyId`
  - _Requirements: 1.7, 1.8, 11.1_

## Phase 4: New Modules

- [x] 26. Create `NegotiationModule` with service and controller
  - Create `crm_facturation_api/src/contracting/negotiation/negotiation.service.ts`
    - `sendMessage(workflowId, bidId, actorUserId, actorCompanyId, content)` — validates actor is buyer or bidding seller; determines `messageType`; persists `NegotiationMessage`; updates bid `bidStatus = NEGOTIATING` if was `SUBMITTED`; sends notification to other party
    - `getThread(workflowId, bidId, actorCompanyId)` — validates access; returns messages ordered by `createdAt ASC`
  - Create `crm_facturation_api/src/contracting/negotiation/negotiation.controller.ts`
    - `POST /workflows/:id/bids/:bidId/messages`
    - `GET /workflows/:id/bids/:bidId/messages`
  - Create `crm_facturation_api/src/contracting/negotiation/negotiation.module.ts`
  - _Requirements: 3.1–3.7_

- [x] 27. Create `TeamsModule` with service and controller
  - Create `crm_facturation_api/src/teams/team.service.ts`
    - `create(dto, companyId)` — creates Team + sets company
    - `findAll(companyId)` — returns all teams for company
    - `findOne(id, companyId)` — returns team with members and assigned WorkItems
    - `update(id, dto, companyId)` — updates name/description/tags
    - `addMember(teamId, userId, companyId)` — validates user belongs to same company; creates TeamMember
    - `removeMember(teamId, userId, companyId)` — deletes TeamMember
  - Create `crm_facturation_api/src/teams/team.controller.ts`
    - `POST /teams`, `GET /teams`, `GET /teams/:id`, `PATCH /teams/:id`
    - `POST /teams/:id/members`, `DELETE /teams/:id/members/:userId`
  - Create `crm_facturation_api/src/teams/team.module.ts`
  - _Requirements: 7.1–7.5_

- [x] 28. Create `WorkItemModule` with service and controller
  - Create `crm_facturation_api/src/contracting/work-item/work-item.service.ts`
    - `create(workflowId, dto, actorCompanyId)` — validates workflow is `IN_PROGRESS`; validates team company match if `assignedTeamId` provided; saves WorkItem; triggers calendar event generation; triggers payment schedule generation for subscription type; sends notification
    - `findAll(workflowId)` — returns all WorkItems with tasks
    - `findOne(workItemId)` — returns WorkItem with tasks
    - `update(workItemId, dto, actorCompanyId)` — updates fields; re-validates team if changed
    - `addTask(workItemId, dto, actorCompanyId)` — creates Task; recomputes WorkItem status
    - `updateTask(workItemId, taskId, dto, actorCompanyId)` — updates task; validates assignee company if changed; recomputes WorkItem status via `WorkItemStatusService`
    - `deleteTask(workItemId, taskId)` — deletes task; recomputes WorkItem status
    - `listTasks(workItemId)` — returns tasks grouped by status (`todo`, `in-progress`, `completed`)
    - `addComment(workItemId, taskId, actorUser, text)` — appends to `task.comments` JSON array
    - `getPaymentSchedule(workItemId)` — returns PaymentInstallments; computes OVERDUE on-read
    - `markInstallmentPaid(workItemId, installmentId, paidAt)` — sets status to PAID
  - Create `crm_facturation_api/src/contracting/work-item/work-item.controller.ts`
    - `POST /workflows/:id/works`, `GET /workflows/:id/works`
    - `GET /works/:workId`, `PATCH /works/:workId`
    - `POST /works/:workId/tasks`, `GET /works/:workId/tasks`
    - `PATCH /works/:workId/tasks/:taskId`, `DELETE /works/:workId/tasks/:taskId`
    - `POST /works/:workId/tasks/:taskId/comments`
    - `GET /works/:workId/payment-schedule`
    - `PATCH /works/:workId/payment-schedule/:installmentId`
  - Create `crm_facturation_api/src/contracting/work-item/work-item.module.ts`
  - _Requirements: 6.1–6.6, 10.1–10.5, 14.1–14.5_

- [x] 29. Create `CalendarModule` with service and controller
  - Create `crm_facturation_api/src/calendar/calendar.service.ts`
    - `generateEventsForWorkItem(workItem, sellerCompanyId, buyerCompanyId, holidays)` — creates `CalendarEvent` records based on `workItem.type`; for material: PACKAGING on startDate, DEPARTURE on startDate+1 business day, ARRIVAL on endDate; for service: SERVICE_DAY for each business day in range; for subscription: BILLING_CYCLE on first business day of each month
    - `recomputeConflicts(companyId)` — re-runs conflict detection for all seller work items and updates `hasConflict` + `conflictingWorkItemIds` on affected CalendarEvent records
    - `getEvents(companyId, from, to)` — returns CalendarEvents in date range for company (as buyer or seller)
    - `createHoliday(companyId, date, label)` — creates Holiday record
    - `listHolidays(companyId)` — returns all holidays for company
  - Create `crm_facturation_api/src/calendar/calendar.controller.ts`
    - `GET /calendar/events?from=&to=`
    - `POST /holidays`, `GET /holidays`
  - Create `crm_facturation_api/src/calendar/calendar.module.ts`
  - _Requirements: 8.1–8.5, 9.1–9.5_

- [x] 30. Create `BidModule` with service and controller for vendor bid views
  - Create `crm_facturation_api/src/contracting/bid/bid.service.ts`
    - `getMyBids(companyId)` — returns all Devis where `biddingSeller.id === companyId`; includes parent workflow title, buyer company name; includes BC details when `bidStatus === BC_PENDING_VENDOR`
    - `getBidDetail(bidId, actorCompanyId)` — returns full Devis with negotiation thread; validates access
  - Create `crm_facturation_api/src/contracting/bid/bid.controller.ts`
    - `GET /bids/mine`
    - `GET /bids/:bidId`
  - Create `crm_facturation_api/src/contracting/bid/bid.module.ts`
  - _Requirements: 12.1–12.4_

## Phase 5: Property-Based Tests

- [x] 31. Write PBT for Property 1 — Bid Total Calculation Invariant
  - Install `fast-check` as a dev dependency in `crm_facturation_api`
  - Create `crm_facturation_api/src/domain-services/__tests__/invoice-calculator.pbt.spec.ts`
  - Use `fc.array(arbitraryDocumentItem(), { minLength: 1, maxLength: 20 })` and `fc.float({ min: 0, max: 50 })` for globalDiscountPercentage
  - Assert `Math.abs(doc.totalTTC - (doc.subTotalHT + doc.totalTVA)) < 0.001` for all inputs
  - Tag: `// Feature: contract-and-bidding, Property 1`
  - _Requirements: Property 1_

- [x] 32. Write PBT for Property 2 — Work Item Status Derivation Invariant
  - Create `crm_facturation_api/src/domain-services/__tests__/work-item-status.pbt.spec.ts`
  - Use `fc.array(fc.record({ status: fc.constantFrom('todo','in-progress','completed') }), { minLength: 1 })`
  - Assert the three-way derivation rule holds for all inputs
  - Tag: `// Feature: contract-and-bidding, Property 2`
  - _Requirements: Property 2_

- [x] 33. Write PBT for Property 3 — Payment Schedule Completeness
  - Create `crm_facturation_api/src/domain-services/__tests__/payment-schedule.pbt.spec.ts`
  - Generate arbitrary `startDate` and `endDate` pairs where `endDate > startDate` (within 5 years)
  - Assert installment count equals `Math.ceil(monthsBetween(startDate, endDate))`
  - Assert no `dueDate` falls on Saturday (day 6) or Sunday (day 0)
  - Tag: `// Feature: contract-and-bidding, Property 3`
  - _Requirements: Property 3_

- [x] 34. Write PBT for Property 4 — Calendar Conflict Detection Correctness
  - Create `crm_facturation_api/src/domain-services/__tests__/calendar-conflict.pbt.spec.ts`
  - Generate pairs of WorkItems with arbitrary date ranges and a shared `sellerCompanyId`
  - Assert: if ranges overlap → both have conflicts; if ranges don't overlap → neither has conflicts
  - Assert: buyer-role work items never have conflicts regardless of overlap
  - Tag: `// Feature: contract-and-bidding, Property 4`
  - _Requirements: Property 4_

- [x] 35. Write PBT for Property 5 — Negotiation Message Thread Integrity
  - Create `crm_facturation_api/src/contracting/negotiation/__tests__/negotiation-thread.pbt.spec.ts`
  - Generate arrays of NegotiationMessage objects with random `bidId` values
  - Assert that filtering by a target `bidId` returns exactly the right count, ordered by `createdAt` ASC, with no cross-bid leakage
  - Tag: `// Feature: contract-and-bidding, Property 5`
  - _Requirements: Property 5_

- [x] 36. Write PBT for Property 6 — State Machine Monotonicity
  - Create `crm_facturation_api/src/marketplace/__tests__/state-machine.pbt.spec.ts`
  - Generate arbitrary `currentState` and attempt backward transitions
  - Assert that applying any backward transition throws an error and leaves `stateCode` unchanged
  - Assert the single exception: `rejectTest()` is allowed from `UNDER_TEST` → `IN_PROGRESS`
  - Tag: `// Feature: contract-and-bidding, Property 6`
  - _Requirements: Property 6_

- [x] 37. Write PBT for Property 7 — BC Reference Number Uniqueness
  - Create `crm_facturation_api/src/contracting/__tests__/bc-reference.pbt.spec.ts`
  - Generate arrays of `{ year, workflowId, sequence }` inputs
  - Assert that `generateBCReference(year, workflowId, sequence)` produces unique strings for all distinct inputs
  - Tag: `// Feature: contract-and-bidding, Property 7`
  - _Requirements: Property 7_

## Phase 6: Frontend API Wiring

- [x] 38. Wire `WorkflowsView` to real API
  - Replace `INITIAL_RFPS`, `INITIAL_BIDS`, `INITIAL_CONTRACTS` static imports with `useEffect` API calls using `api.ts`
  - On mount: fetch `GET /workflows/active` for Marketplace tab, `GET /workflows?mine=true` for My RFPs tab, `GET /bids/mine` for My Bids tab, `GET /workflows/contracts` for My Contracts tab
  - Add loading spinner state while fetching; add error state on failure
  - Wire `acceptBid()` → `POST /workflows/:id/bids/accept`
  - Wire `rejectBid()` → `POST /workflows/:id/bids/:bidId/reject`
  - Wire `vendorAcceptBC()` → `POST /workflows/:id/bc/confirm`
  - Wire `submitBid()` → `POST /workflows/:id/bids`
  - Wire RFP creation form → `POST /workflows` (include `workflowType` field)
  - Wire negotiation messages in `BidNegotiation` component → `GET /workflows/:id/bids/:bidId/messages` on load, `POST /workflows/:id/bids/:bidId/messages` on send
  - _Requirements: 18.1_

- [x] 39. Wire `WorkBoard` to real API
  - On mount: fetch `GET /works/:workId/tasks` to load initial tasks
  - Wire `addTask()` → `POST /works/:workId/tasks`
  - Wire `moveTask()` / `updateTaskDetails()` → `PATCH /works/:workId/tasks/:taskId`
  - Wire `deleteTask()` → `DELETE /works/:workId/tasks/:taskId`
  - Wire `postComment()` → `POST /works/:workId/tasks/:taskId/comments`
  - Optimistically update local state before API call; revert on error
  - _Requirements: 18.2_

- [x] 40. Wire `CalendarView` to real API
  - Remove `import { INITIAL_CONTRACTS } from '../workflows/WorkflowsView'`
  - On mount and on month change: fetch `GET /calendar/events?from=YYYY-MM-DD&to=YYYY-MM-DD` using the first and last day of the displayed month
  - Map API response `CalendarEvent` records to the existing event rendering logic
  - Show `hasConflict` indicator on conflicting events (e.g. red border or warning icon)
  - Clicking a calendar event navigates to the corresponding contract via `contractId` from the event response
  - _Requirements: 18.3_

- [x] 41. Wire `TeamsView` to real API
  - On mount: fetch `GET /teams` to load team list
  - Wire team creation form → `POST /teams`
  - Wire team update → `PATCH /teams/:id`
  - Wire `GET /teams/:id` for team detail view (members + assigned work items)
  - Wire add member → `POST /teams/:id/members`
  - Wire remove member → `DELETE /teams/:id/members/:userId`
  - Add loading and error states
  - _Requirements: 18.4_

- [x] 42. Add global 401/403 error handling in `api.ts`
  - Intercept HTTP 401 responses and redirect to `/login`
  - Intercept HTTP 403 responses and surface a permission-denied toast/message without crashing the component
  - _Requirements: 18.5, 18.6_
