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
