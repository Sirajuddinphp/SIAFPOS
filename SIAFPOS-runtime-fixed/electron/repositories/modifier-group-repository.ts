import type Database from "better-sqlite3";
import type { ModifierGroup, ModifierOption } from "../../shared/contracts/catalog-contracts";

type GroupRow = {
  uuid: string;
  name: string;
  code: string;
  min_select: number;
  max_select: number;
  is_required: 0 | 1;
};

type ModifierRow = {
  uuid: string;
  modifier_group_uuid: string;
  name: string;
  code: string;
  price_delta_minor: number;
  is_active: 0 | 1;
};

export class ModifierGroupRepository {
  constructor(private readonly db: Database.Database) {}

  listByProduct(productUuid: string): ModifierGroup[] {
    const groups = this.db
      .prepare(
        `SELECT mg.uuid, mg.name, mg.code, mg.min_select, mg.max_select, mg.is_required
         FROM modifier_groups mg
         INNER JOIN product_modifier_groups pmg ON pmg.modifier_group_uuid = mg.uuid
         WHERE pmg.product_uuid = ? AND mg.is_active = 1
         ORDER BY pmg.sort_order, mg.name`
      )
      .all(productUuid) as GroupRow[];

    const modifiers = this.db
      .prepare(
        `SELECT uuid, modifier_group_uuid, name, code, price_delta_minor, is_active
         FROM modifiers
         WHERE modifier_group_uuid IN (
           SELECT modifier_group_uuid FROM product_modifier_groups WHERE product_uuid = ?
         ) AND is_active = 1
         ORDER BY name`
      )
      .all(productUuid) as ModifierRow[];

    return groups.map((group) => ({
      uuid: group.uuid,
      name: group.name,
      code: group.code,
      minSelect: group.min_select,
      maxSelect: group.max_select,
      isRequired: group.is_required === 1,
      modifiers: modifiers.filter((modifier) => modifier.modifier_group_uuid === group.uuid).map(mapModifier)
    }));
  }

  listModifierOptions(groupUuid: string): ModifierOption[] {
    return (
      this.db
        .prepare(
          `SELECT uuid, modifier_group_uuid, name, code, price_delta_minor, is_active
           FROM modifiers
           WHERE modifier_group_uuid = ? AND is_active = 1
           ORDER BY name`
        )
        .all(groupUuid) as ModifierRow[]
    ).map(mapModifier);
  }
}

function mapModifier(row: ModifierRow): ModifierOption {
  return {
    uuid: row.uuid,
    groupUuid: row.modifier_group_uuid,
    name: row.name,
    code: row.code,
    priceDeltaMinor: row.price_delta_minor,
    isActive: row.is_active === 1
  };
}
