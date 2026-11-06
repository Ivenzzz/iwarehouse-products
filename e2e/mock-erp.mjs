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

const kioskLocation = {
  id: 8,
  name: "BGC Kiosk",
  type: "kiosk",
  address: "5th Avenue, Bonifacio Global City, Taguig",
  city: "Taguig",
  phone: null,
  latitude: null,
  longitude: null,
};

const summary = {
  id: 17,
  slug: "apple-iphone-17-pro",
  name: "Apple iPhone 17 Pro",
  brand: { id: 1, name: "Apple" },
  category: {
    id: 2,
    name: "Smartphones",
    parent: { id: 1, name: "Mobile Devices" },
  },
  description: "A flagship phone ready at selected iWarehouse stores.",
  image_url: null,
  conditions: ["Brand New"],
  options: {
    colors: ["Black", "Ice Blue", "Natural Titanium"],
    configurations: [
      { ram: "8GB", rom: "256GB" },
      { ram: "12GB", rom: "512GB" },
      { ram: "12GB", rom: "1TB" },
    ],
  },
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
    variant(24, "Natural Titanium", "12GB", "1TB", 65000, [kioskLocation]),
    variant(22, "Black", "12GB", "512GB", 52000, [location, kioskLocation]),
    variant(23, "Ice Blue", "8GB", "256GB", 43000, [location]),
    variant(21, "Black", "8GB", "256GB", 42000, [location]),
  ],
};

// Attribute order and labels match the ERP's definitions.
function variant(id, color, ram, rom, price, locations) {
  return {
    id,
    name: `Apple iPhone 17 Pro ${ram} ${rom} ${color}`,
    condition: "Brand New",
    attributes: [
      { key: "color", label: "Color", value: color },
      { key: "ram", label: "RAM", value: ram },
      { key: "rom", label: "ROM", value: rom },
      { key: "cpu", label: "CPU", value: "Apple A19 Pro" },
    ],
    image_url: null,
    cash_price_from: price,
    srp_price: price + 5000,
    locations,
  };
}

const PHOTO_URL = "http://127.0.0.1:4010/mock-images/product.svg";

const PRODUCT_PHOTO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#f3f4f6"/>
  <rect x="170" y="90" width="160" height="320" rx="26" fill="#1c1c1a"/>
