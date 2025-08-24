import type { Part, PartId } from "../types";

export const PARTS: Part[] = [
  // 1) Data Capture
  {
    id: "capture" as PartId,
    title: "Data Capture",
    weight: 0.35,
    questions: [
      {
        id: "capture_q1",
        weight: 1.5,
        prompt:
          "How do you ingest data from your primary operational systems?",
        description:
          "Think about how your CRM or ERP data lands in your analytics environment—do you click ‘Export’ or have a fully managed pipeline with SLAs?",
        answers: [
          {
            label:
              "None – all exports are manual (CSV/XLS emailed or uploaded).",
            value: 0,
          },
          {
            label:
              "Ad hoc –  you have build custom scripts to run, but they often require manual fixes or restarts.",
            value: 1,
          },
          {
            label:
              "Partially automated – you use commercial or open-source connectors for scheduled loads, but setup is bespoke per source.",
            value: 2,
          },
          {
            label:
              "Fully automated – A standarized ETL/ELT framework automatically ingests all primary systems with monitoring, alerts, and retry logic.",
            value: 3,
          },
        ],
      },
      {
        id: "capture_q2",
        weight: 1.5,
        prompt:
          "How are unstructured or external data sources (APIs, logs, files) collected?",
        description:
          "Think about how your team brings in data from logs, third party APIs, webhooks, or file drops—do you click ‘download,’ run home-grown scripts, or rely on a managed ingestion service?",
        answers: [
          {
            label:
              "None – you’re not leveraging these data types systematically—blind spots in customer behavior, system performance, or enrichment.",
            value: 0,
          },
          {
            label:
              "Manual staging – you’ve identified value but still depend on manual downloads—risk of stale or incomplete data, high analyst effort.",
            value: 1,
          },
          {
            label:
              "Scripted ingestion – some automation exists, but it’s fragmented: each API or log source has its own script, maintenance burden grows linearly.",
            value: 2,
          },
          {
            label:
              "Unified ingestion – you’ve consolidated into a single tool or framework that handles structured and unstructured sources alike, with built-in retries, logging, and alerts.",
            value: 3,
          },
        ],
      },
      {
        id: "capture_q3",
        weight: 1,
        prompt:
          "How do you enforce data quality at capture—completeness, formats, validity?",
        description:
          "Quality at source prevents garbage downstream. Do you rely on manual inspections, some automated scripts, or a full rules engine that gates bad records before they enter your warehouse?",
        answers: [
          {
            label:
              "No validation – data often arrives with missing fields, bad formats, or out-of-range values; downstream teams spend time troubleshooting.",
            value: 0,
          },
          {
            label:
              "Occasional spot-checks –  quality issues are caught reactively; not scalable and risk slipping through between checks.",
            value: 1,
          },
          {
            label:
              "Automated Feed Checks – some feeds have basic validations, but gaps remain—bad data may still propagate if feeds change.",
            value: 2,
          },
          {
            label:
              "Real-time quality gates – a centralized validation layer enforces rules at ingest, immediately alerting or halting bad data flows.",
            value: 3,
          },
        ],
      },
      {
        id: "capture_q4",
        weight: 1,
        prompt:
          "How do you document or catalog new data sources when added?",
        description:
          "Documenting sources ensures discoverability and accountability. Do you track new feeds only in a sheet, use a lightweight wiki/catalog, or enforce catalog entries with full metadata and ownership?",
        answers: [
          {
            label:
              "No documentation – new sources aren’t tracked — teams rely on tribal knowledge or ad-hoc emails.",
            value: 0,
          },
          {
            label:
              "Spreadsheet inventory – teams list sources in a central spreadsheet with basic details (name, owner, update cadence, etc.).",
            value: 1,
          },
          {
            label:
              "Light cataloging – sources registered in a shared data catalog or wiki; metadata is incomplete or inconsistently updated.",
            value: 2,
          },
          {
            label:
              "Data catalog – all sources ingested via a governed catalog with rich metadata, ownership, schemas, and tags.",
            value: 3,
          },
        ],
      },
      {
        id: "capture_q5",
        weight: 0.8,
        prompt:
          "How frequently do you refresh raw data from source systems?",
        description:
          "Think about when fresh data becomes available for analysis—only when requested, on a coarse schedule, daily with some manual steps, or continuously without human intervention.",
        answers: [
          {
            label:
              "On-demand only – data is pulled only when someone manually requests or exports it.",
            value: 0,
          },
          {
            label:
              "Periodic (weekly/monthly) – scheduled refreshes occur weekly or monthly with no finer granularity.",
            value: 1,
          },
          {
            label:
              "Daily / business-hour – data loads run daily (or during business hours) but require manual triggers or oversight.",
            value: 2,
          },
          {
            label:
              "Continuous & automated – ingestion is continuous or near-real time (e.g. streaming or frequent microbatches) with no manual steps.",
            value: 3,
          },
        ],
      },
    ],
  },

  // 2) Storage & Integration
  {
    id: "storage" as PartId,
    title: "Storage & Integration",
    weight: 0.35,
    questions: [
      {
        id: "storage_q1",
        weight: 1.2,
        prompt: "Where do you store historical datasets?",
        description:
          "Think about where your analysts go to find six months or more of past data—only on their desktops, in a shared folder, or through a managed database/lake with scheduled loads?",
        answers: [
          {
            label: "Local files only – data lives only on individual desktops or in ad-hoc local folders.",
            value: 0,
          },
          {
            label:
              "Shared drive or cloud folder – files are stored in a shared network drive or generic cloud folder.",
            value: 1,
          },
          {
            label:
              "Central database or data lake (manual loads) – you have a central relational database or data lake, but loads are triggered manually or via standalone scripts.",
            value: 2,
          },
          {
            label:
              "Automated warehouse/lake – a centralized data warehouse or lake ingests historical datasets on a scheduled, automated cadence.",
            value: 3,
          },
        ],
      },
      {
        id: "storage_q2",
        weight: 1.0,
        prompt: "How are new data sources onboarded?",
        description:
          "Think about how you add a new system or file feed—do you manually export and drop files, tweak a script, maintain a bespoke pipeline, or simply point-and-click in a self-service tool?",
        answers: [
          {
            label:
              "Ad-hoc file drops – new sources arrive via manual CSV/FTP/email; no repeatable process exists.",
            value: 0,
          },
          {
            label:
              "Scripted imports with hand-tuning – you’ve built import scripts, but each new source requires manual code edits and run-book tweaks.",
            value: 1,
          },
          {
            label:
              "Scheduled ETL jobs (custom per source) – ETL/ELT jobs run on a schedule for each source, but each pipeline is custom coded and maintained separately.",
            value: 2,
          },
          {
            label:
              "Self-service ingestion framework – a templated connector framework lets business users onboard new sources via configuration, not code.",
            value: 3,
          },
        ],
      },
      {
        id: "storage_q3",
        weight: 0.8,
        prompt:
          "How do you manage schema or source-system changes (columns added/renamed)?",
        description:
          "Consider how your pipelines or reports react when a source adds or renames a field—do they break silently, require manual updates, trigger alerts, or adapt automatically?",
        answers: [
          {
            label:
              "Break-fix ad hoc – Schema changes routinely break reports or pipelines; fixes are applied manually after failures occur.",
            value: 0,
          },
          {
            label:
              "Manual updates – team members proactively update scripts or spreadsheets when they learn of a change—but the process is manual.",
            value: 1,
          },
          {
            label:
              "Monitored alerts & patches – automated alerts notify you of failures; you then patch jobs or mappings before full downstream impact.",
            value: 2,
          },
          {
            label:
              "Automated schema evolution – a migration framework automatically adapts to schema changes with tests.",
            value: 3,
          },
        ],
      },
      {
        id: "storage_q4",
        weight: 0.5,
        prompt:
          "How do stakeholders access the integrated data for analysis? ",
        description:
          "Consider how non-technical users get the data they need — do they still download spreadsheets, rely on analysts, use static dashboards, or have full self-service tools?",
        answers: [
          {
            label:
              "Direct file exports – stakeholders export data manually (CSV/XLS) from source systems.",
            value: 0,
          },
          {
            label:
              "Analyst-only queries – only analysts run queries against the central repository; results are shared manually.",
            value: 1,
          },
          {
            label:
              "Published dashboards – business users view read-only dashboards or reports published by the analytics team.",
            value: 2,
          },
          {
            label:
              "Self-service analytics – stakeholders have governed, self-service access—SQL queries, parameterized dashboards, and role-based controls.",
            value: 3,
          },
        ],
      },
      {
        id: "storage_q5",
        weight: 1.5,
        prompt:
          "How do you reconcile or deduplicate overlapping datasets?",
        description:
          "Overlapping records can skew your analytics. Do you leave duplicates unchecked, clean them by hand, flag them automatically, or eliminate them in-flight with lineage?",
        answers: [
          {
            label:
              "No reconciliation – duplicate or overlapping data proliferates; no deduplication processes exist.",
            value: 0,
          },
          {
            label:
              "Manual de-dupe – analysts manually identify and remove duplicates in spreadsheets or SQL queries.",
            value: 1,
          },
          {
            label:
              "Automated duplicate flags – scripts or jobs automatically flag potential duplicates for review—but human intervention is still required.",
            value: 2,
          },
          {
            label:
              "Built-in deduplication & lineage – deduplication logic runs as part of your ETL/ELT pipelines or warehouse, with full lineage tracking.",
            value: 3,
          },
        ],
      },
    ],
  },

  // 3) Analytics & Reporting
  {
    id: "analytics" as PartId,
    title: "Analytics & Reporting",
    weight: 0.18,
    questions: [
      {
        id: "analytics_q1",
        weight: 1.5,
        prompt: "How do you create and distribute standard reports?",
        description:
          "Standard reports are your go-to for routine insights—do you build them by hand, send static files on a schedule, use basic read-only dashboards, or offer interactive, self-service analytics and alerts?",
        answers: [
          {
            label:
              "Manual exports – analysts manually export data into PPT/Excel for each report and email or share the file.",
            value: 0,
          },
          {
            label:
              "Scheduled static delivery – reports are generated automatically (e.g. CSV or PPT) and emailed on a set schedule but remain static.",
            value: 1,
          },
          {
            label:
              "Interactive dashboards (read-only) – auto-refreshing dashboards exist, but users can only view preset views—no ad-hoc slicing or parameterization.",
            value: 2,
          },
          {
            label:
              "Self-service dashboards & alerts – fully parameterized dashboards plus scheduled alerts; users explore data and subscribe to KPI notifications.",
            value: 3,
          },
        ],
      },
      {
        id: "analytics_q2",
        weight: 1.0,
        prompt:
          "How are key business KPIs defined, tracked, and version-controlled?",
        description:
          "Think about where your organization’s ‘official’ metrics live—only in people’s heads or slides, in ad-hoc spreadsheets, in your BI tool, or in a centralized, versioned glossary?",
        answers: [
          {
            label:
              "No formal definitions – KPIs aren’t documented—each report owner defines metrics in their own spreadsheets or slides without version control.",
            value: 0,
          },
          {
            label:
              "Spreadsheets with filename versions – KPI definitions live in shared spreadsheets, with versioning via file names (e.g., KPIs_v2_FINAL.xlsx).",
            value: 1,
          },
          {
            label:
              "BI-Tool Definitions – KPIs are defined in your BI platform with basic descriptions; version history is manual or light (e.g., comments).",
            value: 2,
          },
          {
            label:
              "Central KPI glossary & automated tracking – KPIs reside in a governed glossary/catalog with full metadata, lineage, and automated change tracking and approvals.",
            value: 3,
          },
        ],
      },
      {
        id: "analytics_q3",
        weight: 1.3,
        prompt: "How do users explore data or perform ad-hoc analyses?",
        description:
          "Think about how non-standard questions get answered—do analysts recreate sheets, share notebooks, or can anyone spin up queries via a governed portal?",
        answers: [
          {
            label:
              "One-off spreadsheets – analysts build one-off Excel/Google Sheets for each ad-hoc request.",
            value: 0,
          },
          {
            label:
              "Shared notebooks/queries – analysts maintain shared notebooks (Jupyter/Colab) or SQL scripts, but governance and discovery are limited.",
            value: 1,
          },
          {
            label:
              "Governed SQL workspaces – stakeholders use shared SQL environments or BI explorers with role-based access and schema guidance.",
            value: 2,
          },
          {
            label:
              "Self-service analytics portal – a full self-service portal lets users browse governed datasets, build queries, and save/share analyses.",
            value: 3,
          },
        ],
      },
      {
        id: "analytics_q4",
        weight: 0.8,
        prompt:
          "How do you handle reports or dashboard changes when requirements evolve?",
        description:
          "Think about how you handle evolving requirements—do you rebuild, duplicate and tweak, track changes formally, or enable users to reconfigure dashboards on the fly?",
        answers: [
          {
            label:
              "Rebuild from scratch – each time requirements evolve, analysts recreate reports or dashboards manually without reuse.",
            value: 0,
          },
          {
            label:
              "Copy & modify – teams clone existing reports/dashboards and tweak them for new needs, leading to proliferation of versions.",
            value: 1,
          },
          {
            label:
              "Versioned with change logs – dashboards live under version control or in BI tool history; all updates are logged and auditable.",
            value: 2,
          },
          {
            label:
              "Configurable & parameterized – dashboards are built with parameters and modular components so users can adjust metrics, filters, or layouts without cloning.",
            value: 3,
          },
        ],
      },
      {
        id: "analytics_q5",
        weight: 0.7,
        prompt:
          "How do you measure report usage and stakeholder engagement?",
        description:
          "Effective engagement measurement helps prioritize your analytics roadmap. Do you have no data, rely on surveys, use basic view-counts, or analyze detailed usage patterns and alerts?",
        answers: [
          {
            label:
              "No tracking – you have no metrics on report or dashboard consumption—usage is entirely anecdotal or unknown.",
            value: 0,
          },
          {
            label:
              "Manual surveys & feedback – you solicit user feedback or conduct surveys periodically to gauge report usefulness and usage.",
            value: 1,
          },
          {
            label:
              "Basic BI tool metrics – you rely on built-in view-counts, last-access timestamps, or simple usage logs provided by your BI platform.",
            value: 2,
          },
          {
            label:
              "Advanced engagement analytics – you track detailed engagement—heatmaps, user paths, drop-off alerts, and adoption trends via a dedicated analytics layer.",
            value: 3,
          },
        ],
      },
    ],
  },

  // 4) Governance & Automation
  {
    id: "governance" as PartId,
    title: "Governance & Automation",
    weight: 0.12,
    questions: [
      {
        id: "governance_q1",
        weight: 1.0,
        prompt:
          "How is data ownership and stewardship assigned within your organization?",
        description:
          "Data ownership clarifies who’s responsible for quality, access, and lifecycle. Is it informal, listed in a sheet, tracked but unchecked, or enforced with automated workflows?",
        answers: [
          {
            label:
              "No clear ownership – no defined data owners or stewards—responsibility is entirely ad hoc or assumed.",
            value: 0,
          },
          {
            label:
              "Spreadsheet of owners – data owners and stewards are listed in a shared spreadsheet, but there’s no enforcement or reminders.",
            value: 1,
          },
          {
            label:
              "Catalog-tracked ownership – ownership is recorded in a data catalog or metadata tool, but assignments aren’t actively enforced.",
            value: 2,
          },
          {
            label:
              "Enforced stewardship & alerts – ownership is enforced via tooling: catalog entries must include an owner, and automated reminders/notifications drive accountability.",
            value: 3,
          },
        ],
      },
      {
        id: "governance_q2",
        weight: 1.3,
        prompt:
          "How do you manage access controls and permissions for data assets?",
        description:
          "Think about how you grant and review permissions—anyone can get data, you rely on manual tickets, you’ve defined roles in your systems, or you have dynamic policies that adjust access automatically and log every change?",
        answers: [
          {
            label:
              "Open access or ad hoc requests – data is freely available or access requires individual manual requests and approvals without formal roles.",
            value: 0,
          },
          {
            label:
              "Manual provisioning – access is granted by IT or data teams on a per-user basis (e.g. tickets, emails), with limited auditing.",
            value: 1,
          },
          {
            label:
              "Role-based access control – permissions are managed via predefined roles or groups in your central systems (warehouse, BI tool, catalog).",
            value: 2,
          },
          {
            label:
              "Dynamic attribute-based control – access policies automatically enforce attribute-based rules (e.g. department, sensitivity), with full audit trails.",
            value: 3,
          },
        ],
      },
      {
        id: "governance_q3",
        weight: 1.2,
        prompt:
          "How do you monitor and enforce data quality, lineage, and compliance across your data platforms?",
        description:
          "Effective governance requires visibility and action. Do you rely on no checks, occasional audits, scheduled validations, or a live system that both monitors and fixes issues automatically?",
        answers: [
          {
            label:
              "No monitoring – you have no systematic checks—data issues, lineage gaps, and compliance risks go undetected.",
            value: 0,
          },
          {
            label:
              "Periodic spot audits – teams conduct manual or ad hoc audits occasionally to check quality and lineage; compliance reviews are infrequent.",
            value: 1,
          },
          {
            label:
              "Scheduled audits & lineage reports – automated jobs run at set intervals to validate data quality and generate lineage/compliance reports.",
            value: 2,
          },
          {
            label:
              "Continuous monitoring & remediation – a real-time monitoring framework enforces quality rules, tracks lineage, and automatically remediates issues or escalates alerts.",
            value: 3,
          },
        ],
      },
      {
        id: "governance_q4",
        weight: 0.8,
        prompt:
          "How do you alert on pipeline failures, data anomalies, or governance breaches?",
        description:
          "Think about how your team knows when something breaks—no alerts, simple emails, chat notifications for major issues, or a full escalation system across channels?",
        answers: [
          {
            label:
              "No alerts – failures and anomalies go unnoticed until reported by users or discovered downstream.",
            value: 0,
          },
          {
            label:
              "Email notifications – automated emails are sent when jobs fail or anomalies are detected—but they may be missed in busy inboxes.",
            value: 1,
          },
          {
            label:
              "Alerts - push to Slack (or Teams) and email, but only for high-severity failures; others are unmonitored.",
            value: 2,
          },
          {
            label:
              "Multi-channel alerts with escalation policies – automated alerts across email, chat, SMS, or PagerDuty, with defined escalation and on-call rotations.",
            value: 3,
          },
        ],
      },
      {
        id: "governance_q5",
        weight: 0.7,
        prompt:
          "How do you document policies, standards, and procedures?",
        description:
          "Effective governance requires clear, discoverable, and versioned policies. Are your standards only in people’s minds, in unstructured docs, in a searchable portal, or enforced through integrated, versioned approval workflows?",
        answers: [
          {
            label:
              "Tribal knowledge – policies and procedures exist only in people’s heads or ad-hoc conversations—no written artifacts.",
            value: 0,
          },
          {
            label:
              "Shared documents – you store your policies in shared docs (e.g. Google Drive, SharePoint) but there’s no enforced structure, versioning, or discoverability.",
            value: 1,
          },
          {
            label:
              "Governance portal – policies live in a dedicated governance portal or wiki with search and basic version history, but updates rely on manual edits.",
            value: 2,
          },
          {
            label:
              "Integrated, versioned workflows – policies and standards are codified in your data platform or catalog; each change goes through an approval workflow with version control and audit logs.",
            value: 3,
          },
        ],
      },
    ],
  },
];

