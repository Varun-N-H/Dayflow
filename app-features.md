# Dayflow — Comprehensive Application Features & UI/UX Blueprints

This document contains the complete, pixel-accurate, blueprint-level architectural and visual specifications for **Dayflow HRMS**, reconstructed directly from the official wireframe blueprints (`one.png` through `six.png`).

---

## 1. Global Shell & Navigation Framework (App-Wide)

Across all authenticated screens, the application features a persistent top navigation bar.

### 1.1 Top Navigation Bar Structure
* **Left Section:**
  * **Company Logo:** Dynamic image branding rendered from the registered company profile.
  * **Main Navigation Tabs (Pill / Tab Navigation):**
    * `Employees` $\rightarrow$ Routes to `/employees` (Employee Directory & Main Dashboard).
    * `Attendance` $\rightarrow$ Routes to `/attendance` (Daily/Monthly Attendance Logs & Tracking).
    * `Time Off` $\rightarrow$ Routes to `/time-off` (Leave Management, Calendar & Approvals).
    * *Active Tab Indicator:* Highlighted with accent border/background.
* **Right Section (Systray & User Controls):**
  * **Real-Time Attendance Status Indicator (Dot):**
    * 🔴 **Red Dot:** Checked Out / Not currently working.
    * 🟢 **Green Dot:** Checked IN / Currently on duty.
  * **Quick Attendance Systray Button (Action Toggle):**
    * When Checked Out: Displays `Check IN ->` button. Clicking registers punch-in timestamp, transitions status dot to 🟢 Green, and logs check-in in attendance records.
    * When Checked IN: Displays `Check Out ->` button. Clicking registers punch-out timestamp, calculates total work hours and extra hours, and transitions dot back to 🔴 Red.
  * **User Profile Picture (Avatar):**
    * Circular avatar image with fallback initials.
    * **Click Trigger:** Opens a floating contextual dropdown menu with options:
      1. `My Profile` $\rightarrow$ Opens the current user's profile in form view (`/profile`).
      2. `Log Out` $\rightarrow$ Terminates session and redirects to `/signin`.

---

## 2. Screen 1: Authentication & Onboarding (Wireframe `one.png`)

### 2.1 Sign In View (`/signin`)
* **Visual Layout:** Centered, sleek card container on dark theme with subtle border elevation.
* **UI Components (Top to Bottom):**
  1. **Branding Area:** Centered `App/Web Logo` banner.
  2. **Identifier Input:**
     * Label: `Login Id/Email :-`
     * Input: Text field supporting either **Login ID** (e.g., `OIJODO20220001`) OR registered **Email**.
  3. **Password Input:**
     * Label: `Password :-`
     * Input: Masked password field.
  4. **Primary CTA:**
     * Button Text: `SIGN IN`
     * Styling: Full-width vibrant purple button (`#9333ea` / `#a855f7`), pill-shaped.
  5. **Footer Link:**
     * Text: `Don't have an Account? Sign Up` $\rightarrow$ Navigates to `/signup`.
* **Business Logic & Workflow:**
  * System resolves login via Supabase Auth (maps custom Login IDs to registered auth emails if an ID was entered).
  * **First-Login Interceptor:** If the user is logging in with a system-generated default password, the app halts dashboard redirection and immediately displays a **Mandatory Password Reset** screen.
  * Role-based redirection upon successful authentication:
    * `Admin` / `HR Officer` $\rightarrow$ Admin Overview (`/employees`)
    * `Employee` $\rightarrow$ Employee Dashboard (`/employees`)

---