</svg>`;

function arrival(id, name, overrides = {}) {
  return {
    ...summary,
    id,
    slug: name.toLowerCase().replaceAll(" ", "-"),
    name,
    description: null,
    image_url: PHOTO_URL,
    cash_price_from: 40000 + id,
    srp_price: 50000 + id,
    ...overrides,
  };
}

const accessories = { id: 36, name: "Chargers & Powerbanks", parent: { id: 35, name: "Accessories & Storage" } };

// The hero and "Recently available" row's request, newest first. The first two
// can't feature, so they check the storefront filters before choosing.
const newArrivals = [
  arrival(201, "New Charger", { category: accessories }),
  arrival(202, "Photoless Phone", { image_url: null }),
  arrival(101, "Newest Phone"),
  arrival(203, "Pre-Owned Phone", { conditions: ["Certified Pre-Owned"] }),
  arrival(102, "Second Newest Phone"),
  arrival(103, "Third Phone"),
  arrival(104, "Fourth Phone"),
  arrival(105, "Fifth Phone"),
  arrival(106, "Sixth Phone"),
];

const filters = {
  brands: [{ id: 1, name: "Apple" }],
  categories: [
    {
      id: 1,
      name: "Mobile Devices",
      children: [
        { id: 2, name: "Smartphones" },
        { id: 3, name: "Tablets" },
      ],
    },
    {
      id: 9,
      name: "Computers & Office",
      children: [
        { id: 10, name: "Laptops" },
        { id: 11, name: "Desktop PCs" },
        { id: 12, name: "Mini PCs" },
        { id: 13, name: "Monitors" },
        { id: 14, name: "Computer Components" },
      ],
    },
    {
      id: 4,
      name: "Wearables",
      children: [
        { id: 5, name: "Smartwatches" },
        { id: 6, name: "Fitness Bands" },
      ],
    },
    {
      id: 18,
      name: "Gaming",
      children: [
        { id: 19, name: "Consoles" },
        { id: 22, name: "Gaming Accessories" },
      ],
    },
    {
      id: 30,
      name: "Cameras & Drones",
      children: [
        { id: 32, name: "Action Cameras" },
        { id: 33, name: "Photography Cameras" },
      ],
    },
    {
      id: 23,
      name: "TV, Audio & Entertainment",
      children: [
        { id: 24, name: "Televisions" },
        { id: 25, name: "Speakers" },
        { id: 26, name: "Headphones" },
      ],
    },
    {
      id: 35,
      name: "Accessories & Storage",
      children: [
        { id: 36, name: "Chargers & Powerbanks" },
        { id: 37, name: "Storage Devices" },
      ],
    },
  ],
  conditions: ["Brand New"],
  locations: [{ id: 3, name: "Makati Store", city: "Makati" }],
  cities: ["Makati"],
};

/*
 * Accounts and reviews, kept in memory. Every test signs up with its own email,
 * so parallel tests don't see each other's accounts.
 */
const accounts = new Map();
const sessions = new Map();
const ownReviews = new Map();
let nextId = 1000;

// Fixed data, since real approvals are covered by the ERP's own tests. The script
// tag proves review text can't run on the page or in the search data.
const SCRIPT_REVIEW = "Great phone </script><script>window.__reviewXss = true</script> really.";
const publicReviews = {
  summary: { average: 4.5, count: 12, breakdown: { 5: 8, 4: 2, 3: 2, 2: 0, 1: 0 } },
  data: [
    { id: 1, author: "Ana R.", rating: 5, body: "Lovely screen and the battery lasts all day.", submitted_at: "2026-10-01T00:00:00+00:00" },
    { id: 2, author: "Ben T.", rating: 4, body: SCRIPT_REVIEW, submitted_at: "2026-09-20T00:00:00+00:00" },
  ],
};

function readBody(request) {
  return new Promise((resolve) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function send(response, status, body) {
  response.statusCode = status;
  response.end(body === undefined ? undefined : JSON.stringify(body));
}

function accountDto(account) {
  return {
    id: account.id,
    first_name: account.firstName,
    last_name: account.lastName,
    public_name: `${account.firstName} ${account.lastName[0].toUpperCase()}.`,
    email: account.email,
    email_verified: account.emailVerified,
  };
}

function reviewDto(review) {
  return {
    id: review.id,
    rating: review.rating,
    body: review.body,
    status: review.status,
    rejection_reason: review.rejectionReason,
    submitted_at: "2026-11-06T00:00:00+00:00",
    product: { id: review.productId, name: "Apple iPhone 17 Pro", slug: "apple-iphone-17-pro" },
  };
}

function validationError(response, field, message) {
  send(response, 422, { message, errors: { [field]: [message] } });
}

async function handleStorefront(request, response, url) {
  if (request.headers["x-storefront-token"] !== "e2e-token") {
    return send(response, 401, { message: "Invalid storefront API token." });
  }

  const path = url.pathname.replace("/api/v1/storefront", "");
  const route = `${request.method} ${path}`;
  const body = await readBody(request);

  const reviewsProductId = Number(path.match(/^\/products\/(\d+)\/reviews$/)?.[1]);
  if (request.method === "GET" && reviewsProductId) {
    // Product 17 has reviews on two pages. Any other product's reviews are down,
    // which proves an outage can't take a product page with it.
    if (reviewsProductId !== 17) return send(response, 503, { message: "Unavailable" });

    const page = Number(url.searchParams.get("page") ?? 1);
    return send(response, 200, {
      summary: publicReviews.summary,
      data: page === 1
        ? publicReviews.data
        : [{ id: 3, author: "Cara L.", rating: 3, body: "A review on the second page of results.", submitted_at: "2026-08-01T00:00:00+00:00" }],
      meta: { current_page: page, per_page: 10, total: 12, last_page: 2 },
    });
  }

  if (route === "POST /auth/register") {
    if (!accounts.has(body.email)) {
      accounts.set(body.email, {
        id: nextId++,
        firstName: body.first_name,
        lastName: body.last_name,
        email: body.email,
        password: body.password,
        emailVerified: false,
      });
    }
    return send(response, 202, { status: "check_email" });
  }
  if (route === "POST /auth/login") {
    const account = accounts.get(body.email);
    if (!account || account.password !== body.password) {
      return validationError(response, "email", "Incorrect email or password.");
    }
    const token = `session-${nextId++}`;
    sessions.set(token, account);
    return send(response, 200, {
      token,
      expires_at: "2099-01-01T00:00:00+00:00",
      account: accountDto(account),
    });
  }
  if (route === "POST /auth/forgot-password") {
    return send(response, 202, { status: "check_email" });
  }
  if (route === "POST /auth/reset-password") {
    const account = accounts.get(body.email);
    if (!account || body.token !== "valid-reset-token") {
      return validationError(response, "token", "This reset link is invalid or has expired.");
    }
    account.password = body.password;
    return send(response, 200, { status: "password_reset" });
  }
  if (route === "POST /auth/verify-email") {
    const account = [...accounts.values()].find((item) => String(item.id) === String(body.id));
    if (!account || body.signature !== "valid-signature") {
      return validationError(response, "signature", "This verification link is invalid or has expired.");
    }
    account.emailVerified = true;
    return send(response, 200, { status: "email_verified" });
  }

  const account = sessions.get((request.headers.authorization ?? "").replace("Bearer ", ""));
  if (!account) return send(response, 401, { message: "Unauthenticated." });

  const mine = () => [...ownReviews.values()].filter((review) => review.accountId === account.id);
  const reviewId = Number(path.match(/\/reviews\/(\d+)$/)?.[1]);
  const review = mine().find((item) => item.id === reviewId);
  const productId = Number(path.match(/\/products\/(\d+)\//)?.[1]);

  if (route === "DELETE /auth/logout") {
    sessions.delete((request.headers.authorization ?? "").replace("Bearer ", ""));
    return send(response, 204);
  }
  if (route === "POST /auth/resend-verification") return send(response, 202, { status: "check_email" });
  if (route === "GET /me") return send(response, 200, { data: accountDto(account) });
  if (route === "DELETE /me") {
    if (body.password !== account.password) {
      return validationError(response, "password", "That password is incorrect.");
    }
    mine().forEach((item) => ownReviews.delete(item.id));
    accounts.delete(account.email);
    return send(response, 204);
  }
  if (route === "GET /me/reviews") return send(response, 200, { data: mine().map(reviewDto) });
  if (request.method === "GET" && path.endsWith("/my-review")) {
    const existing = mine().find((item) => item.productId === productId);
    return send(response, 200, { data: existing ? reviewDto(existing) : null });
  }
  if (request.method === "GET" && reviewId) {
    return review ? send(response, 200, { data: reviewDto(review) }) : send(response, 404, { message: "Not found." });
  }
  if (request.method === "DELETE" && reviewId) {
    if (!review) return send(response, 404, { message: "Not found." });
    ownReviews.delete(review.id);
    return send(response, 204);
  }

  if (!account.emailVerified) {
    return send(response, 403, { message: "Please verify your email address first.", code: "email_unverified" });
  }
  if (request.method === "POST" && productId) {
    const created = {
      id: nextId++,
      accountId: account.id,
      productId,
      rating: body.rating,
      body: body.body,
      status: "pending",
      rejectionReason: null,
    };
    ownReviews.set(created.id, created);
    return send(response, 201, { data: reviewDto(created) });
  }
  if (request.method === "PUT" && reviewId) {
    if (!review) return send(response, 404, { message: "Not found." });
    Object.assign(review, { rating: body.rating, body: body.body, status: "pending", rejectionReason: null });
    return send(response, 200, { data: reviewDto(review) });
  }

  return send(response, 404, { message: "Not found." });
}

/** Test-only stand-ins for things staff do in the ERP or customers do from emails. */
function handleTestControl(request, response, url) {
  const account = accounts.get(url.searchParams.get("email"));
  if (url.pathname === "/__test/account") {
    return account
      ? send(response, 200, { id: account.id })
      : send(response, 404, { message: "Not found." });
  }
  if (url.pathname === "/__test/reject") {
    const review = account && [...ownReviews.values()].find((item) => item.accountId === account.id);
    if (!review) return send(response, 404, { message: "Not found." });
    Object.assign(review, { status: "rejected", rejectionReason: "It isn't about this product" });
    return send(response, 200, {});
  }
  return send(response, 404, { message: "Not found." });
}

const server = http.createServer(async (request, response) => {
  // Before the token check, because browsers request it with no token.
  if (request.url === "/mock-images/product.svg") {
    response.setHeader("Content-Type", "image/svg+xml");
    response.end(PRODUCT_PHOTO_SVG);
    return;
  }

  response.setHeader("Content-Type", "application/json");

  const url = new URL(request.url ?? "/", "http://127.0.0.1:4010");
  if (url.pathname.startsWith("/__test/")) {
    handleTestControl(request, response, url);
    return;
  }
  if (url.pathname.startsWith("/api/v1/storefront")) {
    await handleStorefront(request, response, url);
    return;
  }

  if (request.headers.authorization !== "Bearer e2e-token") {
    response.statusCode = 401;
    response.end(JSON.stringify({ message: "Invalid catalog API token." }));
    return;
  }

  if (url.pathname === "/api/v1/catalog/filters") {
    response.end(JSON.stringify({ data: filters }));
    return;
  }
  // Null logo keeps the screenshot baselines on the CSS wordmark, and a
  // null hero keeps them on the bundled collage fallback.
  if (url.pathname === "/api/v1/catalog/branding") {
    response.end(JSON.stringify({ data: { logo: null, hero: null } }));
    return;
  }
  if (url.pathname === "/api/v1/catalog/locations") {
    response.end(JSON.stringify({ data: [location, kioskLocation] }));
    return;
  }
  if (url.pathname === "/api/v1/catalog/products/17") {
    response.end(JSON.stringify({ data: detail }));
    return;
  }
  // Homepage cards link to these, and Next.js prefetches links on screen.
  const arrivalId = Number(url.pathname.match(/\/products\/(\d+)$/)?.[1]);
  const newArrival = newArrivals.find((item) => item.id === arrivalId);
  if (newArrival) {
    response.end(
      JSON.stringify({
        data: { ...detail, ...newArrival },
      }),
    );
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
    if (
      url.searchParams.get("sort") === "newest" &&
      url.searchParams.get("per_page") === "48" &&
      !url.searchParams.has("category")
    ) {
      response.end(
        JSON.stringify({
          data: newArrivals,
          meta: { current_page: 1, per_page: 48, total: newArrivals.length, last_page: 1 },
        }),
      );
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
