# VELQIRIS Alexa+ Market Truth Simulator

A working web simulation for the Alexa+ track of the Amazon Build, Ship, Shape hackathon. It answers spot-price questions only when at least two independent venues respond and refuses to invent a market regime from a point-in-time snapshot.

## Live demo

https://velqiris-acquisition.netlify.app/alexa-simulation.html

## Architecture

- `public/index.html`: simulated Alexa+ conversation UI.
- `netlify/functions/consensus.js`: server-side multi-venue fetch, median calculation, provenance response, and fail-closed risk answer.
- No API key is required for the public exchange endpoints used in this demo.
- No trading, wallet signing, financial advice, or order execution is performed.

## Run locally

Install Netlify CLI, then run:

```bash
netlify dev
```

Open the local URL and choose a supported asset. The serverless function requires two independent responses; otherwise it returns `INSUFFICIENT_INDEPENDENT_SOURCES`.

## Hackathon disclosure

This project uses the simulated Alexa+ experience path expressly described in the competition requirements. It is not connected to a consumer Alexa account and does not claim certification or endorsement by Amazon.

## Changes made during the submission window

The dedicated Alexa+ simulation UI, serverless consensus endpoint, strict source threshold, spoken fail-closed response, and public deployment were created during the 2026 submission window.

## License

MIT. See `LICENSE`.