### 2.2 Sign Up View — Company / Organization Registration (`/signup`)
* **Visual Layout:** Centered, expanded form card container.
* **UI Components (Top to Bottom):**
  1. **Branding Area:** Centered `App/Web Logo`.
  2. **Company Name & Logo Row:**
     * Label: `Company Name :-`
     * Text Input: Company Name (e.g., *Odoo India*).
     * Blue Upload Action Button: `Upload Logo` icon button (opens file picker, previews logo, and uploads to Supabase Storage).
  3. **Admin Full Name:**
     * Label: `Name :-`
     * Input: Text field for Primary Admin / HR Creator.
  4. **Email Address:**
     * Label: `Email :-`
     * Input: Email field (used for root auth and confirmation).
  5. **Phone Number:**
     * Label: `Phone :-`
     * Input: Contact phone number.
  6. **Password:**
     * Label: `Password :-`
     * Input: Password field with show/hide eye toggle icon.
  7. **Confirm Password:**
     * Label: `Confirm Password :-`
     * Input: Confirmation password field with matching validation and show/hide eye toggle icon.
  8. **Primary CTA:**
     * Button Text: `Sign Up` (Purple accent button).
  9. **Footer Link:**
     * Text: `Already have an account ? Sign In` $\rightarrow$ Navigates to `/signin`.

---

### 2.3 Employee Provisioning & Deterministic Login ID Algorithm
* **Security & Access Constraint:** Regular employees **cannot** register through the public Sign Up page. They must be onboarded internally by an `Admin` or `HR Officer`.
* **Temporary Credential Generation:** When an Admin creates an employee, the system auto-generates a secure temporary password and assigns their deterministic Login ID.
* **Deterministic Login ID Formula:**
  $$\mathbf{LoginID} = [\text{Company Initials}] + [\text{Name Code}] + [\text{Year of Joining}] + [\text{4-Digit Serial}]$$
  * **Example:** `OIJODO20220001`
    * `OI` = Company Initials (*Odoo India*)
    * `JODO` = First 2 letters of First Name (`JO`hn) + First 2 letters of Last Name (`DO`e)
    * `2022` = Year of Joining
    * `0001` = Sequential joining number in that calendar year.

---

## 3. Screen 2: Employee Directory & Main Dashboard (Wireframe `two.png`)

* **Route:** `/employees` (Primary post-login landing view: *"After login the user must land on this page"*).
* **Top Sub-Header & Controls Bar:**
  * **Action Button:** `NEW` (Purple accent button on the left — visible to Admin/HR to open the Employee Onboarding Drawer/Modal).
  * **Search Bar:** Centered pill search input (`Search`) for live filtering by employee name, login ID, department, or job title.
  * **Footer / Side Navigation:** `Settings` link at bottom-left corner.

### 3.1 Employee Card Grid (Kanban / Gallery View)
* **Layout:** Responsive 3-column card grid (3x3 default view).
* **Individual Employee Card Elements:**
  * **Card Container:** Rounded bordered box with hover elevation effect. **Clicking any card opens that employee's full Profile page in View-Only (non-editable) mode for regular employees, or full Editable mode for Admins.**
  * **Left Side:** Square bordered Employee Profile Picture / Avatar.
  * **Center / Bottom:** `[Employee Name]` heading, designation, and basic contact info.
  * **Top-Right Status Badge (Live Attendance / Availability Indicator):**
    * 🟢 **Green Dot:** Employee is present in the office (Checked IN).
    * ✈️ **Airplane Icon:** Employee is on approved leave / time off.
    * 🟡 **Yellow Dot:** Employee is absent (has not applied for time off and is not checked in).

---

## 4. Screens 3 & 4: Comprehensive Employee Profile & Salary Engine (Wireframes `three.png` & `four.png`)

* **Route:** `/profile` (Self-Profile) or `/employees/[id]` (Individual Employee Record).
* **Profile Header Section:**
  * **Top Header Label:** `My Profile` (or Employee Name).
  * **Left:** Large circular avatar with edit pencil icon button (triggers image upload and updates avatar in Supabase Storage).
  * **Core Information Grid (Two Columns):**
    * **Left Column:**
      * `My Name` (Prominent heading / input)
      * `Login ID` (System-generated read-only string, e.g., `OIJODO20220001`)
      * `Job Position` / Designation
      * `Email`
      * `Mobile`
    * **Right Column:**
      * `Company` (Company Name)
      * `Department` (e.g., Engineering, Human Resources, Sales)
      * `Manager` (Reporting Manager selection / text)
      * `Location` (Branch / Work Location)

