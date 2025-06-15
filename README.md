
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/1be68023-7ad6-4f09-aafd-89f0c27e1448

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1be68023-7ad6-4f09-aafd-89f0c27e1448) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

### Prerequisites

- [Node.js & npm](https://github.com/nvm-sh/nvm#installing-and-updating)
- [Docker](https://docs.docker.com/get-docker/) (for running the backend locally)
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)

### Local Development Setup

Follow these steps to run the full application (frontend and backend) locally:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the frontend dependencies.
npm i

# Step 4: Login to Supabase CLI (only required once).
supabase login

# Step 5: Link your local project to your Supabase project (only required once).
# Your project ID is ikdqbiumciskarxwooln
supabase link --project-ref <YOUR_PROJECT_ID>

# Step 6: Start the Supabase services (database, edge functions, etc.).
# This will run Docker containers on your machine.
supabase start

# Step 7: In a separate terminal, start the frontend development server.
# This provides auto-reloading and an instant preview.
npm run dev
```

After running `supabase start`, the CLI will output the local API URL and keys. The frontend is already configured to use these when running in development mode.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/1be68023-7ad6-4f09-aafd-89f0c27e1448) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
