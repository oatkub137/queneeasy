<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application rules
- Keep the welcome page at `/` and the editable commission workspace at `/queue` so the shop logo precedes the working screen.
- Store the shared queue in Cloud; public access is SELECT-only, and all writes require a verified owner role enforced by database policies.
- Keep owner roles in a protected role table and resolve them through verified Cloud Auth sessions; never use browser flags or hardcoded credentials for authorization.
- Owner username sign-in maps normalized handles to synthetic email addresses and stores handles in profiles; do not expose recovery options for synthetic addresses.
- Define shared dropdown choices in the queue domain module and mirror them in database validation to keep editing consistent.
- Centralize shop color roles and both display modes in the global design system so all screens share the same theme.
