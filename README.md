# Dayflow — Human Resource Management System
> Every workday, perfectly aligned.

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to define the functional and non-functional requirements of a *Human Resource Management System (HRMS)*. The system aims to digitize and streamline core HR operations such as employee onboarding, profile management, attendance tracking, leave management, payroll visibility, and approval workflows for administrators and HR officers.

### 1.2 Scope
The HRMS will provide:
- *Secure Authentication:* Sign Up and Sign In mechanisms.
- *Role-Based Access Control (RBAC):* Distinct permissions for Admin/HR vs. Employee.
- *Employee Profile Management:* Comprehensive view and controlled editing of personal/job records.
- *Attendance Tracking:* Check-in/check-out system with daily and weekly views.
- *Leave & Time-Off Management:* End-to-end request and approval workflows.
- *Approval Workflows:* Centralized management queue for HR/Admin.
- *Payroll Visibility:* Read-only access for employees and configuration access for Admins.

### 1.3 Definitions & Abbreviations
- *Admin / HR Officer:* User with management, configuration, and approval privileges.
- *Employee:* Regular user with self-service access to personal data and workflows.
- *Time-Off / Leave:* Paid leave, sick leave, unpaid leave, casual leave, etc.
- *HRMS:* Human Resource Management System.

---

## 2. User Classes and Characteristics

| User Type | Description |
| :--- | :--- |
| *Admin / HR Officer* | Manages employees, configures salary structures, approves/rejects leave requests, monitors company-wide attendance, and oversees HR operations. |
| *Employee* | Views personal profile, logs daily attendance (check-in/check-out), applies for leave/time-off, and views personal payroll/salary details. |

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

#### 3.1.1 Sign Up
- Users can register using:
  - *Employee ID*
  - *Email*
  - *Password*
  - *Role* (Employee / HR Officer / Admin)
- Passwords must adhere to standard security rules (length, special characters, etc.).
- Email verification is required before account activation.

#### 3.1.2 Sign In
- Users can log in using their registered *Email* and *Password*.
- Incorrect credentials display appropriate, user-friendly error messages.
- Successful authentication redirects users to their role-specific dashboard.

---

### 3.2 Dashboard

#### 3.2.1 Employee Dashboard
- Quick-access action cards:
  - *Profile*
  - *Attendance* (Quick Check-in / Check-out)
  - *Leave Requests*
  - *Logout*
- Overview of recent activity, announcements, and alert notifications.

#### 3.2.2 Admin / HR Dashboard
- Overview metrics and quick-access panels:
  - *Employee Directory / List*
  - *Company Attendance Records*
  - *Pending Leave Approvals*
- Fast employee-switching capability for individual record management.

---

### 3.3 Employee Profile Management

#### 3.3.1 View Profile
Employees can view:
- *Personal Details:* Full name, contact information, emergency contacts, address.
- *Job Details:* Designation, department, reporting manager, date of joining, employment status.
- *Salary Structure:* CTC breakdown, allowances, deductions (read-only).
- *Documents:* Identification proofs, offer letters, uploaded certifications.
- *Profile Picture:* Employee avatar/photo.

#### 3.3.2 Edit Profile
- *Employee Permissions:* Can edit limited fields (e.g., residential address, contact phone number, profile picture).
- *Admin Permissions:* Full edit access across all employee fields, designations, roles, and salary configurations.

---

### 3.4 Attendance Management

#### 3.4.1 Attendance Tracking
- Daily and weekly interactive attendance views.
- Digital one-click *Check-in / Check-out* for employees.
- Status classifications:
  - Present
  - Absent
  - Half-day
  - Leave

#### 3.4.2 Attendance Visibility
- *Employees:* Can view only their own historical and current attendance records.
- *Admin / HR:* Can view, filter, and export attendance records across all employees and departments.

---

### 3.5 Leave & Time-Off Management

#### 3.5.1 Apply for Leave (Employee)
- Employees can submit leave requests by specifying:
  - *Leave Type:* Paid Leave, Sick Leave, Unpaid Leave, etc.
  - *Date Range:* Start date to end date (with half-day options if applicable).
  - *Remarks / Reason:* Mandatory or optional context notes.
- Real-time leave request statuses:
  - Pending
  - Approved
  - Rejected

#### 3.5.2 Leave Approval (Admin / HR)
- Centralized review table of all pending and past leave requests.
- Actions available to Admin/HR:
  - *Approve* or *Reject* with optional reviewer comments.
- Status changes reflect immediately in the employee's dashboard and attendance log.

---

### 3.6 Payroll / Salary Management

#### 3.6.1 Employee Payroll View
- Transparent, read-only view of salary slips, basic pay, allowances, deductions, and net salary.

#### 3.6.2 Admin Payroll Control
- Comprehensive view of payroll data across all employees.
- Capability to create and update salary structures.
- Tools to ensure payroll accuracy and adjustments.

---

## 4. Future Enhancements

- *Automated Notifications & Email Alerts:* Real-time email and in-app updates for leave approvals, attendance reminders, and announcements.
- *Analytics & Reporting Dashboard:* Exportable visual reports (e.g., downloadable PDF salary slips, monthly attendance summaries, attrition and headcount metrics).

---

## 5. References & Architecture Diagrams

- *Excalidraw Design Board:* [Dayflow Architecture & Wireframes](https://link.excalidraw.com/l/65VNwvy7c4X/58RLEJ4oOwh)
