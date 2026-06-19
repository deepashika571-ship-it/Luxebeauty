# Firestore Security Specification

This security specification details the high-assurance policies protecting the LuxeBeauty booking system.

## Data Invariants

1. **User Ownership**: A user profile document ID (`userId`) must match the authenticated user's UID (`request.auth.uid`). No user can write or modify another user's profile.
2. **Immutability of Key Identity Fields**: Core fields like `uid`, `email`, and `userId` can never be mutated once written.
3. **Role Lock**: Regular users cannot elevate their role to `admin`. The `role` field is strictly immutable for standard users.
4. **Booking Relational Integrity**: A booking must link to a valid `userId` matching the creator, and the price and category cannot be updated post-creation.
5. **Review Creator Lock**: Reviews are publicly readable, but can only be modified or deleted by their respective creators or verified administrators.

## The Dirty Dozen (Attacking Schema Security)

The following malicious payload scenarios are handled and strictly rejected:
1. **Admin Elevation Attempt**: User attempts to sign up or update profile with `"role": "admin"`.
2. **Hijacked ID Injection**: Attacker supplies a massive 1MB string or high-charset junk string as document ID to exhaust database quotas.
3. **Ghost Field Write**: Attacker inserts undocumented parameters into UserProfile like `"isBetaVIPTester": true`.
4. **Spoofed Ownership**: Authenticated user `UID_A` attempts to save a Booking with `userId = "UID_B"`.
5. **Rating Boundary Overflow**: Submitting a service review with `"rating": 99`.
6. **Immutability Breach**: Updating `createdAt` or `originalPrice` on an active catalog item.
7. **Bypassed Step Status Transition**: Elevating booking status directly from `pending` to `completed` without active financial confirmations.
8. **Negative Points Poisoning**: Writing a negative balance to `loyaltyPoints`.
9. **Fake Email Validation**: Initiating OAuth flows or actions when `email_verified` is false (if required).
10. **Shadow Booking Deletion**: Unauthorized delete queries to erase active booking histories.
11. **Malicious Promo Creation**: Attempting to bypass strict administrative boundaries to create custom 100% discount codes in `offers`.
12. **Anonymous Data Corruption**: Submitting reviews or appointments without correct authentication payloads.
