import type Database from "better-sqlite3";
import { app } from "electron";
import { RestaurantRepository } from "../../repositories/restaurant-repository";
import { OutletRepository } from "../../repositories/outlet-repository";
import { TerminalRepository } from "../../repositories/terminal-repository";
import { UserRepository } from "../../repositories/user-repository";
import { SettingsRepository } from "../../repositories/settings-repository";
import { hashPassword, hashPin } from "../../security/password";
import { logger } from "../../logger/logger";
import { randomUUID } from "node:crypto";

export function seedDevelopmentData(db: Database.Database): void {
  if (process.env.NODE_ENV === "production" || app.isPackaged) {
    return;
  }

  const restaurants = new RestaurantRepository(db);
  if (restaurants.count() > 0) {
    seedPhase2DemoData(db);
    return;
  }

  const seed = db.transaction(() => {
    const now = new Date().toISOString();
    const restaurant = restaurants.createDemoRestaurant(now);
    const outlet = new OutletRepository(db).createDemoOutlet(restaurant.uuid, now);
    const terminal = new TerminalRepository(db).createDemoTerminal(restaurant.uuid, outlet.uuid, app.getVersion(), now);
    new UserRepository(db).createDemoManager(restaurant.uuid, outlet.uuid, hashPassword("admin123"), hashPin("1234"), now);

    const settings = new SettingsRepository(db);
    settings.set("restaurant.default_code", restaurant.code, "string", false, now);
    settings.set("outlet.default_code", outlet.code, "string", false, now);
    settings.set("terminal.default_code", terminal.code, "string", false, now);
  });

  seed();
  seedPhase2DemoData(db);
  logger.info("database", "Development seed data created");
}

