import http from "node:http";

const location = {
  id: 3,
  name: "Makati Store",
  type: "store",
  address: "123 Ayala Avenue, Makati",
  city: "Makati",
  phone: "+63281234567",
  latitude: 14.5547,
  longitude: 121.0244,
};

const summary = {
  id: 17,
  slug: "apple-iphone-17-pro",
  name: "Apple iPhone 17 Pro",
  brand: { id: 1, name: "Apple" },
  category: { id: 2, name: "Smartphones", parent: { id: 1, name: "Phones" } },
  description: "A flagship phone ready at selected iWarehouse stores.",
  image_url: null,
  conditions: ["Brand New"],
  cash_price_from: 42000,
  srp_price: 47000,
  locations: [location],
  updated_at: "2026-08-04T00:00:00+08:00",
};

const detail = {
  ...summary,
  specifications: [
    {
      group: "Display",
      items: [{ key: "display_size", label: "Display Size", value: "6.3 inches" }],
    },
  ],
  variants: [
    {
      id: 21,
      name: "Apple iPhone 17 Pro 8GB 256GB Black",
      condition: "Brand New",
      attributes: [
        { key: "ram", label: "RAM", value: "8GB" },
        { key: "rom", label: "Storage", value: "256GB" },
        { key: "color", label: "Color", value: "Black" },
      ],
      image_url: null,
      cash_price_from: 42000,
      srp_price: 47000,
      locations: [location],
    },
  ],
};

const filters = {
  brands: [{ id: 1, name: "Apple" }],
  categories: [
    { id: 1, name: "Phones", children: [{ id: 2, name: "Smartphones" }] },
  ],
  conditions: ["Brand New"],
  locations: [{ id: 3, name: "Makati Store", city: "Makati" }],
  cities: ["Makati"],
};

const server = http.createServer((request, response) => {
  response.setHeader("Content-Type", "application/json");

  if (request.headers.authorization !== "Bearer e2e-token") {
    response.statusCode = 401;
    response.end(JSON.stringify({ message: "Invalid catalog API token." }));
    return;
  }

  const url = new URL(request.url ?? "/", "http://127.0.0.1:4010");
  if (url.pathname === "/api/v1/catalog/filters") {
    response.end(JSON.stringify({ data: filters }));
    return;
  }
  if (url.pathname === "/api/v1/catalog/products/17") {
    response.end(JSON.stringify({ data: detail }));
    return;
  }
  if (url.pathname === "/api/v1/catalog/products/503") {
    response.statusCode = 503;
    response.end(JSON.stringify({ message: "Unavailable" }));
    return;
  }
  if (url.pathname === "/api/v1/catalog/products") {
    if (url.searchParams.get("q") === "unavailable") {
      response.statusCode = 503;
      response.end(JSON.stringify({ message: "Unavailable" }));
      return;
    }
    response.end(
      JSON.stringify({
        data: [summary],
        meta: { current_page: 1, per_page: 24, total: 1, last_page: 1 },
      }),
    );
    return;
  }

  response.statusCode = 404;
  response.end(JSON.stringify({ message: "Not found" }));
});

server.listen(4010, "127.0.0.1");
