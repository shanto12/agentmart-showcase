# Verification record

September 14, 2026, Central Time. Production URL: https://agentmart-live-shanto.netlify.app/. Application deployment: `6aa81bc66bc83b60f142c618`. Deployed code corresponds to the public source's initial commit `1c8c0e5832f77f29a70e46fbe52f46239f2a6acf`; later recruiter-presentation commits change documentation and screenshots only.

| Requirement | Method | Evidence and scope |
| --- | --- | --- |
| Local correctness | Standalone checkout | Build/typecheck and 48 policy, admission, session and watchdog tests passed |
| Dependencies and publication | npm audit and allowlist review | Zero known production vulnerabilities at check time; 25 original allowlisted files, synthetic test data, no credentials/private paths |
| Explicit voice start | Production isolated Chrome and native Chrome | No microphone request or voice admission on load; avatar click starts voice |
| Catalog workflows | Production isolated Playwright | 18 grouped checks: search/filter/sort, all 12 details, saving, comparison, local acquisition, agent settings, seller draft, themes/undo/reset and session restoration |
| Actual spoken task | Real provider WebRTC/API with synthetic microphone | Spoken request transcribed; planner returned navigation and API filter; rendered cards became Openfield, Trace and Relay; guide spoke about those results |
| Voice lifecycle | Real provider session | Final seven-check run covered mute/unmute, `session.closed`, closed peer and ended local/remote tracks; duration 33.5 seconds |
| Desktop/mobile and transport | Production automation | 1440×900, 390×844, 768px and 320px; no horizontal overflow, runtime errors or failed first-party requests in final checks |
| Security headers | Production HTTP | Constrained CSP, frame denial, HSTS, nosniff, referrer and permissions policies |
| Native Chrome | User's actual profile | Selected final catalog actions, saved/compare/details, demo acquisition, local agent create/pause, seller/workspace previews and idle opt-in; broader checks were automated |
| Budget preservation | Read-only health plus session receipts | Same $14 site/$30 combined scope; no allocation increase or direct ledger reset; reservations are not invoices |

The initial live-test harness incorrectly repeated an initial-load assertion after a successful planner action. Its failed receipt was retained. An explicitly authorized bounded retest passed all seven checks; it used one live, one guide and one end request. This distinguishes the final passing evidence from the earlier harness failure.

No physical-microphone accuracy, real commerce, external seller mutation or multi-user authentication claim is made. Marketplace records, acquisitions and seller previews are local demonstrations. The source publishes no raw audio, provider session IDs, usage ledger or owner credentials.

Screenshots in [screenshots/](screenshots/) are actual production browser captures of fictional catalog state. The current screenshot of the filtered catalog follows the real synthetic spoken request; it is not a generated UI mockup. Documentation changes do not alter the runtime, cloud settings or paid budget.
