# Privacy Policy

Last Updated on May 24, 2021

## 1. Information We Collect

**Personal Information**

We do NOT collect and use Personal Information in any way.

**Non-Personal Information**

In order to perform core functionality of the Streaming Slack Notify service, we collect the following data:

- Registered Slack workspace name
- Registered Slack Application ID
- Registered GitHub organization/username
- Registered GitHub/Slack configuration options including channel and bot username
- Timestamps of latest webhook events

Additionally, we aggregate workflow run stats (count + duration) and store these in a 3rd party service (FaunaDB). Data is transfered over SSL.

All information is stored security and will not be shared with anyone except as described in this Privacy Policy.

## 2. Security

- Infrastructure hosted in AWS with least privilege and best-practice security considerations in place. (See `./terraform` directory)
- App service is completely stateless
- All HTTP communication uses SSL/HTTPS
- Encryption at rest

## 3. Children’s Privacy

The Streaming Slack Notify services are not intended for use by children. If you are under 13, you may use install and configure services with a parent or guardian.

## 4. Privacy Change

We may update our Privacy Policy from time to time. Thus, you are advised to review this page periodically for any changes. These changes are effective immediately after they are posted on this page.

## 5. Contact Us
If you have any questions about our Privacy Policy, please contact: support@techpivot.net