---

### 4.1 Role-Based Profile Tabs System
The profile structure adapts based on user role:

| Tab Name | Visible to Regular Employee? | Visible to Admin / HR Officer? | Purpose |
| :--- | :---: | :---: | :--- |
| **`Resume`** | ✅ Yes | ✅ Yes | Biographical details, passions, skills, and certifications. |
| **`Private Info`** | ✅ Yes (Limited edit) | ✅ Yes (Full edit) | Personal address, DOB, nationality, PAN, UAN, Bank details. |
| **`Salary Info`** | ❌ **Hidden (Admin Only)** | ✅ **Yes (Full edit)** | Monthly wage, salary breakdown, PF, and tax deductions. |
| **`Security`** | ✅ Yes | ✅ Yes | Password reset and session management. |

---

### 4.2 Tab 1: `Resume` Tab Content (Wireframe `three.png`)
* **Left Column (Biographical & Passion Cards):**
  * **Card 1 — `About` (with pencil edit icon):** Multi-line text area for professional bio.
  * **Card 2 — `What I love about my job` (with pencil edit icon):** Multi-line text area capturing role motivation.
  * **Card 3 — `My interests and hobbies` (with pencil edit icon):** Multi-line text area for personal interests.
* **Right Column (Competency & Credentials Cards):**
  * **Card 1 — `Skills`:**
    * Displays skill badges/tags.
    * `+ Add Skills` button to add new skills.
  * **Card 2 — `Certification`:**
    * Displays certifications and issuing bodies.
    * `+ Add Skills` / `+ Add Certification` button to add credentials.

---

### 4.3 Tab 2: `Private Info` Tab Content (Wireframe `four.png`)
* **Left Column — Personal & Contact Details:**
  * `Date of Birth`: Date input.
  * `Residing Address`: Address input.
  * `Nationality`: Text / dropdown input.
  * `Personal Email`: Personal email address.
  * `Gender`: Gender selection (`Male`, `Female`, `Other`).
  * `Marital Status`: Marital status (`Single`, `Married`, etc.).
  * `Date of Joining`: Employment start date.
* **Right Column — Bank Details & Statutory Identifiers:**
  * *Section Header:* `Bank Details`
  * `Account Number`: Bank account number.
  * `Bank Name`: Financial institution name.
  * `IFSC Code`: Bank IFSC / routing code.
  * `PAN No`: Permanent Account Number (Tax ID).
  * `UAN NO`: Universal Account Number (PF ID).
  * `Emp Code`: Internal Employee Code.

---

### 4.4 Tab 3: `Salary Info` Tab Content (Wireframes `three.png` & `four.png` — Admin Access Only)
* **Access Rule:** Strictly visible and editable only by `Admin` and `HR Officer` roles (*"Salary Info tab Should only be visible to Admin"*).
* **Top Summary Overview Row:**
  * `Month Wage`: Defined base monthly wage (e.g., `50000` `/ Month`).
  * `Yearly wage`: Auto-calculated yearly wage (e.g., $\text{Month Wage} \times 12 = `600000` \text{ / Yearly}$).
  * `No of working days in a week`: Working days schedule (e.g., `5`).
  * `Break Time`: Shift break duration (e.g., `1` `/hrs`).

