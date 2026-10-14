# GitHub Repo Banner

GitHub Repo Banner is a public banner generator and HTTP API. This local server is both. The generator is at http://localhost:3000. There is no account and no sign-in.

The main screen shows a live banner preview, header and subheader fields, fonts, colors, a background, an optional image URL, custom images, and export buttons. Tabs on that page show the README, the Code of conduct, and the MIT license. The top navigation opens Documentation (`/docs`) and Usage (`/usage`).

## Sign in

Do not sign in. The app is public. There is no login form, password, or OAuth page.

## Important flows

- Change the header and the subheader and confirm the preview image updates.
- Change the text color, both background colors, and a font name. The preview should still render.
- Turn the support watermark on and off. Use Copy Markdown, Copy Image URL, and the SVG download. PNG download is a separate button on the same page.
- Open Documentation and Usage. On this local server, Usage should say tracking is disabled. That is expected, not a bug.
- Open http://localhost:3000/banner?header=Hello&subheader=World&bg=1a1a1a-4a4a4a&color=ffffff and confirm an SVG banner loads.
- Open http://localhost:3000/health and http://localhost:3000/stats. Health should report the service. Stats should say tracking is disabled.
- Pexels search stays hidden, and `GET /api/pexels/search` returns 503 `Pexels API not configured`, when no Pexels key is set. Do not report that as a bug. A typed HTTPS background image URL is still available.

## Never do these things

- Do not open https://ghrb.waren.build or any host other than http://localhost:3000.
- Do not delete a showcase entry that you did not create.
- Do not export or showcase a design that uses a private, credentialed, or non-HTTPS image.
- Do not change environment variables, Redis, or files in the repo.
- Do not send email or make a payment. This app has neither.
