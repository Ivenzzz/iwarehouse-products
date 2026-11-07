# Deploying iWarehouse Products

The production checkout lives at `/var/www/iwarehouse-products` on the Ubuntu
server and runs as `iwarehouse-products.service` on `127.0.0.1:3002`.

After changes have been committed and pushed to the `main` branch, deploy them
from the server:

```bash
ssh iwarehouse-erp
cd /var/www/iwarehouse-products
bash deploy.sh
```

The script:

1. obtains an exclusive deployment lock;
2. verifies the checkout, branch, environment file, service, and ERP health;
3. refuses unexpected server-side changes or diverged Git history;
4. fast-forwards to `origin/main`;
5. installs dependencies from `package-lock.json`;
6. runs the unit tests and production build;
7. restarts only `iwarehouse-products.service`;
8. verifies the new app and ERP after the restart.

It does not modify the Laravel checkout, nginx configuration, databases,
containers, or unrelated services.

The first deployment containing this script must be pulled normally:

```bash
ssh iwarehouse-erp
cd /var/www/iwarehouse-products
git pull --ff-only origin main
bash deploy.sh --force
```

`--force` rebuilds and restarts the current commit. It is also useful after an
intentional production `.env` change. Normal code updates should use
`bash deploy.sh` without the flag.

If the script reports unexpected changes, inspect them with `git status` and
resolve them deliberately. Do not bypass the guard by resetting the checkout.

## Customer accounts and reviews

This feature spans both projects, and the ERP must go first because the site
depends on its API.

1. Create the Google sign-in, as described below.
2. Deploy the ERP. On its server, set `STOREFRONT_URL` to this site's public
   address, which is where links in customer emails point, and
   `GOOGLE_STOREFRONT_CLIENT_ID` to the new client ID.
3. In this site's `.env`, set `ERP_STOREFRONT_API_URL`, `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET` and `CUSTOMER_REVIEWS_LIVE=false`, then deploy with
   `bash deploy.sh`.
4. Check nginx for this site. It must set `X-Forwarded-For` with
   `$proxy_add_x_forwarded_for` or `$remote_addr`, or every visitor shares one
   rate limit. It must also forward `Host`, or form submissions are rejected.
5. In the ERP's Roles & Permissions screen, give `product-reviews.moderate` to the
   roles that will approve reviews. Only SuperAdmin has it at first.
6. Test email to Gmail, Yahoo and Outlook, checking that SPF and DKIM pass and the
   ERP's queue worker is running. Customers only get an email when a review is
   rejected, so a stalled worker won't stop anyone signing in.
7. With the setting still off, test the whole journey from `/account/login`, and
   open a product link from Messenger on a phone. Shoppers see no change while
   it's off.
8. Get the privacy notice and review guidelines approved, fill in each
   `[To confirm: …]` in `src/modules/customers/ui/legal-views.tsx`, and deploy.
9. Launch by setting `CUSTOMER_REVIEWS_LIVE=true` and running
   `bash deploy.sh --force`. Turning it off works the same way.

### Creating the Google sign-in

Use a separate Google Cloud project, so staff sign-in is never affected and
customers see a customer-facing name.

1. In the [Google Cloud console](https://console.cloud.google.com/), create a
   project such as "iWarehouse".
2. Under Google Auth Platform, set the audience to **External** and publish the app
   to production, otherwise only listed test users can sign in.
3. Set the app name customers will see, and a support email.
4. Request only the `openid`, `email` and `profile` scopes. Skip the logo at first,
   because adding one may require Google's brand verification.
5. Create an OAuth client of type **Web application** and add this authorized
   redirect URI: `<NEXT_PUBLIC_SITE_URL>/account/google/callback`. It must match
   exactly. Add `http://localhost:3000/account/google/callback` for local testing.
6. Copy the client ID and secret into the settings above. Keep the secret out of
   git and out of any `NEXT_PUBLIC_` setting.
