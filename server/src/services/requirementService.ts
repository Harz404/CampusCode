export class RequirementError extends Error { constructor(public status: number, message: string) { super(message); } }
export function requirementInput(body: Record<string, unknown>, creating = false) {
  const result: Record<string, any> = {};
  for (const [field, max] of Object.entries({ title: 200, description: 30000, problemStatement: 30000, category: 100, solutionType: 100, difficulty: 100 })) {
    if (body[field] === undefined && !(creating && ["title", "description", "category"].includes(field))) continue;
    if (typeof body[field] !== "string" || !(body[field] as string).trim() || (body[field] as string).length > max) throw new RequirementError(400, `Invalid requirement ${field}`);
    result[field] = (body[field] as string).trim();
  }
  for (const field of ["budgetMin", "budgetMax"]) {
    if (body[field] === undefined || body[field] === null) continue;
    if (typeof body[field] !== "number" || !Number.isFinite(body[field]) || (body[field] as number) <= 0) throw new RequirementError(400, "Budgets must be positive numbers");
    result[field] = body[field];
  }
  if (body.isFixedPrice !== undefined && typeof body.isFixedPrice !== "boolean") throw new RequirementError(400, "Invalid pricing type");
  if (body.isFixedPrice !== undefined) result.isFixedPrice = body.isFixedPrice;
  if (creating && body.isFixedPrice !== false && (!result.budgetMin || !result.budgetMax)) throw new RequirementError(400, "Provide the minimum and maximum budget");
  if (result.budgetMin && result.budgetMax && result.budgetMax < result.budgetMin) throw new RequirementError(400, "Maximum budget must not be lower than minimum budget");
  if (body.deadline) {
    if (typeof body.deadline !== "string" || !Number.isFinite(Date.parse(body.deadline)) || Date.parse(body.deadline) < Date.now()) throw new RequirementError(400, "Choose a future deadline");
    result.deadline = new Date(body.deadline);
  }
  for (const field of ["preferredTechnologies", "requiredFeatures", "expectedDeliverables"]) {
    if (body[field] === undefined) continue;
    if (!Array.isArray(body[field]) || (body[field] as unknown[]).length > 100 || (body[field] as unknown[]).some(value => typeof value !== "string" || value.length > 2000)) throw new RequirementError(400, `Invalid ${field}`);
    result[field] = body[field];
  }
  return result;
}