#### **Automated Salary Breakdown & Calculation Engine:**
* **Left Sub-Column — Salary Components (Auto-Calculated):**
  1. **`Basic Salary`:**
     * Rate: `50.00 %` of Monthly Wage $\rightarrow$ Computed: `₹ 25000.00 / month`
     * Rule: *Define Basic salary from company cost, computed based on monthly wages.*
  2. **`House Rent Allowance (HRA)`:**
     * Rate: `50.00 %` of Basic Salary $\rightarrow$ Computed: `₹ 12500.00 / month`
     * Rule: *HRA provided to employees as 50% of the basic salary.*
  3. **`Standard Allowance`:**
     * Predetermined fixed amount $\rightarrow$ Computed: `₹ 4167.00 / month` (`16.67 %` of Basic)
     * Rule: *Predetermined fixed amount provided to employee as part of salary.*
  4. **`Performance Bonus`:**
     * Rate: `8.33 %` of Basic Salary $\rightarrow$ Computed: `₹ 2082.50 / month`
     * Rule: *Variable amount defined by company, calculated as % of basic salary.*
  5. **`Leave Travel Allowance (LTA)`:**
     * Rate: `8.33 %` of Basic Salary $\rightarrow$ Computed: `₹ 2082.50 / month`
     * Rule: *LTA paid to cover travel expenses, calculated as % of basic salary.*
  6. **`Fixed Allowance` (Residual Balancing Component):**
     * Computed formula: 
       $$\text{Fixed Allowance} = \text{Monthly Wage} - (\text{Basic} + \text{HRA} + \text{Standard} + \text{Bonus} + \text{LTA})$$
       $$\text{Fixed Allowance} = 50000 - (25000 + 12500 + 4167 + 2082.50 + 2082.50) = \mathbf{₹ 2918.00 \text{ / month}} \ (11.67\%)$$
     * Rule: *Auto-adjusts to ensure the sum of all salary components perfectly equals the defined Monthly Wage.*

* **Right Sub-Column — Contributions & Deductions:**
  1. **`Provident Fund (PF) Contribution`:**
     * **`Employee PF`:** `12.00 %` of Basic Salary $\rightarrow$ `₹ 3000.00 / month`
     * **`Employer PF`:** `12.00 %` of Basic Salary $\rightarrow$ `₹ 3000.00 / month`
     * Rule: *PF is calculated based on the basic salary.*
  2. **`Tax Deductions`:**
     * **`Professional Tax (PT)`:** Flat rate $\rightarrow$ `₹ 200.00 / month` (deducted from gross salary).

---

### 4.5 Tab 4: `Security` Tab Content (Wireframe `four.png`)
* **Components:**
  * Current Password input field.
  * New Password & Confirm New Password input fields.
  * `Update Password` CTA button.

---

## 5. Screen 5: Attendance Module & Payroll Linkage (Wireframe `five.png`)

* **Route:** `/attendance`
* **Core Business Logic & Payroll Integration (Note Box):**
  * On the Attendance page, users see day-wise attendance of themselves by default for the ongoing month.
  * Admins/HR Officers see attendance for all employees present on the current day.
  * Attendance records serve as the authoritative baseline for automated payslip generation.
  * The system uses generated attendance records to determine the total number of **payable days** for each employee.
  * Any unapproved absence or unpaid leave day automatically deducts proportional pay during payslip computation.

---

### 5.1 Admin / HR Officer Attendance List View
* **Top Header & Controls Row:**
  * Title: `Attendance`
  * Centered search bar: `Searchbar` (live filter by employee name or ID).
  * Date Navigation: `<-` (Previous Day) | `->` (Next Day) | `Date v` (Date Picker) | `Day` view toggle.
* **Daily Attendance Summary Banner:** Displays active date (e.g., `22, October 2025`).
* **Attendance Table Columns:**
  | Column Header | Description | Sample Data |
  | :--- | :--- | :--- |
  | **`Emp`** | Employee Name & Avatar / ID | `John Doe (OIJODO20220001)` |
  | **`Check In`** | Morning punch-in time | `10:00` |
  | **`Check Out`** | Evening punch-out time | `19:00` |
  | **`Work Hours`** | Effective working hours | `09:00` |
  | **`Extra hours`** | Overtime / extra hours | `01:00` |

---

### 5.2 Employee Self-Service Attendance View
* **Top Header & Metrics Cards Row:**
  * Title: `Attendance`
  * Month Selector: `<-` | `->` | `Oct v` (Month selector dropdown).
  * **Summary KPI Metric Badges (Top-Right):**
    * `Count of days present`: Number of present days in the selected month (e.g., `20`).
    * `Leaves count`: Number of leaves taken in the selected month (e.g., `2`).
    * `Total working days`: Total official working days in the month (e.g., `22`).
