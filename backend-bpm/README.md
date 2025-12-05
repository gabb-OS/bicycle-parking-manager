# Backend for Bicycle Parking Manager (BPM)

This is the Flask backend service for the BPM application. It is designed to run with Docker and Docker Compose, connecting to a Postgis database.

## Workflow

This is the exact workflow you should follow to keep your sanity. To answer your first question: **You start in Dev mode.**

You only touch "Prod" when you are ready to deploy your finished code to a real server.

Here is the "Golden Lifecycle" of a feature, from your laptop (Dev) to the server (Prod).

---

### Phase 1: The Daily Development Loop (Your Laptop)

**Goal:** Write code, change the DB schema, and test it instantly.

#### 1\. Start the Environment

Run this command from your root folder. It combines your base config with your dev overrides (hot-reloading, exposed ports).

```bash
docker compose -f compose.yaml -f docker-compose.dev.yml up -d --build
```

#### 2\. The Code-Change Cycle

- **Backend Logic:** Just save the file. Flask (in debug mode) detects the change and reloads automatically because of the volume mapping in `docker-compose.dev.yml`.

- **Database Schema (The Important Part):**
  When you modify a model (e.g., adding `phone_number` to `User`), follow this **exact sequence**:

  1.  **Generate the Migration:**
      Tell Flask to look at your code changes and write a script for them.

      ```bash
      docker compose exec backend flask db migrate -m "Added phone number to user"
      ```

      _Result:_ A new python file appears in `backend-bpm/migrations/versions/`.

  2.  **Apply it Locally:**
      Update your local dev database to match your new code.

      ```bash
      docker compose exec backend flask db upgrade
      ```

  3.  **Verify:** Check if your app works with the new DB structure.

  4.  **Commit:**
      **Crucial:** You MUST commit the new migration file to Git.

      ```bash
      git add backend-bpm/migrations
      git commit -m "feat: added user phone number"
      ```

---

### Phase 2: The Production Flow (The Server)

**Goal:** Deploy the exact code and database structure you verified in Dev, without breaking anything.

**Prerequisite:** You have the "Smart Entrypoint" script we created earlier configured to run `flask db upgrade` before starting the app.

#### 1\. The Deployment Command

On your production server, you generally run the base compose file (which defaults to the production settings in your `Dockerfile`):

```bash
# Pull the latest code (including the migration files you committed in Phase 1)
git pull

# Build and Start
docker compose up -d --build
```

#### 2\. What happens automatically?

Because of your setup, you don't need to run any manual commands.

1.  Docker builds the image containing your code and the `migrations/` folder.
2.  The container starts.
3.  **The Entrypoint Script kicks in:**
    - It runs `flask db upgrade`.
    - It sees the new migration file you created in Phase 1.
    - It updates the Production Database safely.
4.  Only _after_ the DB is updated, `gunicorn` starts serving traffic.

---

### Summary Checklist

| Action              | Environment | Command                                                                                                  |
| :------------------ | :---------- | :------------------------------------------------------------------------------------------------------- |
| **Start Work**      | **Dev**     | `docker compose -f compose.yaml -f docker-compose.dev.yml up -d`                                         |
| **Change Code**     | **Dev**     | Just Save (Hot Reload handles it)                                                                        |
| **Change DB Model** | **Dev**     | 1. `docker compose exec backend flask db migrate` <br> 2. `docker compose exec backend flask db upgrade` |
| **Deploy**          | **Prod**    | `docker compose up -d --build`                                                                           |
| **Update Prod DB**  | **Prod**    | **Automatic** (Handled by Entrypoint)                                                                    |

### Troubleshooting "What if..."

- **What if I messed up a migration in Dev?**
  Run `docker compose exec backend flask db downgrade`, delete the bad migration file, fix your model, and run `migrate` again.
- **What if I forgot to commit the migration file?**
  Your production app will crash because the code expects a column that doesn't exist in the DB yet. Always check `git status` before deploying.
