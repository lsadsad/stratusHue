SET FOREIGN_KEY_CHECKS=0;
SET UNIQUE_CHECKS=0;
DROP TABLE IF EXISTS `child_counters`;
CREATE TABLE `child_counters` (
  `parent_id` varchar(255) NOT NULL,
  `last_child` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`parent_id`),
  CONSTRAINT `fk_counter_parent` FOREIGN KEY (`parent_id`) REFERENCES `issues` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `issue_id` varchar(255) NOT NULL,
  `author` varchar(255) NOT NULL,
  `text` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comments_created_at` (`created_at`),
  KEY `idx_comments_issue` (`issue_id`),
  CONSTRAINT `fk_comments_issue` FOREIGN KEY (`issue_id`) REFERENCES `issues` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
DROP TABLE IF EXISTS `compaction_snapshots`;
CREATE TABLE `compaction_snapshots` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `issue_id` varchar(255) NOT NULL,
  `compaction_level` int NOT NULL,
  `snapshot_json` blob NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comp_snap_issue` (`issue_id`,`compaction_level`,`created_at`),
  CONSTRAINT `fk_comp_snap_issue` FOREIGN KEY (`issue_id`) REFERENCES `issues` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
DROP TABLE IF EXISTS `config`;
CREATE TABLE `config` (
  `key` varchar(255) NOT NULL,
  `value` text NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
INSERT INTO `config` (`key`,`value`) VALUES ('auto_compact_enabled','false'), ('compact_batch_size','50'), ('compact_parallel_workers','5'), ('compact_tier1_days','30'), ('compact_tier1_dep_levels','2'), ('compact_tier2_commits','100'), ('compact_tier2_days','90'), ('compact_tier2_dep_levels','5'), ('compaction_enabled','false'), ('issue_prefix','stratusHue'), ('schema_version','7');
DROP TABLE IF EXISTS `dependencies`;
CREATE TABLE `dependencies` (
  `issue_id` varchar(255) NOT NULL,
  `depends_on_id` varchar(255) NOT NULL,
  `type` varchar(32) NOT NULL DEFAULT 'blocks',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) NOT NULL,
  `metadata` json DEFAULT (json_object()),
  `thread_id` varchar(255) DEFAULT '',
  PRIMARY KEY (`issue_id`,`depends_on_id`),
  KEY `idx_dependencies_depends_on` (`depends_on_id`),
  KEY `idx_dependencies_depends_on_type` (`depends_on_id`,`type`),
  KEY `idx_dependencies_issue` (`issue_id`),
  KEY `idx_dependencies_thread` (`thread_id`),
  CONSTRAINT `fk_dep_issue` FOREIGN KEY (`issue_id`) REFERENCES `issues` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
INSERT INTO `dependencies` (`issue_id`,`depends_on_id`,`type`,`created_at`,`created_by`,`metadata`,`thread_id`) VALUES ('stratusHue-07p','stratusHue-xq7','blocks','2026-03-21 12:18:14','L3ViN','{}',''), ('stratusHue-3gx','stratusHue-xq7','blocks','2026-03-21 12:17:51','L3ViN','{}',''), ('stratusHue-dt6','stratusHue-3gx','blocks','2026-03-21 12:18:40','L3ViN','{}',''), ('stratusHue-dt6','stratusHue-edq','blocks','2026-03-21 12:18:29','L3ViN','{}',''), ('stratusHue-dt6','stratusHue-syv','blocks','2026-03-21 12:18:35','L3ViN','{}',''), ('stratusHue-edq','stratusHue-07p','blocks','2026-03-21 12:17:51','L3ViN','{}',''), ('stratusHue-le3','stratusHue-sob','blocks','2026-03-21 12:18:23','L3ViN','{}',''), ('stratusHue-syv','stratusHue-sob','blocks','2026-03-21 12:17:51','L3ViN','{}','');
DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `issue_id` varchar(255) NOT NULL,
  `event_type` varchar(32) NOT NULL,
  `actor` varchar(255) NOT NULL,
  `old_value` text,
  `new_value` text,
  `comment` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_events_created_at` (`created_at`),
  KEY `idx_events_issue` (`issue_id`),
  CONSTRAINT `fk_events_issue` FOREIGN KEY (`issue_id`) REFERENCES `issues` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
INSERT INTO `events` (`id`,`issue_id`,`event_type`,`actor`,`old_value`,`new_value`,`comment`,`created_at`) VALUES ('10c03d2e-0272-4145-90d4-6ea14a41a3f2','stratusHue-3gx','created','L3ViN','','',NULL,'2026-03-21 12:17:06'), ('2e07497b-b7cc-4d3f-9fa3-67d90add097d','stratusHue-edq','created','L3ViN','','',NULL,'2026-03-21 12:16:56'), ('2f14d8a1-b47d-484c-b341-98cb3f7a7e45','stratusHue-dt6','created','L3ViN','','',NULL,'2026-03-21 12:14:51'), ('3bdb466e-cc7d-4354-8a74-163234570f7c','stratusHue-sob','created','L3ViN','','',NULL,'2026-03-21 12:16:21'), ('4315679a-a9a6-4ce1-b98c-0714fb69cbab','stratusHue-syv','created','L3ViN','','',NULL,'2026-03-21 12:16:56'), ('58f4676b-cd3f-41da-b07d-b1ab00caa6b2','stratusHue-cqv','created','L3ViN','','',NULL,'2026-03-21 12:16:29'), ('af4f6699-810e-4c28-8fea-3b04f43a5634','stratusHue-vhz','created','L3ViN','','',NULL,'2026-03-21 12:16:21'), ('d45aa63b-a3a7-4505-8649-2003cdf110a2','stratusHue-hsu','created','L3ViN','','',NULL,'2026-03-21 12:16:21'), ('d8039aa6-16a9-4f8b-8920-cb085314aed1','stratusHue-le3','created','L3ViN','','',NULL,'2026-03-21 12:17:16'), ('e4a16cfd-0777-4146-af3d-0b23eb51f00b','stratusHue-xq7','created','L3ViN','','',NULL,'2026-03-21 12:16:38'), ('f8a9324d-8991-4b43-a59c-a30650f6cd32','stratusHue-07p','created','L3ViN','','',NULL,'2026-03-21 12:16:56');
DROP TABLE IF EXISTS `federation_peers`;
CREATE TABLE `federation_peers` (
  `name` varchar(255) NOT NULL,
  `remote_url` varchar(1024) NOT NULL,
  `username` varchar(255),
  `password_encrypted` blob,
  `sovereignty` varchar(8) DEFAULT '',
  `last_sync` datetime,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`name`),
  KEY `idx_federation_peers_sovereignty` (`sovereignty`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
DROP TABLE IF EXISTS `interactions`;
CREATE TABLE `interactions` (
  `id` varchar(32) NOT NULL,
  `kind` varchar(64) NOT NULL,
  `created_at` datetime NOT NULL,
  `actor` varchar(255),
  `issue_id` varchar(255),
  `model` varchar(255),
  `prompt` text,
  `response` text,
  `error` text,
  `tool_name` varchar(255),
  `exit_code` int,
  `parent_id` varchar(32),
  `label` varchar(64),
  `reason` text,
  `extra` json,
  PRIMARY KEY (`id`),
  KEY `idx_interactions_created_at` (`created_at`),
  KEY `idx_interactions_issue_id` (`issue_id`),
  KEY `idx_interactions_kind` (`kind`),
  KEY `idx_interactions_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
DROP TABLE IF EXISTS `issue_counter`;
CREATE TABLE `issue_counter` (
  `prefix` varchar(255) NOT NULL,
  `last_id` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`prefix`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
DROP TABLE IF EXISTS `issue_snapshots`;
CREATE TABLE `issue_snapshots` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `issue_id` varchar(255) NOT NULL,
  `snapshot_time` datetime NOT NULL,
  `compaction_level` int NOT NULL,
  `original_size` int NOT NULL,
  `compressed_size` int NOT NULL,
  `original_content` text NOT NULL,
  `archived_events` text,
  PRIMARY KEY (`id`),
  KEY `idx_snapshots_issue` (`issue_id`),
  KEY `idx_snapshots_level` (`compaction_level`),
  CONSTRAINT `fk_snapshots_issue` FOREIGN KEY (`issue_id`) REFERENCES `issues` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
DROP TABLE IF EXISTS `issues`;
CREATE TABLE `issues` (
  `id` varchar(255) NOT NULL,
  `content_hash` varchar(64),
  `title` varchar(500) NOT NULL,
  `description` text NOT NULL,
  `design` text NOT NULL,
  `acceptance_criteria` text NOT NULL,
  `notes` text NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'open',
  `priority` int NOT NULL DEFAULT '2',
  `issue_type` varchar(32) NOT NULL DEFAULT 'task',
  `assignee` varchar(255),
  `estimated_minutes` int,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) DEFAULT '',
  `owner` varchar(255) DEFAULT '',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `closed_at` datetime,
  `closed_by_session` varchar(255) DEFAULT '',
  `external_ref` varchar(255),
  `spec_id` varchar(1024),
  `compaction_level` int DEFAULT '0',
  `compacted_at` datetime,
  `compacted_at_commit` varchar(64),
  `original_size` int,
  `sender` varchar(255) DEFAULT '',
  `ephemeral` tinyint(1) DEFAULT '0',
  `no_history` tinyint(1) DEFAULT '0',
  `wisp_type` varchar(32) DEFAULT '',
  `pinned` tinyint(1) DEFAULT '0',
  `is_template` tinyint(1) DEFAULT '0',
  `crystallizes` tinyint(1) DEFAULT '0',
  `mol_type` varchar(32) DEFAULT '',
  `work_type` varchar(32) DEFAULT 'mutex',
  `quality_score` double,
  `source_system` varchar(255) DEFAULT '',
  `metadata` json DEFAULT (json_object()),
  `source_repo` varchar(512) DEFAULT '',
  `close_reason` text DEFAULT '',
  `event_kind` varchar(32) DEFAULT '',
  `actor` varchar(255) DEFAULT '',
  `target` varchar(255) DEFAULT '',
  `payload` text DEFAULT '',
  `await_type` varchar(32) DEFAULT '',
  `await_id` varchar(255) DEFAULT '',
  `timeout_ns` bigint DEFAULT '0',
  `waiters` text DEFAULT '',
  `hook_bead` varchar(255) DEFAULT '',
  `role_bead` varchar(255) DEFAULT '',
  `agent_state` varchar(32) DEFAULT '',
  `last_activity` datetime,
  `role_type` varchar(32) DEFAULT '',
  `rig` varchar(255) DEFAULT '',
  `due_at` datetime,
  `defer_until` datetime,
  PRIMARY KEY (`id`),
  KEY `idx_issues_assignee` (`assignee`),
  KEY `idx_issues_created_at` (`created_at`),
  KEY `idx_issues_external_ref` (`external_ref`),
  KEY `idx_issues_issue_type` (`issue_type`),
  KEY `idx_issues_priority` (`priority`),
  KEY `idx_issues_spec_id` (`spec_id`),
  KEY `idx_issues_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
INSERT INTO `issues` (`id`,`content_hash`,`title`,`description`,`design`,`acceptance_criteria`,`notes`,`status`,`priority`,`issue_type`,`assignee`,`estimated_minutes`,`created_at`,`created_by`,`owner`,`updated_at`,`closed_at`,`closed_by_session`,`external_ref`,`spec_id`,`compaction_level`,`compacted_at`,`compacted_at_commit`,`original_size`,`sender`,`ephemeral`,`no_history`,`wisp_type`,`pinned`,`is_template`,`crystallizes`,`mol_type`,`work_type`,`quality_score`,`source_system`,`metadata`,`source_repo`,`close_reason`,`event_kind`,`actor`,`target`,`payload`,`await_type`,`await_id`,`timeout_ns`,`waiters`,`hook_bead`,`role_bead`,`agent_state`,`last_activity`,`role_type`,`rig`,`due_at`,`defer_until`) VALUES ('stratusHue-07p','5f85a1fe9edb4eb8c05165df78975579d35c5bb06039df670dad7cfda228f934','Sandbox: create pages and structure from recipe (layer ①)','Feature module (src/features/scaffold-engine.ts) that creates Figma pages from recipe layer ①: correct page order, emoji prefixes, page dividers (separator pages). Idempotent — detect if pages already exist and skip or update rather than duplicate.','','','','open',1,'task',NULL,NULL,'2026-03-21 19:16:56','L3ViN','levin@okdomo.com','2026-03-21 19:16:56',NULL,'',NULL,'',0,NULL,NULL,NULL,'',0,0,'',0,0,0,'','',NULL,'','{}','','','','','','','','',0,'','','','',NULL,'','',NULL,NULL), ('stratusHue-3gx','2cf287b105b06ec48bc6ec027991009ce7f7d0acfc14147981c231dd4ab51bd7','UI: Scaffold tab — recipe selector and apply','Implement the Scaffold mode UI (src/ui/scaffold/scaffold-ui.ts, currently a placeholder). Shows available recipes (name, description, page count). User selects one, sees a preview summary, then applies it. Sends scaffold-apply message to sandbox. Shows progress and result notification.','','','','open',1,'task',NULL,NULL,'2026-03-21 19:17:07','L3ViN','levin@okdomo.com','2026-03-21 19:17:07',NULL,'',NULL,'',0,NULL,NULL,NULL,'',0,0,'',0,0,0,'','',NULL,'','{}','','','','','','','','',0,'','','','',NULL,'','',NULL,NULL), ('stratusHue-cqv','9f65935614667553f7d2459b2b31d1232e2253f9dbf0fe304d57923b9ee4109a','Readiness Check: full recipe audit (recipe diff)','Full handoff readiness check that diffs the current Figma file state against the applied recipe. Checks all five layers: ① structure (required pages present), ② content (variables filled and approved), ③ annotations (required categories per page), ④ token thresholds met, ⑤ component compliance. Produces a pass/fail readiness report.','','','','open',3,'feature',NULL,NULL,'2026-03-21 19:16:29','L3ViN','levin@okdomo.com','2026-03-21 19:16:29',NULL,'',NULL,'',0,NULL,NULL,NULL,'',0,0,'',0,0,0,'','',NULL,'','{}','','','','','','','','',0,'','','','',NULL,'','',NULL,NULL), ('stratusHue-dt6','79eeabca10d5e87f6da53afb917697e16033db6b424aef6dc5a19fc9fe0af2b9','Phase 3: Scaffold mode — epic','Full implementation of the Scaffold mode tab. Scaffold reads recipe layers ①② (structure + content) to create pages, section containers, content frames, and variable placeholders in a Figma file. This epic tracks all sub-tasks: recipe schema, sandbox implementation, UI, and team sharing.','','','','open',1,'feature',NULL,NULL,'2026-03-21 19:14:51','L3ViN','levin@okdomo.com','2026-03-21 19:14:51',NULL,'',NULL,'',0,NULL,NULL,NULL,'',0,0,'',0,0,0,'','',NULL,'','{}','','','','','','','','',0,'','','','',NULL,'','',NULL,NULL), ('stratusHue-edq','eb653f16d4a2831a7f47502ad98f690d29d82f0898fea92816ca3109353dc13d','Sandbox: create content templates from recipe (layer ②)','Extend scaffold engine to create layer ② content per page: starter frames, section containers, text nodes with placeholder copy, and Figma variable placeholders using the naming convention from the schema design issue. Variable names must follow the tool-agnostic convention.','','','','open',1,'task',NULL,NULL,'2026-03-21 19:16:56','L3ViN','levin@okdomo.com','2026-03-21 19:16:56',NULL,'',NULL,'',0,NULL,NULL,NULL,'',0,0,'',0,0,0,'','',NULL,'','{}','','','','','','','','',0,'','','','',NULL,'','',NULL,NULL), ('stratusHue-hsu','9893f91895e3655620f2e426a140b5a627ade4af287ff8c4c9a6c14ba03ba4b9','Validate Phase 2: Token audit (variable coverage)','Add token audit to Validate mode. Per-page scan of variable (token) coverage against recipe-defined thresholds (e.g. color ≥90%, spacing ≥80%, type ≥85%). Report coverage percentages and flag pages below threshold. Depends on recipe schema existing.','','','','open',3,'feature',NULL,NULL,'2026-03-21 19:16:21','L3ViN','levin@okdomo.com','2026-03-21 19:16:21',NULL,'',NULL,'',0,NULL,NULL,NULL,'',0,0,'',0,0,0,'','',NULL,'','{}','','','','','','','','',0,'','','','',NULL,'','',NULL,NULL), ('stratusHue-le3','e48525552cfafd926afd517ac859bc9f3d8efc217cb94bb1376caa1751058f80','Recipe JSON import/export and team sharing','Allow teams to import/export recipe JSON files from the plugin UI. Scaffold tab includes Import Recipe (reads JSON file via file input, validates, stores to clientStorage) and Export Recipe (downloads current recipe as JSON). This is how teams distribute and update their standardized templates.','','','','open',2,'feature',NULL,NULL,'2026-03-21 19:17:17','L3ViN','levin@okdomo.com','2026-03-21 19:17:17',NULL,'',NULL,'',0,NULL,NULL,NULL,'',0,0,'',0,0,0,'','',NULL,'','{}','','','','','','','','',0,'','','','',NULL,'','',NULL,NULL), ('stratusHue-sob','e8d5a208b9b72d8d9000a343b57d15a67e408cdd13c084c6fede06f2fa8ce57a','Design recipe JSON schema (layers ①②)','Define the recipe JSON format that Scaffold reads. Must cover: layer ① structure (pages, order, emoji prefixes, dividers) and layer ② content (starter frames, section containers, text nodes, variable placeholders with naming convention). Schema must be designed for future extension to layers ③④⑤ (annotations, tokens, components). Variable naming convention must be tool-agnostic so a future content interface can read it. Document in docs/features/SCAFFOLD_MODE.md.','','','','open',1,'task',NULL,NULL,'2026-03-21 19:16:21','L3ViN','levin@okdomo.com','2026-03-21 19:16:21',NULL,'',NULL,'',0,NULL,NULL,NULL,'',0,0,'',0,0,0,'','',NULL,'','{}','','','','','','','','',0,'','','','',NULL,'','',NULL,NULL), ('stratusHue-syv','ef45d701cd1c898fa5b0ebb0064ae9b780c1c46833ed6c9fd5fadba2b9daf99e','Sandbox: stamp recipe to file (recipe metadata)','After Scaffold applies a recipe, write recipe metadata to figma.root.setPluginData: recipe ID, version, timestamp, applied-by. This stamp is what Validate reads to know which recipe to diff against. Define the stamp schema alongside the recipe schema.','','','','open',1,'task',NULL,NULL,'2026-03-21 19:16:57','L3ViN','levin@okdomo.com','2026-03-21 19:16:57',NULL,'',NULL,'',0,NULL,NULL,NULL,'',0,0,'',0,0,0,'','',NULL,'','{}','','','','','','','','',0,'','','','',NULL,'','',NULL,NULL), ('stratusHue-vhz','65510788099c1af1bbf001d6e673f67ca67ef0527531e183027d133cfd523b2e','Validate Phase 3: Component check (library compliance)','Add component check to Validate mode. Per-page audit of component instances: flag detached components, components from unapproved libraries, and outdated component versions. Compliance rules sourced from recipe layer ⑤.','','','','open',3,'feature',NULL,NULL,'2026-03-21 19:16:21','L3ViN','levin@okdomo.com','2026-03-21 19:16:21',NULL,'',NULL,'',0,NULL,NULL,NULL,'',0,0,'',0,0,0,'','',NULL,'','{}','','','','','','','','',0,'','','','',NULL,'','',NULL,NULL), ('stratusHue-xq7','80b48828c52412ce61e8c3cc642d8da0c7ff7a5242290df6d8763eecb3a4e695','Sandbox: recipe loader and parser','Sandbox-side module that loads a recipe JSON (from clientStorage or file import), validates its structure, and exposes typed recipe data to the Scaffold feature module. Handles versioning/schema migration if recipe format evolves.','','','','open',1,'task',NULL,NULL,'2026-03-21 19:16:38','L3ViN','levin@okdomo.com','2026-03-21 19:16:38',NULL,'',NULL,'',0,NULL,NULL,NULL,'',0,0,'',0,0,0,'','',NULL,'','{}','','','','','','','','',0,'','','','',NULL,'','',NULL,NULL);
DROP TABLE IF EXISTS `labels`;
CREATE TABLE `labels` (
  `issue_id` varchar(255) NOT NULL,
  `label` varchar(255) NOT NULL,
  PRIMARY KEY (`issue_id`,`label`),
  KEY `idx_labels_label` (`label`),
  CONSTRAINT `fk_labels_issue` FOREIGN KEY (`issue_id`) REFERENCES `issues` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
DROP TABLE IF EXISTS `metadata`;
CREATE TABLE `metadata` (
  `key` varchar(255) NOT NULL,
  `value` text NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
INSERT INTO `metadata` (`key`,`value`) VALUES ('_project_id','17dd5471-dca5-4462-ab8e-211bc2bb293b'), ('bd_version','0.61.0'), ('clone_id','fc0524284148fd98'), ('last_import_time','2026-03-21T10:58:59-07:00'), ('repo_id','95c2d912e798fcd04dd92092f53dba95');
DROP TABLE IF EXISTS `repo_mtimes`;
CREATE TABLE `repo_mtimes` (
  `repo_path` varchar(512) NOT NULL,
  `jsonl_path` varchar(512) NOT NULL,
  `mtime_ns` bigint NOT NULL,
  `last_checked` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`repo_path`),
  KEY `idx_repo_mtimes_checked` (`last_checked`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
DROP TABLE IF EXISTS `routes`;
CREATE TABLE `routes` (
  `prefix` varchar(32) NOT NULL,
  `path` varchar(512) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`prefix`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
DROP TABLE IF EXISTS `wisp_comments`;
CREATE TABLE `wisp_comments` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `issue_id` varchar(255) NOT NULL,
  `author` varchar(255) DEFAULT '',
  `text` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wisp_comments_issue` (`issue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
DROP TABLE IF EXISTS `wisp_dependencies`;
CREATE TABLE `wisp_dependencies` (
  `issue_id` varchar(255) NOT NULL,
  `depends_on_id` varchar(255) NOT NULL,
  `type` varchar(32) NOT NULL DEFAULT 'blocks',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) DEFAULT '',
  `metadata` json DEFAULT (json_object()),
  `thread_id` varchar(255) DEFAULT '',
  PRIMARY KEY (`issue_id`,`depends_on_id`),
  KEY `idx_wisp_dep_depends` (`depends_on_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
DROP TABLE IF EXISTS `wisp_events`;
CREATE TABLE `wisp_events` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `issue_id` varchar(255) NOT NULL,
  `event_type` varchar(32) NOT NULL,
  `actor` varchar(255) DEFAULT '',
  `old_value` text DEFAULT '',
  `new_value` text DEFAULT '',
  `comment` text DEFAULT '',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wisp_events_issue` (`issue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
DROP TABLE IF EXISTS `wisp_labels`;
CREATE TABLE `wisp_labels` (
  `issue_id` varchar(255) NOT NULL,
  `label` varchar(255) NOT NULL,
  PRIMARY KEY (`issue_id`,`label`),
  KEY `idx_wisp_labels_label` (`label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
DROP TABLE IF EXISTS `wisps`;
CREATE TABLE `wisps` (
  `id` varchar(255) NOT NULL,
  `content_hash` varchar(64),
  `title` varchar(500) NOT NULL,
  `description` text NOT NULL DEFAULT '',
  `design` text NOT NULL DEFAULT '',
  `acceptance_criteria` text NOT NULL DEFAULT '',
  `notes` text NOT NULL DEFAULT '',
  `status` varchar(32) NOT NULL DEFAULT 'open',
  `priority` int NOT NULL DEFAULT '2',
  `issue_type` varchar(32) NOT NULL DEFAULT 'task',
  `assignee` varchar(255),
  `estimated_minutes` int,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) DEFAULT '',
  `owner` varchar(255) DEFAULT '',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `closed_at` datetime,
  `closed_by_session` varchar(255) DEFAULT '',
  `external_ref` varchar(255),
  `spec_id` varchar(1024),
  `compaction_level` int DEFAULT '0',
  `compacted_at` datetime,
  `compacted_at_commit` varchar(64),
  `original_size` int,
  `sender` varchar(255) DEFAULT '',
  `ephemeral` tinyint(1) DEFAULT '0',
  `no_history` tinyint(1) DEFAULT '0',
  `wisp_type` varchar(32) DEFAULT '',
  `pinned` tinyint(1) DEFAULT '0',
  `is_template` tinyint(1) DEFAULT '0',
  `crystallizes` tinyint(1) DEFAULT '0',
  `mol_type` varchar(32) DEFAULT '',
  `work_type` varchar(32) DEFAULT 'mutex',
  `quality_score` double,
  `source_system` varchar(255) DEFAULT '',
  `metadata` json DEFAULT (json_object()),
  `source_repo` varchar(512) DEFAULT '',
  `close_reason` text DEFAULT '',
  `event_kind` varchar(32) DEFAULT '',
  `actor` varchar(255) DEFAULT '',
  `target` varchar(255) DEFAULT '',
  `payload` text DEFAULT '',
  `await_type` varchar(32) DEFAULT '',
  `await_id` varchar(255) DEFAULT '',
  `timeout_ns` bigint DEFAULT '0',
  `waiters` text DEFAULT '',
  `hook_bead` varchar(255) DEFAULT '',
  `role_bead` varchar(255) DEFAULT '',
  `agent_state` varchar(32) DEFAULT '',
  `last_activity` datetime,
  `role_type` varchar(32) DEFAULT '',
  `rig` varchar(255) DEFAULT '',
  `due_at` datetime,
  `defer_until` datetime,
  PRIMARY KEY (`id`),
  KEY `idx_wisps_assignee` (`assignee`),
  KEY `idx_wisps_created_at` (`created_at`),
  KEY `idx_wisps_external_ref` (`external_ref`),
  KEY `idx_wisps_issue_type` (`issue_type`),
  KEY `idx_wisps_priority` (`priority`),
  KEY `idx_wisps_spec_id` (`spec_id`),
  KEY `idx_wisps_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
CREATE OR REPLACE VIEW blocked_issues AS
SELECT
    i.*,
    (SELECT COUNT(*)
     FROM dependencies d
     WHERE d.issue_id = i.id
       AND d.type = 'blocks'
       AND EXISTS (
         SELECT 1 FROM issues blocker
         WHERE blocker.id = d.depends_on_id
           AND blocker.status NOT IN ('closed', 'pinned')
       )
    ) as blocked_by_count
FROM issues i
WHERE i.status NOT IN ('closed', 'pinned')
  AND EXISTS (
    SELECT 1 FROM dependencies d
    WHERE d.issue_id = i.id
      AND d.type = 'blocks'
      AND EXISTS (
        SELECT 1 FROM issues blocker
        WHERE blocker.id = d.depends_on_id
          AND blocker.status NOT IN ('closed', 'pinned')
      )
  );
CREATE OR REPLACE VIEW ready_issues AS
WITH RECURSIVE
  blocked_directly AS (
    SELECT DISTINCT d.issue_id
    FROM dependencies d
    WHERE d.type = 'blocks'
      AND EXISTS (
        SELECT 1 FROM issues blocker
        WHERE blocker.id = d.depends_on_id
          AND blocker.status NOT IN ('closed', 'pinned')
      )
  ),
  blocked_transitively AS (
    SELECT issue_id, 0 as depth
    FROM blocked_directly
    UNION ALL
    SELECT d.issue_id, bt.depth + 1
    FROM blocked_transitively bt
    JOIN dependencies d ON d.depends_on_id = bt.issue_id
    WHERE d.type = 'parent-child'
      AND bt.depth < 50
  )
SELECT i.*
FROM issues i
LEFT JOIN blocked_transitively bt ON bt.issue_id = i.id
WHERE i.status = 'open'
  AND (i.ephemeral = 0 OR i.ephemeral IS NULL)
  AND bt.issue_id IS NULL
  AND (i.defer_until IS NULL OR i.defer_until <= NOW())
  AND NOT EXISTS (
    SELECT 1 FROM dependencies d_parent
    JOIN issues parent ON parent.id = d_parent.depends_on_id
    WHERE d_parent.issue_id = i.id
      AND d_parent.type = 'parent-child'
      AND parent.defer_until IS NOT NULL
      AND parent.defer_until > NOW()
  );
