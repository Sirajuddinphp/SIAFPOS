import type Database from "better-sqlite3";
import type { CatalogBootstrap, ProductDetail, ProductSearchInput, ProductSearchResult, ProductCategory } from "../../shared/contracts/catalog-contracts";
import { CategoryRepository } from "../repositories/category-repository";
import { ProductRepository } from "../repositories/product-repository";

export class CatalogService {
  private readonly categories: CategoryRepository;
  private readonly products: ProductRepository;

  constructor(db: Database.Database) {
    this.categories = new CategoryRepository(db);
    this.products = new ProductRepository(db);
  }

  getBootstrap(): CatalogBootstrap {
    return {
      categories: this.categories.listActive(),
      topProducts: this.products.listTop(24)
    };
  }

  listCategories(): ProductCategory[] {
    return this.categories.listActive();
  }

  searchProducts(input: ProductSearchInput): ProductSearchResult {
    return this.products.search(input);
  }

  getProduct(productUuid: string): ProductDetail {
    const product = this.products.findByUuid(productUuid);
    if (!product || !product.isActive) {
      throw new CatalogError("NOT_FOUND", "Product not found.");
    }

    return product;
  }
}

export class CatalogError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}
