# Dashboard, Analytics & Reports

> Your workspace's "control room" — the screens that turn raw activity into a
> picture you can read at a glance.
>
> 💡 *Every diagram on this page is zoomable — hover it and click **Zoom**.*

## First, the honest bit

These four screens — **Dashboard**, **Analytics**, **Attendance**, and
**Reports** — are **finished, interactive previews filled with sample data**.
They show you exactly what the product will feel like, but the numbers are
**illustrative examples**, not your real figures yet. Think of them as a fully
furnished show-home: the layout is real, the furniture is for display.

```mermaid
flowchart LR
    subgraph Now["Today — preview"]
      SD["Sample data<br/>(illustrative numbers)"] --> V1["Dashboard · Analytics<br/>Attendance · Reports"]
    end
    subgraph Later["Planned"]
      YD["Your real data<br/>(orders, users, attendance)"] --> V2["The same screens,<br/>showing your figures"]
    end
    Now -. "evolves into" .-> Later
```

So as you read on: enjoy the shapes and flows, and know the live wiring to your
own data is the next step.

---

## The story of a morning

Picture the start of a working day. You sign in, and instead of hunting through
tables, you get a single screen that answers *"how are things going?"* — then you
follow the thread wherever it leads.

```mermaid
journey
    title A morning with your workspace
    section Arrive
      Sign in: 5: You
      Scan the Dashboard KPIs: 4: You
    section Dig deeper
      Open Analytics for traffic: 4: You
      Check the Attendance register: 3: You
    section Wrap up
      Download a report to share: 5: You
```

That thread — **glance → explore → export** — is exactly what these four screens
are built to support. Let's walk each one.

---

## 1. Dashboard — the glance

> **Where:** top of the sidebar → **Dashboard**

The Dashboard is your landing screen. It's laid out top-to-bottom so the most
important numbers hit you first, with detail below.

```mermaid
flowchart TB
    H["🔵 Dashboard&nbsp;&nbsp;·&nbsp;&nbsp;[ Today | Week | Month ]"]
    subgraph KPIs["Top row — four headline numbers"]
      direction LR
      A["Revenue<br/>$84,320"]
      B["Orders<br/>1,284"]
      C["Customers<br/>642"]
      D["Conversion<br/>18.6%"]
    end
    R["Monthly Revenue — the trend over time"]
    subgraph Lower["Detail row"]
      direction LR
      O["Recent Orders<br/>(latest activity)"]
      S["Channel Share<br/>(where it came from)"]
    end
    H --> KPIs --> R --> Lower
```

**Reading it, top to bottom:**

- **The period switcher** (top-right): flip between **Today**, **Week**, and
  **Month** to change the window every number reflects.
- **Four stat cards:** the headline health of the workspace — *Revenue*,
  *Orders*, *Customers*, and *Conversion rate*. One glance tells you if today is
  up or down.
- **Monthly Revenue panel:** the trend line — are things climbing or dipping over
  the period?
- **Recent Orders:** the newest activity, so you can see *what* is happening, not
  just the totals.
- **Channel Share:** a breakdown of where activity comes from.

If you only ever open one screen, this is the one.

---

## 2. Analytics — the "why"

> **Where:** top of the sidebar → **Analytics**

Where the Dashboard says *what*, Analytics says *why* — it's about your audience
and how they behave.

Its headline cards cover **Page Views**, **Bounce Rate**, **Average Session**
length, and **Growth**, followed by a **Sales Trend** and a **Channel Share**
breakdown like this:

```mermaid
pie showData
    title Where visitors come from (sample)
    "Direct" : 38
    "Search" : 27
    "Social" : 20
    "Referral" : 15
```

Use Analytics to answer questions the Dashboard raises: *"Orders dipped this
week — did traffic drop, or did fewer visitors convert?"*

---

## 3. Attendance — the register

> **Where:** top of the sidebar → **Attendance**

Attendance is the roll-call view (handy in an education setting). Pick a **month**
at the top, and read a register of each group with who was **present**,
**excused**, and **un-excused**.

| Class | Total | Present | Excused | Un-excused |
|---|---|---|---|---|
| Class A | 32 | 28 | 2 | 2 |
| Class B | 30 | 27 | 1 | 2 |
| Class C | 28 | 25 | 3 | 0 |
| Class D | 34 | 30 | 2 | 2 |

*(Sample register — your real groups and figures will appear here.)* Use the
**month picker** to move through time and the **search box** to jump to a
specific class.

---

## 4. Reports — the export

> **Where:** Account → **Reports**

Reports is where a summary leaves the screen and becomes a file you can share.
You get a searchable list of available reports, each with a **download** action:

```mermaid
flowchart LR
    L["Reports list"] --> P{"Pick a report"}
    P --> R1["Sales Summary — Monthly"]
    P --> R2["User Activity — Weekly"]
    P --> R3["Finance Statement — Quarterly"]
    R1 & R2 & R3 --> D["⬇ Download<br/>(share with your team)"]
```

**How you'll use it:** search for the report you need, then select the
**download** icon on its row. *(The one-click download is being wired up — the
list and layout are ready.)*

---

## How they fit together

Each screen is one zoom level on the same reality — from a single glance all the
way down to a shareable file:

```mermaid
flowchart LR
    D["Dashboard<br/><i>the glance</i>"] --> A["Analytics<br/><i>the why</i>"]
    A --> T["Attendance<br/><i>the detail</i>"]
    T --> R["Reports<br/><i>the export</i>"]
```

## What's live today vs. coming next

| Screen | Live now | Coming next |
|---|---|---|
| **Dashboard** | Full layout, KPI cards, trend & activity panels, period switcher | Cards & charts driven by your real workspace data |
| **Analytics** | Layout, audience KPIs, trend & channel breakdown | Real traffic/behavior once analytics is connected |
| **Attendance** | Month picker, searchable register | Your real groups + saving/editing attendance |
| **Reports** | Searchable report list with download controls | Generated, downloadable report files |

## Tips

- Treat the numbers as **placeholders** for now — the value today is seeing how
  you'll read your data, not the sample values themselves.
- The **period switcher** (Dashboard) and **month picker** (Attendance) are the
  fastest ways to change what you're looking at.
- Every diagram here is **zoomable** — click **Zoom** to inspect it closely.
- Looking for the technical side (how these are built and will be wired up)? See
  the **Developer Guide**.