/** Stage labels (0..6) */
export const OVERALL_STAGE_LABELS: Record<number, string> = {
  0: "Stage 0: No digitalization",
  1: "Stage 1: Spreadsheets & PPT",
  2: "Stage 2: Centralization & Dashboards",
  3: "Stage 3: Automated Pipelines & Warehouse",
  4: "Stage 4: Real-Time & Governed Platforms",
  5: "Stage 5: Automated Reporting & Alerts",
  6: "Stage 6: Advanced ML/AI Integration",
};

/** Recommendations by stage — tweak copy as needed */
export const OVERALL_RECS_BY_STAGE: Record<number, string> = {
  0: "Today, your organization operates entirely on manual spreadsheets, slide decks, and adhoc file transfers, with no shared data repository, no automated pipelines, no dashboards, and no governance in place. Insights only emerge when someone remembers to assemble the numbers, which leads to stale information, hidden errors, and constant firefighting.",
  1: "At this stage, you’ve taken initial steps toward centralization—perhaps automating one or two data pulls and storing results in shared drives—but most insights still rely on spreadsheets and manual slide-deck updates. While you’ve reduced some repetitive work, inconsistencies linger, data often feels stale, and nearly every new question still triggers hours of analyst effort.",
  2: "You’ve moved past purely ad-hoc spreadsheets and slide decks: multiple data pulls now land in a shared repository, and you’ve stood up basic dashboards that refresh automatically. Yet onboarding new sources still involves custom work, data-quality checks are uneven, and reporting depends on periodic exports rather than live views—so insights are more reliable than before, but still lag behind your business needs.",
  3: "You’ve moved beyond basic spreadsheets and shared folders into a central data platform with automated loads, self-service dashboards, and scheduled governance checks. Teams no longer wrestle with manual exports, but onboarding new sources still requires custom work, real-time alerts are spotty, and ownership or policy enforcement relies on occasional audits rather than always-on controls. As a result, you enjoy more reliable insights than before, yet gaps in monitoring and governance can still lead to unexpected data issues or delays.",
  4: "At this stage, your organization streams most of its data into a central platform on a nearreal-time basis, with reusable ingestion templates, self-service dashboards, and a governed metric library in place. You enforce role-based access controls and run scheduled audits that track data lineage and quality, so your teams generally trust the numbers. However, alerts only fire for critical failures and policy or ownership reviews occur on a set cadence, meaning some issues can still slip through and require manual intervention.",
  5: "You’ve built a robust data platform: core systems feed a central repository through reusable pipelines, self-service dashboards deliver up-to-date insights, and governance jobs run in real time to validate data quality and enforce access controls. Yet while failures now trigger alerts, escalation paths and automated fixes aren’t fully wired—so issues still require manual intervention before they’re resolved.",
  6: "Your organization operates on a fully automated, real-time data platform: all core systems feed continuously into a centralized repository with built-in quality gates, schema evolution, and deduplication. Dashboards refresh instantly, governed KPIs drive every report, and multi-channel alerts plus policy-as-code automatically remediate any issues. You not only deliver reliable insights but also power predictive models and AI services with feature-ready data.",
};
