/**
 * Procedurally generates believable enterprise Java, indented with 4 spaces,
 * and hides exactly one tab character in place of one 4-space indent group.
 *
 * The tab always replaces a full group at a tab stop (column 0, 4, 8, ...), so
 * with tabSize = 4 it renders pixel-identical to the spaces around it.
 */

export interface Haystack {
  text: string;
  /** Character offset of the tab in `text`. */
  tabOffset: number;
  /** 1-based line number of the tab. */
  tabLine: number;
  /** 0-based column of the tab on its line. */
  tabCol: number;
  lineCount: number;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COMPANIES = ["acme", "globex", "initech", "umbrella", "vandelay", "hooli", "wayne", "stark"];
const MODULES = ["billing", "orders", "inventory", "ledger", "identity", "shipping", "pricing", "audit"];
const SUBS = ["core", "impl", "internal", "legacy", "api", "domain", "infra", "support"];
const PREFIX = ["Abstract", "Default", "Base", "Legacy", "Enterprise", "Generic", "Composite", "Cached", "Async", "Simple"];
const NOUNS = [
  "Customer", "Invoice", "Order", "Widget", "Session", "Payment", "Ledger", "Tenant", "Shipment",
  "Account", "Policy", "Claim", "Voucher", "Coupon", "Catalog", "Warehouse", "Report", "Schedule",
  "Contract", "Quote", "Refund", "Subscription", "Approval", "Dispute", "Settlement",
];
const SUFFIX = [
  "Service", "ServiceImpl", "Manager", "Factory", "Provider", "Repository", "Controller", "Handler",
  "Adapter", "Strategy", "Facade", "Delegate", "Processor", "Validator", "Resolver", "Mapper",
  "Builder", "Registry", "Coordinator", "Orchestrator", "FactoryBean", "Interceptor",
];
const TYPES = [
  "String", "int", "long", "boolean", "BigDecimal", "LocalDate", "UUID", "List<String>",
  "Map<String, Object>", "Optional<Long>", "Instant", "Integer", "Set<UUID>", "Duration",
];
const FIELD_NAMES = [
  "id", "name", "status", "createdAt", "updatedAt", "version", "tenantId", "correlationId", "amount",
  "currency", "retryCount", "enabled", "priority", "region", "ownerId", "externalRef", "batchSize",
  "timeoutMillis", "maxAttempts", "description", "checksum", "locale", "parentId", "sequence",
];
const VERBS = ["process", "handle", "resolve", "validate", "reconcile", "synchronize", "dispatch", "apply", "compute", "normalize", "enrich", "publish", "hydrate", "settle"];
const ARGS = ["request", "context", "command", "event", "payload", "envelope", "batch", "input"];
const EXCEPTIONS = ["DataAccessException", "IOException", "IllegalStateException", "TimeoutException", "OptimisticLockException", "ServiceUnavailableException"];
const ANNOTATIONS = ["@Service", "@Component", "@Transactional", "@Slf4j", "@Deprecated", "@SuppressWarnings(\"unchecked\")", "@Repository", "@Singleton"];
const COMMENTS = [
  "TODO: remove after migration",
  "FIXME: this should never be null but it is in prod",
  "Do not touch. See JIRA-4471.",
  "Legacy path, kept for backwards compatibility",
  "Temporary workaround (2016)",
  "This is intentional.",
  "Ask Dave before changing this",
  "Copied from the old module, unclear if still needed",
  "Optimistic locking handled upstream",
  "Not thread safe. Probably fine.",
];

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function gerund(verb: string) {
  return cap(verb.replace(/e$/, "")) + "ing";
}

export function generateHaystack(lineCount: number, seed: number): Haystack {
  const rand = mulberry32(seed);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)] as T;
  const chance = (p: number) => rand() < p;
  const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));

  const lines: string[] = [];
  // Indent level (in groups of 4 spaces) per line, used to choose where the tab goes.
  const levels: number[] = [];

  const push = (level: number, text: string) => {
    lines.push(level === 0 ? text : "    ".repeat(level) + text);
    levels.push(text.length === 0 ? 0 : level);
  };
  const blank = () => {
    lines.push("");
    levels.push(0);
  };

  const emitBody = (level: number, depth: number, fields: string[]) => {
    const stmts = int(2, 5);
    for (let i = 0; i < stmts; i++) {
      const kind = rand();
      if (kind < 0.18 && depth < 3) {
        const cond = pick([
          `${pick(ARGS)} == null`,
          `!${pick(fields)}Enabled`,
          `${pick(fields)} > ${int(0, 500)}`,
          `${pick(ARGS)}.getItems().isEmpty()`,
          `Objects.equals(${pick(fields)}, ${pick(ARGS)}.get${cap(pick(FIELD_NAMES))}())`,
          `!isValid(${pick(ARGS)})`,
        ]);
        push(level, `if (${cond}) {`);
        emitBody(level + 1, depth + 1, fields);
        if (chance(0.4)) {
          push(level, `} else {`);
          emitBody(level + 1, depth + 1, fields);
        }
        push(level, `}`);
      } else if (kind < 0.3 && depth < 3) {
        push(level, `for (${pick(["Item", "Entry", "Line", "Record", "Node"])} ${pick(["item", "entry", "line", "record", "node"])} : ${pick(ARGS)}.get${cap(pick(["items", "entries", "lines", "records", "children"]))}()) {`);
        emitBody(level + 1, depth + 1, fields);
        push(level, `}`);
      } else if (kind < 0.4 && depth < 2) {
        push(level, `try {`);
        emitBody(level + 1, depth + 1, fields);
        push(level, `} catch (${pick(EXCEPTIONS)} e) {`);
        push(level + 1, `LOGGER.error("Failed to ${pick(VERBS)} {}", ${pick(ARGS)}, e);`);
        if (chance(0.6)) push(level + 1, `throw new ServiceException(e);`);
        if (chance(0.3)) {
          push(level, `} finally {`);
          push(level + 1, `metrics.increment("${pick(MODULES)}.${pick(VERBS)}.${pick(["attempts", "failures", "latency"])}");`);
        }
        push(level, `}`);
      } else {
        const f = pick(fields);
        push(
          level,
          pick([
            `LOGGER.debug("${gerund(pick(VERBS))} {} for tenant {}", ${pick(ARGS)}, tenantId);`,
            `this.${f} = ${pick(ARGS)}.get${cap(f)}();`,
            `${pick(["total", "result", "acc", "sum"])} = ${pick(["total", "result", "acc", "sum"])}.add(${pick(ARGS)}.getAmount());`,
            `${pick(["repository", "dao", "store", "client"])}.save(${pick(ARGS)});`,
            `${pick(["eventBus", "publisher", "outbox"])}.publish(new ${pick(NOUNS)}${pick(["Created", "Updated", "Settled", "Rejected"])}Event(${pick(ARGS)}));`,
            `Objects.requireNonNull(${pick(ARGS)}, "${pick(ARGS)} must not be null");`,
            `${pick(["validator", "guard", "policy"])}.check(${pick(ARGS)});`,
            `Thread.sleep(${pick([10, 50, 100, 250, 1000])}); // ${pick(["backoff", "rate limit", "do not remove", "flaky otherwise"])}`,
            `final ${pick(TYPES)} ${pick(FIELD_NAMES)}${int(1, 9)} = ${pick(["resolve", "lookup", "compute", "load"])}${cap(pick(NOUNS))}(${pick(ARGS)});`,
            `cache.invalidate(${pick(ARGS)}.getId());`,
            `// ${pick(COMMENTS)}`,
          ]),
        );
      }
    }
  };

  while (lines.length < lineCount) {
    const company = pick(COMPANIES);
    const module = pick(MODULES);
    const sub = pick(SUBS);
    const noun = pick(NOUNS);
    const suffix = pick(SUFFIX);
    const prefix = chance(0.6) ? pick(PREFIX) : "";
    const className = `${prefix}${noun}${suffix}`;

    push(0, `package com.${company}.${module}.${sub};`);
    blank();
    const imports = new Set<string>([
      "java.util.Objects",
      "java.util.List",
      "org.slf4j.Logger",
      "org.slf4j.LoggerFactory",
      `com.${company}.${module}.api.${noun}${pick(["Request", "Command", "Event"])}`,
      `com.${company}.common.ServiceException`,
    ]);
    if (chance(0.5)) imports.add("java.math.BigDecimal");
    if (chance(0.5)) imports.add("java.util.Map");
    if (chance(0.4)) imports.add("java.util.Optional");
    if (chance(0.4)) imports.add("java.time.Instant");
    if (chance(0.3)) imports.add("javax.annotation.PostConstruct");
    for (const imp of [...imports].sort()) push(0, `import ${imp};`);
    blank();

    push(0, `/**`);
    push(0, ` * ${pick(["Handles", "Coordinates", "Owns", "Manages", "Wraps"])} ${noun.toLowerCase()} ${pick(["lifecycle", "processing", "reconciliation", "persistence", "orchestration"])} for the ${module} module.`);
    if (chance(0.5)) push(0, ` * <p>`);
    if (chance(0.5)) push(0, ` * ${pick(COMMENTS)}`);
    push(0, ` *`);
    push(0, ` * @since ${int(1, 9)}.${int(0, 14)}`);
    if (chance(0.5)) push(0, ` * @author ${pick(["dave", "jsmith", "migration-bot", "unknown", "a.varshney", "contractor"])}`);
    push(0, ` */`);
    const annCount = int(1, 3);
    for (let i = 0; i < annCount; i++) push(0, pick(ANNOTATIONS));
    const ext = chance(0.5) ? ` extends Abstract${noun}${pick(SUFFIX)}` : "";
    const impl = chance(0.7) ? ` implements ${noun}${pick(["Service", "Handler", "Port"])}${chance(0.3) ? ", Serializable" : ""}` : "";
    push(0, `public class ${className}${ext}${impl} {`);
    blank();
    push(1, `private static final long serialVersionUID = ${int(1, 9)}L;`);
    push(1, `private static final Logger LOGGER = LoggerFactory.getLogger(${className}.class);`);
    blank();

    const fieldCount = int(3, 7);
    const fields: string[] = [];
    const fieldTypes: string[] = [];
    for (let i = 0; i < fieldCount; i++) {
      const name = pick(FIELD_NAMES);
      if (fields.includes(name)) continue;
      const type = pick(TYPES);
      fields.push(name);
      fieldTypes.push(type);
      push(1, `private ${chance(0.5) ? "final " : ""}${type} ${name};`);
    }
    if (fields.length === 0) {
      fields.push("id");
      fieldTypes.push("UUID");
      push(1, `private UUID id;`);
    }
    blank();

    // Constructor
    push(1, `public ${className}(${fields.map((f, i) => `${fieldTypes[i]} ${f}`).join(", ")}) {`);
    for (const f of fields) push(2, `this.${f} = ${f};`);
    push(1, `}`);
    blank();

    // Getters/setters
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i] as string;
      const t = fieldTypes[i] as string;
      push(1, `public ${t} ${t === "boolean" ? "is" : "get"}${cap(f)}() {`);
      push(2, `return ${f};`);
      push(1, `}`);
      blank();
      if (chance(0.7)) {
        push(1, `public void set${cap(f)}(${t} ${f}) {`);
        push(2, `this.${f} = ${f};`);
        push(1, `}`);
        blank();
      }
    }

    // Methods
    const methodCount = int(2, 6);
    for (let m = 0; m < methodCount; m++) {
      if (chance(0.5)) push(1, `@Override`);
      if (chance(0.2)) push(1, `@Transactional(readOnly = ${chance(0.5)})`);
      const ret = pick(["void", "boolean", `${noun}Result`, "Optional<UUID>", "BigDecimal", "List<String>"]);
      const arg = pick(ARGS);
      push(1, `public ${ret} ${pick(VERBS)}${cap(noun)}(${cap(noun)}${pick(["Request", "Command", "Event"])} ${arg}) {`);
      emitBody(2, 0, fields);
      if (ret !== "void") {
        push(
          2,
          `return ${pick({
            boolean: ["true", "false", `${pick(fields)} != null`],
            "Optional<UUID>": [`Optional.ofNullable(${arg}.getId())`, "Optional.empty()"],
            BigDecimal: ["BigDecimal.ZERO", "total", `${arg}.getAmount()`],
            "List<String>": ["List.of()", "Collections.emptyList()", "result"],
          }[ret] ?? [`new ${noun}Result(${arg})`, `${noun}Result.ok()`, `${noun}Result.rejected("${pick(COMMENTS)}")`])};`,
        );
      }
      push(1, `}`);
      blank();
    }

    if (chance(0.4)) {
      push(1, `@Override`);
      push(1, `public String toString() {`);
      push(2, `return "${className}{" +`);
      for (let i = 0; i < fields.length; i++) {
        push(4, `"${i === 0 ? "" : ", "}${fields[i]}=" + ${fields[i]} +`);
      }
      push(4, `"}";`);
      push(1, `}`);
    }
    push(0, `}`);
    blank();
  }

  lines.length = lineCount;
  levels.length = lineCount;

  // Choose the victim line: any non-blank line with at least one indent group.
  const candidates: number[] = [];
  for (let i = 0; i < levels.length; i++) if ((levels[i] as number) > 0) candidates.push(i);
  const tabLineIndex = pick(candidates);
  const level = levels[tabLineIndex] as number;
  const group = Math.floor(rand() * level);
  const tabCol = group * 4;
  const original = lines[tabLineIndex] as string;
  lines[tabLineIndex] = original.slice(0, tabCol) + "\t" + original.slice(tabCol + 4);

  let tabOffset = 0;
  for (let i = 0; i < tabLineIndex; i++) tabOffset += (lines[i] as string).length + 1;
  tabOffset += tabCol;

  return {
    text: lines.join("\n"),
    tabOffset,
    tabLine: tabLineIndex + 1,
    tabCol,
    lineCount,
  };
}