* **Monthly Attendance Ledger Table:**
  | Column Header | Description | Sample Data |
  | :--- | :--- | :--- |
  | **`Date`** | Calendar date | `28/10/2025` |
  | **`Check In`** | Punch-in time | `10:00` |
  | **`Check Out`** | Punch-out time | `19:00` |
  | **`Work Hours`** | Calculated work duration | `09:00` |
  | **`Extra hours`** | Overtime hours | `01:00` |

---

## 6. Screen 6: Time Off / Leave Management & Approval Workflows (Wireframe `six.png`)

* **Route:** `/time-off`
* **Supported Leave Categories:**
  1. `Paid Time off` (Annual / Vacation Leave)
  2. `Sick Leave` (Medical Leave with certificate attachment)
  3. `Unpaid Leaves` (Loss of Pay / Unpaid Time Off)

---

### 6.1 Admin & HR Officer View (Review & Approvals Queue)
* **Sub-Header Navigation Tabs:**
  * `Time Off` (Active tab — View all employee leave requests).
  * `Allocation` (Configure annual leave quotas per employee / department).
* **Search & Action Bar:**
  * `NEW` button (Purple CTA to log leave on behalf of an employee).
  * `Searchbar` (Filter requests by employee name, status, or date).
* **Company Balance Overview Badges:**
  * `Paid time Off`: `24 Days Available` (Blue metric badge).
  * `Sick time off`: `07 Days Available` (Blue metric badge).
* **Leave Requests Review Table:**
  | Column Header | Description | Action / Data |
  | :--- | :--- | :--- |
  | **`Name`** | Employee Name | `[Emp Name]` |
  | **`Start Date`** | Leave start date | `28/10/2025` |
  | **`End Date`** | Leave end date | `28/10/2025` |
  | **`Time off Type`** | Leave classification | `Paid time Off` |
  | **`Status` / Actions** | Reviewer Action Controls | 🔴 **Reject Button** & 🟢 **Approve Button** |
* **Action Workflow:**
  * Clicking 🟢 **Approve** immediately updates status to `Approved`, marks dates on the company calendar, reflects on the employee's status badge (✈️ Airplane icon on leave days), and deducts from the balance.
  * Clicking 🔴 **Reject** updates status to `Rejected`.

---

### 6.2 Employee Self-Service Time Off View (Interactive Calendar & Balance)
* **Sub-Header & Balance Cards:**
  * `Time Off` title with `NEW` purple button (opens Leave Request modal).
  * `Paid time Off`: `24 Days Available` badge.
  * `Sick time off`: `07 Days Available` badge.
* **Interactive 12-Month Calendar Grid View:**
  * Displays full year month-by-month grid (January through December).
  * **Color-coded Day Indicators:**
    * Public / Company Holidays (e.g., Republic Day, Independence Day).
    * Approved Leave Days (solid accent highlight).
    * Pending Approval Days (dashed / warning highlight).
  * **Direct Interaction:** Clicking any date on the calendar directly opens the **Time Off Request Modal** pre-filled with that selected date.

---

### 6.3 Time Off Request Modal (`Time off Type Request`)
* **Modal Dialog Structure:**
  * Header: `Time off Type Request` with `X` close icon in top-right.
  * **Form Fields:**
    1. **`Employee`:** `[Employee Name]` (Auto-populated with current user).
    2. **`Time off Type`:** Dropdown selector (`Paid time off`, `Sick Leave`, `Unpaid Leaves`).
    3. **`Validity Period`:** Dual date pickers (`May 13` `To` `May 14`).
    4. **`Allocation`:** Auto-computed duration text (e.g., `01.00` `Days`).
    5. **`Attachment:`** File upload action icon button (`Upload icon`) with label `(For sick leave certificate)` for medical notes.
  * **Modal Action Footer:**
    * **`Submit`:** Vibrant purple CTA button (submits request to Supabase DB and creates real-time notification for Admin).
    * **`Discard`:** Secondary ghost button (closes modal without saving).