function seedPhase2DemoData(db: Database.Database): void {
  const countRow = db.prepare("SELECT COUNT(*) AS count FROM categories").get() as { count: number };
  if (countRow.count > 0) {
    return;
  }

  const now = new Date().toISOString();

  db.transaction(() => {
    const categories = [
      createCategory(db, "Starters", "CAT-STARTERS", 1, now),
      createCategory(db, "Mains", "CAT-MAINS", 2, now),
      createCategory(db, "Breads", "CAT-BREADS", 3, now),
      createCategory(db, "Rice", "CAT-RICE", 4, now),
      createCategory(db, "Drinks", "CAT-DRINKS", 5, now),
      createCategory(db, "Desserts", "CAT-DESSERTS", 6, now)
    ];

    const cheeseGroup = createModifierGroup(db, "Cheese Options", "MODG-CHEESE", 0, 2, 0, now);
    const spiceGroup = createModifierGroup(db, "Spice Level", "MODG-SPICE", 1, 1, 1, now);
    const drinkGroup = createModifierGroup(db, "Drink Add-ons", "MODG-DRINK", 0, 2, 0, now);
    const breadGroup = createModifierGroup(db, "Bread Extras", "MODG-BREAD", 0, 2, 0, now);

    const modifiers = {
      cheese: createModifier(db, cheeseGroup, "Extra Cheese", "MOD-EXTRA-CHEESE", 3000, now),
      mozzarella: createModifier(db, cheeseGroup, "Mozzarella", "MOD-MOZZARELLA", 4500, now),
      mild: createModifier(db, spiceGroup, "Mild", "MOD-MILD", 0, now),
      medium: createModifier(db, spiceGroup, "Medium", "MOD-MEDIUM", 0, now),
      spicy: createModifier(db, spiceGroup, "Spicy", "MOD-SPICY", 0, now),
      lemon: createModifier(db, drinkGroup, "Fresh Lemon", "MOD-LEMON", 1000, now),
      mint: createModifier(db, drinkGroup, "Mint", "MOD-MINT", 800, now),
      butter: createModifier(db, breadGroup, "Extra Butter", "MOD-BUTTER", 1500, now),
      garlic: createModifier(db, breadGroup, "Garlic Finish", "MOD-GARLIC", 2000, now)
    };

    const productMap = {
      paneerTikka: createProduct(db, categories[0], "Paneer Tikka", "PRD-PANEER-TIKKA", "890100000001", 28000, "exclusive", 500, 1, now),
      haraBhara: createProduct(db, categories[0], "Hara Bhara Kebab", "PRD-HARA-BHARA", null, 24000, "exclusive", 500, 2, now),
      tomatoSoup: createProduct(db, categories[0], "Tomato Soup", "PRD-TOMATO-SOUP", "890100000002", 16000, "inclusive", 500, 3, now),
      butterPaneer: createProduct(db, categories[1], "Paneer Butter Masala", "PRD-PBM", "890100000003", 34000, "exclusive", 500, 1, now),
      vegKolhapuri: createProduct(db, categories[1], "Veg Kolhapuri", "PRD-KOLHAPURI", null, 31000, "inclusive", 500, 2, now),
      dalTadka: createProduct(db, categories[1], "Dal Tadka", "PRD-DAL-TADKA", "890100000004", 22000, "exclusive", 500, 3, now),
      tandooriRoti: createProduct(db, categories[2], "Tandoori Roti", "PRD-ROTI", null, 3000, "exclusive", 500, 1, now),
      butterNaan: createProduct(db, categories[2], "Butter Naan", "PRD-NAAN", "890100000005", 6000, "inclusive", 500, 2, now),
      garlicNaan: createProduct(db, categories[2], "Garlic Naan", "PRD-GARLIC-NAAN", null, 7500, "inclusive", 500, 3, now),
      jeeraRice: createProduct(db, categories[3], "Jeera Rice", "PRD-JEERA-RICE", null, 18000, "exclusive", 500, 1, now),
      vegBiryani: createProduct(db, categories[3], "Veg Biryani", "PRD-VEG-BIRYANI", "890100000006", 26000, "exclusive", 500, 2, now),
      steamRice: createProduct(db, categories[3], "Steam Rice", "PRD-STEAM-RICE", null, 12000, "exclusive", 500, 3, now),
      limeSoda: createProduct(db, categories[4], "Fresh Lime Soda", "PRD-LIME-SODA", "890100000007", 9000, "inclusive", 1200, 1, now),
      coldCoffee: createProduct(db, categories[4], "Cold Coffee", "PRD-COLD-COFFEE", null, 14000, "inclusive", 1200, 2, now),
      masalaChaas: createProduct(db, categories[4], "Masala Chaas", "PRD-CHAAS", null, 7000, "inclusive", 500, 3, now),
      gulabJamun: createProduct(db, categories[5], "Gulab Jamun", "PRD-GULAB-JAMUN", "890100000008", 8000, "inclusive", 500, 1, now),
      brownie: createProduct(db, categories[5], "Sizzling Brownie", "PRD-BROWNIE", null, 18000, "exclusive", 500, 2, now),
      iceCream: createProduct(db, categories[5], "Vanilla Ice Cream", "PRD-ICE-CREAM", null, 6000, "inclusive", 500, 3, now)
    };

    attachModifierGroup(db, productMap.paneerTikka, spiceGroup, 1, now);
    attachModifierGroup(db, productMap.haraBhara, spiceGroup, 1, now);
    attachModifierGroup(db, productMap.butterPaneer, spiceGroup, 1, now);
    attachModifierGroup(db, productMap.butterPaneer, cheeseGroup, 2, now);
    attachModifierGroup(db, productMap.butterNaan, breadGroup, 1, now);
    attachModifierGroup(db, productMap.garlicNaan, breadGroup, 1, now);
    attachModifierGroup(db, productMap.limeSoda, drinkGroup, 1, now);

    createVariant(db, productMap.paneerTikka, "Full", "PRD-PANEER-TIKKA-FULL", null, 28000, 1, now);
    createVariant(db, productMap.paneerTikka, "Half", "PRD-PANEER-TIKKA-HALF", null, 16000, 0, now);
    createVariant(db, productMap.butterPaneer, "Full", "PRD-PBM-FULL", null, 34000, 1, now);
    createVariant(db, productMap.butterPaneer, "Half", "PRD-PBM-HALF", null, 21000, 0, now);
    createVariant(db, productMap.vegBiryani, "Regular", "PRD-VEG-BIRYANI-REG", null, 26000, 1, now);
    createVariant(db, productMap.vegBiryani, "Jumbo", "PRD-VEG-BIRYANI-JUMBO", null, 36000, 0, now);
    createVariant(db, productMap.limeSoda, "Sweet", "PRD-LIME-SODA-SWEET", "890100000009", 9000, 1, now);
    createVariant(db, productMap.limeSoda, "Salted", "PRD-LIME-SODA-SALT", "890100000010", 9000, 0, now);
    createVariant(db, productMap.coldCoffee, "Classic", "PRD-COLD-COFFEE-CL", null, 14000, 1, now);
    createVariant(db, productMap.coldCoffee, "Hazelnut", "PRD-COLD-COFFEE-HZ", null, 16500, 0, now);

    ["Main Hall", "Main Hall", "Main Hall", "Main Hall", "Main Hall", "Main Hall", "Patio", "Patio", "Patio", "Patio"].forEach(
      (floor, index) => {
        db.prepare(
          `INSERT INTO tables (uuid, name, floor, capacity, sort_order, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'available', ?, ?)`
        ).run(randomUUID(), `T${index + 1}`, floor, index < 6 ? 4 : 2, index + 1, now, now);
      }
    );

    [
      ["Ravi", "WTR-RAVI"],
      ["Priya", "WTR-PRIYA"],
      ["Ankit", "WTR-ANKIT"],
      ["Neha", "WTR-NEHA"],
      ["Sonal", "WTR-SONAL"]
    ].forEach(([name, code]) => {
      db.prepare(
        `INSERT INTO waiters (uuid, name, code, status, created_at, updated_at)
         VALUES (?, ?, ?, 'active', ?, ?)`
      ).run(randomUUID(), name, code, now, now);
    });

    [
      ["Aarav Shah", "9876543210", "aarav@example.com", "Satellite Road"],
      ["Nisha Patel", "9898989898", "nisha@example.com", "Bodakdev"],
      ["Mehul Joshi", "9811111111", null, "Navrangpura"],
      ["Devanshi Mehta", "9822222222", null, "Vastrapur"],
      ["Rohan Trivedi", "9833333333", "rohan@example.com", "CG Road"],
      ["Anaya Desai", "9844444444", null, "Prahladnagar"],
      ["Kunal Shah", "9855555555", null, "Drive In"],
      ["Ira Patel", "9866666666", "ira@example.com", "Science City"]
    ].forEach(([name, phone, email, address]) => {
      db.prepare(
        `INSERT INTO customers (uuid, name, phone, email, address_summary, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
      ).run(randomUUID(), name, phone, email, address, now, now);
    });
  })();

  logger.info("database", "Phase 2 demo seed data created");
}

function createCategory(db: Database.Database, name: string, code: string, sortOrder: number, now: string): string {
  const uuid = randomUUID();
  db.prepare(
    `INSERT INTO categories (uuid, name, code, sort_order, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`
  ).run(uuid, name, code, sortOrder, now, now);
  return uuid;
}

function createProduct(
  db: Database.Database,
  categoryUuid: string,
  name: string,
  sku: string,
  barcode: string | null,
  basePriceMinor: number,
  gstMode: "inclusive" | "exclusive",
  gstRateBasisPoints: number,
  sortOrder: number,
  now: string
): string {
  const uuid = randomUUID();
  db.prepare(
    `INSERT INTO products (
      uuid, category_uuid, name, description, sku, barcode, base_price_minor, gst_mode, gst_rate_basis_points,
      is_active, sort_order, search_text, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`
  ).run(uuid, categoryUuid, name, null, sku, barcode, basePriceMinor, gstMode, gstRateBasisPoints, sortOrder, `${name} ${sku}`.toLowerCase(), now, now);
  return uuid;
}

function createVariant(
  db: Database.Database,
  productUuid: string,
  name: string,
  sku: string,
  barcode: string | null,
  priceMinor: number,
  isDefault: 0 | 1,
  now: string
): string {
  const uuid = randomUUID();
  db.prepare(
    `INSERT INTO product_variants (
      uuid, product_uuid, name, sku, barcode, price_minor, is_default, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(uuid, productUuid, name, sku, barcode, priceMinor, isDefault, now, now);
  return uuid;
}

function createModifierGroup(
  db: Database.Database,
  name: string,
  code: string,
  minSelect: number,
  maxSelect: number,
  isRequired: 0 | 1,
  now: string
): string {
  const uuid = randomUUID();
  db.prepare(
    `INSERT INTO modifier_groups (
      uuid, name, code, min_select, max_select, is_required, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(uuid, name, code, minSelect, maxSelect, isRequired, now, now);
  return uuid;
}

function createModifier(
  db: Database.Database,
  groupUuid: string,
  name: string,
  code: string,
  priceDeltaMinor: number,
  now: string
): string {
  const uuid = randomUUID();
  db.prepare(
    `INSERT INTO modifiers (
      uuid, modifier_group_uuid, name, code, price_delta_minor, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(uuid, groupUuid, name, code, priceDeltaMinor, now, now);
  return uuid;
}

function attachModifierGroup(db: Database.Database, productUuid: string, groupUuid: string, sortOrder: number, now: string): void {
  db.prepare(
    `INSERT INTO product_modifier_groups (product_uuid, modifier_group_uuid, sort_order, created_at)
     VALUES (?, ?, ?, ?)`
  ).run(productUuid, groupUuid, sortOrder, now);
}
