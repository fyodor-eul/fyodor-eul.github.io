title: Secure Member Portal
image: images/projects/SecureMemberPortal/cover.png
description: A role-based member management portal built to practice defensive, security-first backend development treating each feature as an exercise in closing a specific OWASP-class vulnerability rather than just shipping a working feature.
**Roles:** `member`, `president`, `treasurer`
**Stack:** Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, multer
link: https://github.com/fyodor-eul/secure-member-portal


## Overview

Most CRUD tutorials stop at making something work. This project's goal was different: build a standard role-based member portal, then go back through it and ask how each piece of user input and each auth decision could be abused and close off every gap found.

Two areas got the deepest treatment:

1. **File upload handling** — locking down profile photo uploads against type spoofing, oversized payloads, and path traversal
2. **Failed-login visibility** — making brute-force and credential-stuffing attempts detectable instead of invisible

---

## Authentication & Authorization

- Passwords are hashed with **bcrypt** before storage — never stored or logged in plaintext.
- Successful logins issue a **JWT** carrying the user's role, verified on every protected route through a `memberAuth` → `checkRole` middleware chain.
- Login and registration failures return one generic response no matter the actual cause — a wrong password, a non-existent username, and a role mismatch all look identical from the outside. This closes a classic **user-enumeration** hole: if the server ever hints at *why* a login failed, an attacker can use that signal to confirm which usernames are real.

---

## File Upload Validation

**The vulnerability:** unrestricted file upload is one of the more dangerous gaps an app can leave open. Worst case, an attacker uploads a script disguised as an image (a web shell) and calls it directly by URL to execute commands on the server. Short of that, oversized files can exhaust disk space, and unsanitized filenames (`../../`) can be used for path traversal to read or overwrite files outside the intended folder.

**What the portal does about it:**

- **Size cap** — a hard 2MB limit on profile photo uploads, enforced server-side via multer.
- **Type allowlisting** — both MIME type *and* file extension are checked against a strict allowlist (`.jpg`/`.jpeg`/`.png` only), so a script renamed to `photo.jpg` still gets rejected on content inspection, not just the filename.
- **Randomized filenames** — the client's original filename is never used for storage. Every upload gets a random hex filename server-side, which removes path traversal as an option entirely and prevents an attacker from overwriting another user's file by guessing its name.
- **Storage outside the webroot** — uploaded files live outside the directly-servable web root, so even a successful upload can't be directly executed as a script by hitting its URL.

### Oversized upload is rejected

When a file over the 2MB cap is submitted, the upload fails and the existing profile photo is left unchanged.

![Frontend response when uploading an oversized file — upload is rejected with a "File too large. Maximum size is 2 MB." message and the existing profile photo is unchanged](images/projects/SecureMemberPortal/upload-oversize-frontend.png)

The backend returns an HTTP `413 Payload Too Large` with a clear error message.

![Backend response — HTTP 413 Payload Too Large with a JSON body reading "File too large. Maximum size is 2 MB."](images/projects/SecureMemberPortal/upload-oversize-backend.png)

### Spoofing the `Content-Length` header doesn't help

An attacker might try to slip an oversized file past the check by editing the `Content-Length` header to report a smaller size. This doesn't work — multer doesn't trust the declared header, it measures the actual bytes received.

![The real request showing an actual Content-Length of ~3.1MB](images/projects/SecureMemberPortal/upload-content-length-real.png)

![The same request with the Content-Length header manually altered to ~1.1MB — still rejected, because the size check is based on real bytes received, not the client-declared header](images/projects/SecureMemberPortal/upload-content-length-spoofed.png)

### Disallowed file types are rejected

Sending the request directly through a proxy (bypassing any front-end checks) confirms the validation is enforced server-side. Here an executable, `yoru5.exe` with `Content-Type: application/x-msdownload`, is uploaded, the exact web-shell scenario described above. The server rejects it with `400 Bad Request` and the message "Invalid file type. Only JPG and PNG images are allowed."

![File upload attempt with a disallowed file type — rejected by the MIME and extension allowlist](images/projects/SecureMemberPortal/upload-bad-filetype.png)


## Failed-Login Spike Detection

**The vulnerability:** if failed logins aren't logged, they're invisible. An attacker can brute-force a single account, or spray one common password across many accounts, and the system has no record either way. OWASP lists insufficient logging and monitoring as one of the risks that lets *every other* attack go unnoticed — you can't respond to what you can't see.

**What the portal does about it:**

- Every failed login is logged with a timestamp, the attempted username, role, failure reason, IP address, and user agent. (Successful logins are intentionally *not* logged here — the log exists to surface abuse, not to track normal usage.)
- Internally, three distinct failure reasons are tracked — `USER_NOT_FOUND`, `WRONG_PASSWORD`, `ROLE_MISMATCH` — but externally, the client always receives the same generic 401 response, regardless of reason (same anti-enumeration principle as above, applied at the logging layer too).
- A **president-only dashboard** surfaces this log for review.
- Spike detection runs on two independent thresholds:
  - **Per-account** — catches brute-force / dictionary attacks against a single username.
  - **Per-IP** — catches password spraying and credential-stuffing attempts spread across many accounts from one source.

When a threshold is crossed, it's logged as a spike server-side and surfaced on the alerting dashboard. This is detection and visibility, not automatic lockout — the president reviews and decides what to do about a flagged spike, rather than the system silently locking accounts.

### The failed-login log

Each entry captures the full context needed to distinguish a fat-fingered password from an attack: which reason fired internally, the source IP, and the user agent.

![President dashboard log table showing timestamp, attempted username, role, internal failure reason (WRONG_PASSWORD, ROLE_MISMATCH, USER_NOT_FOUND), IP address, and user agent for each failed attempt](images/projects/SecureMemberPortal/login-log-dashboard.png)

### Same response to the client, regardless of reason

Whatever the internal reason, the user always sees the same generic message — no signal an attacker could use to enumerate valid usernames.

![Frontend and backend both returning the same generic "Invalid credentials provided." message regardless of why the login actually failed](images/projects/SecureMemberPortal/login-generic-response-2.png)

### Spike detection in action

When too many failures pile up against one account (or from one IP) inside the time window, the dashboard raises an alert.

![President dashboard showing a "Possible brute-force activity" alert — account "TTmember1" with 7 failed attempts in 2 minutes — above the detailed log table](images/projects/SecureMemberPortal/spike-detection-1.png)

---

## Repo

[github.com/fyodor-eul/secure-member-portal](https://github.com/fyodor-eul/secure-member-portal)