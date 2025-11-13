# Phone Number Normalization Implementation

## Tasks
- [x] Add normalizeKenyanNumber function to src/lib/utils.ts
- [x] Update isValidKenyanNumber and formatPhoneNumber in src/lib/sms.ts to use new normalization
- [x] Enhance phone validation in src/app/actions.ts CreateCheckoutSchema
- [x] Update src/lib/payments.ts to normalize phone numbers before STK Push
- [x] Add phone_number field to Payment model in prisma/schema.prisma
- [x] Update payment creation logic to store normalized phone number
- [x] Test normalization with various inputs (0712345678, +254712345678, 254712345678)
