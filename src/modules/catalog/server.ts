import "server-only";

import { createErpCatalogSourceFromEnvironment } from "./erp/adapter";
import { createCatalogWorkflows } from "./workflows";

const workflows = createCatalogWorkflows(
  createErpCatalogSourceFromEnvironment(),
);

export const loadHomeCatalog = workflows.loadHomeCatalog;
export const browseCatalog = workflows.browseCatalog;
export const resolveProduct = workflows.resolveProduct;
export const loadSitemapProducts = workflows.loadSitemapProducts;
