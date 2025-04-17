import { eq } from 'drizzle-orm';
import {
  AnyMySqlColumn,
  MySqlTable,
  TableConfig,
} from 'drizzle-orm/mysql-core';
import { DbClient } from '@/infra/db';

interface TableColumn<T extends MySqlTable<TableConfig>> {
  table: T;
  column: keyof T['_']['columns'] & string;
}

interface ValidationContext<T = unknown> {
  field: string;
  value: T;
  errors: Record<string, string[]>;
  db: DbClient;
}

type ValidationFunction = (context: ValidationContext) => Promise<void>;

class ValidationRule {
  private validations: ValidationFunction[] = [];

  async apply(context: ValidationContext): Promise<void> {
    for (const validation of this.validations) {
      await validation(context);
    }
  }

  unique<T extends MySqlTable<TableConfig>>({ table, column }: TableColumn<T>) {
    this.validations.push(async ({ value, field, errors, db }) => {
      const columnRef = table[column as keyof T] as AnyMySqlColumn;

      const exists = await db
        .select()
        .from(table)
        .where(eq(columnRef, value))
        .limit(1);

      if (exists.length > 0) {
        errors[field] ??= [];
        errors[field].push(`${field} must be unique`);
      }
    });

    return this;
  }

  exists<T extends MySqlTable<TableConfig>>({ table, column }: TableColumn<T>) {
    this.validations.push(async ({ value, field, errors, db }) => {
      const columnRef = table[column as keyof T] as AnyMySqlColumn;

      const exists = await db
        .select()
        .from(table)
        .where(eq(columnRef, value))
        .limit(1);

      if (exists.length === 0) {
        errors[field] ??= [];
        errors[field].push(`${field} does not exist`);
      }
    });

    return this;
  }
}

export class DbValidationError extends Error {
  readonly errors: Record<string, string[]>;
  readonly code = 'DB_ERR_VALIDATION';

  constructor(errors: Record<string, string[]>) {
    super('Validation failed');
    this.name = 'DbValidationError';
    this.errors = errors;
  }
}

export class DbValidator {
  private readonly db;

  constructor({ db }: { db: DbClient }) {
    this.db = db;
  }

  async validate<T>(
    data: T,
    rules: Record<keyof T, ValidationRule>,
  ): Promise<void> {
    const errors: Record<string, string[]> = {};

    const validations = Object.keys(rules).map(async (field) => {
      const rule = rules[field as keyof T];
      const value = data[field as keyof T];
      await rule.apply({ value, field, errors, db: this.db });
    });

    await Promise.all(validations);

    if (Object.keys(errors).length > 0) {
      throw new DbValidationError(errors);
    }
  }
}

export const v = {
  unique: <T extends MySqlTable<TableConfig>>(params: TableColumn<T>) =>
    new ValidationRule().unique(params),
  exists: <T extends MySqlTable<TableConfig>>(params: TableColumn<T>) =>
    new ValidationRule().exists(params),
};
