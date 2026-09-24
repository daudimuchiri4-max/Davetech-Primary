# DAVETECH Primary School ERP — Clean Commercial Copy

This folder is a clean software copy intended to be configured for a new school.

## IMPORTANT

This copy must NEVER be connected to the original school's Firebase project.
The Firebase configuration in `firebase-applet-config.json` contains placeholders only.

## New school setup

1. Create a completely new Firebase project for the customer.
2. Enable Authentication (Email/Password and any other methods the customer needs).
3. Create a new Firestore database.
4. Create a new Storage bucket.
5. Replace the placeholder values in `firebase-applet-config.json` with the NEW school's Firebase web configuration.
6. Deploy the included Firestore rules after reviewing them for the school's final roles and workflows.
7. Configure the school's name, logo, contact details, payment details, academic dates, and website content from the ERP Settings/CMS.
8. Create the first real administrator account for the customer.

## Data isolation

The original Gracia Learning Centre Firebase project and Firestore data are not included in this copy.
Do not copy the original school's Firestore export, Authentication users, Storage files, or `.env` secrets into this project.

## Local/browser storage

The source application contains some existing browser-cache/session mechanisms inherited from the original working application. They are not a substitute for the new school's Firestore database. Clear the browser profile when testing a fresh installation.

## Before selling

- Verify the Firebase project ID is the NEW customer's project.
- Verify no original student, parent, staff, payment, or website data appears.
- Change the school's logo and details.
- Test admin, teacher, parent, and student access.
- Test fees, payments, exams, attendance, reports, printing, and public website.
- Test Firestore rules from an unauthenticated browser and a normal school account.
