import { ZodError } from "zod";
import { normalizeProjectFuelProfiles } from "../model/fuels";
import { normalizeLoadedProject, type LoadOptions } from "../model/project-normalize";
import { factoryProjectSchema } from "../model/schemas";
import type { FactoryProject } from "../model/types";

export class FactoryJsonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FactoryJsonError";
  }
}

/**
 * A plan's JSON as a project. It keeps the mode the plan was saved in: every
 * plan that arrives lands on the board through the store (`markHydratedProject`,
 * `loadViewedProject`), and that is where it becomes a plan-mode project, so
 * the one conversion also gets to tell the player what it could not carry over.
 */

/** 份额夹在 0..1 并丢掉非数值：旧方案里可能存过越界值，保存时不能因此失败。 */
function clampSpareShares<T extends { spareShares?: Record<string, Record<string, number>> }>(project: T): T {
  const shares = project.spareShares;
  if (!shares) return project;
  const next: Record<string, Record<string, number>> = {};
  for (const [leftover, bearers] of Object.entries(shares)) {
    const clamped: Record<string, number> = {};
    for (const [bearer, value] of Object.entries(bearers)) {
      clamped[bearer] = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
    }
    next[leftover] = clamped;
  }
  return { ...project, spareShares: next };
}

export function parseFactoryProjectJson(source: string, options?: LoadOptions): FactoryProject {
  let raw: unknown;

  try {
    raw = JSON.parse(source);
  } catch (error) {
    throw new FactoryJsonError(
      `Invalid JSON: ${error instanceof Error ? error.message : "Unknown parse error"}`,
    );
  }

  try {
    return normalizeLoadedProject(factoryProjectSchema.parse(raw), { keepMode: true, ...options });
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues
        .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
        .join("; ");
      throw new FactoryJsonError(`Invalid factory project: ${issues}`);
    }

    throw error;
  }
}

export function serializeFactoryProject(project: FactoryProject): string {
  const validatedProject = factoryProjectSchema.parse(normalizeProjectFuelProfiles(clampSpareShares(project)));
  return `${JSON.stringify(validatedProject, null, 2)}\n`;
}

export function cloneImportedProject(project: FactoryProject): FactoryProject {
  return {
    ...project,
    metadata: {
      ...project.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}
