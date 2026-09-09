/**
 * Rolls the whole demo dataset forward in time.
 *
 * The demo database is seeded once with 12 months of history. Left alone, that
 * history slowly recedes into the past and the dashboards start to look
 * abandoned. This shifts every timestamp column in the schema forward by the
 * number of whole days since the data was last current, which keeps relative
 * spacing intact — an order invoiced three days after it shipped still is.
 *
 * Running it also counts as database activity, which stops Neon archiving an
 * idle branch.
 */

/** Tables that must never be shifted. */
const EXCLUDED_TABLES = new Set(['_prisma_migrations']);

/** The column used to decide how stale the dataset is. */
const ANCHOR_TABLE = 'telemetry_readings';
const ANCHOR_COLUMN = 'timestamp';

export interface RefreshResult {
  shiftedDays: number;
  tablesUpdated: number;
  columnsUpdated: number;
  skipped: boolean;
}

type RawClient = {
  $queryRawUnsafe: <T = unknown>(sql: string, ...args: unknown[]) => Promise<T>;
  $executeRawUnsafe: (sql: string, ...args: unknown[]) => Promise<number>;
};

export async function refreshDemoData(db: RawClient): Promise<RefreshResult> {
  const anchor = await db.$queryRawUnsafe<{ latest: Date | null }[]>(
    `select max("${ANCHOR_COLUMN}") as latest from "${ANCHOR_TABLE}"`,
  );
  const latest = anchor[0]?.latest;

  if (!latest) {
    return {
      shiftedDays: 0,
      tablesUpdated: 0,
      columnsUpdated: 0,
      skipped: true,
    };
  }

  const days = Math.floor(
    (Date.now() - new Date(latest).getTime()) / 86_400_000,
  );
  if (days < 1) {
    return {
      shiftedDays: 0,
      tablesUpdated: 0,
      columnsUpdated: 0,
      skipped: true,
    };
  }

  // Every timestamp column in the public schema.
  const columns = await db.$queryRawUnsafe<
    { table_name: string; column_name: string }[]
  >(
    `select table_name, column_name
         from information_schema.columns
        where table_schema = 'public'
          and data_type in ('timestamp without time zone', 'timestamp with time zone')`,
  );

  const targets = columns.filter((c) => !EXCLUDED_TABLES.has(c.table_name));
  const tables = new Set<string>();

  for (const c of targets) {
    await db.$executeRawUnsafe(
      `update "${c.table_name}"
          set "${c.column_name}" = "${c.column_name}" + ($1 || ' days')::interval
        where "${c.column_name}" is not null`,
      String(days),
    );
    tables.add(c.table_name);
  }

  return {
    shiftedDays: days,
    tablesUpdated: tables.size,
    columnsUpdated: targets.length,
    skipped: false,
  };
}
