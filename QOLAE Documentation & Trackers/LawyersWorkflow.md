LAWYERS WORKFLOW STEPS


1.	The lawyers request CV and  Terms of Business. Liz also adds Case Studies. This is sent by through the Admin-Dashboard-Beta1 project process from the Lawyers Tracking Database.

2. 	Introductory Email sent to them once box is ticked in Liz’s Lawyer Tracking Database workflow.

3. 	Lawyer decides to engage Liz and clicks on ‘clickable link’ in the introductory email where the pin number is highlighted within the email.

4. 	This link takes Lawyer to the QOLAE Login portal for a 2way/multi-factor login 	process. Will need to consider how the PIN number can be automatically applied 	here and to the workspace that the Lawyer will be working in. The PIN will be their own identification number and will be added to their invoices in the future. This 2FA verification takes the Lawyer to the LawyersDashboard and their own Personal Workspace

5. The Lawyers Dashboard opens out onto a Welcome Card, a Workflow Progress Card and 6 Workflow cards.

6. 	The first Terms Of Business Workflow card has a Review & Sign Terms button, that when clicked opens to a tobModal on the LawyersDashboard page. 

There are 4 tobModal workflow steps: 
a) Email Notification and Preference opt in or opt out:

Email preferenc checkboxes,  which send emails after each gateway point. There are congratulatory visual cues/pop ups/messages/bell or ding sounds, after every successful workflow stage.


b)Digital Signature: The signing of Lawyers signature which is displayed on a canvas which the Lawyer adds their signature to.

Once Lawyer signs, Liz’s signature is automatically added from central-repository/signatures and originally the intention was to saved this to the  /signed-tob folder.

c) A review of the signed docuemnt so that the Lawyer can see their signature and Liz's signature in the document. (Ideally it would be great for the conversion to pdf to happen here so that this is what the Lawyer sees.)

d)Completion of this workflow shows completion and  the Lawyer clicks on the Return to Dashboar and returns back to the dashboard where they can view and download the signed pdf document. This document will also be available in their Documents Library - another workflow that opens up, later in the process. 

7. 	The next gate Complete Payment WOrkflow opens and the Lawyer is directed to the payment section, a link to services and an invoice on QBO will be offered. There is only a choice to pay by Direct Banking. 75% of the upfront fee is requested and an email and receipt are sent as soon as this is paid. 

The invoice will be available to view immediately .

8. 	This is the Inner Portal and after payment is made, the Client Consent form Workflow card and gateway are opened. The details are filled out by the Lawyer. Name, date of birth, Address, telephone number and email address. NOTE: This triggers an automatic population of all forms across the system. So as to prevent repetition. Which is why Liz has chosen a more robust Lawyers Database with raw sql format. 

9. There is the ability to download the Consent form and send off in the post if the Client wants this and also to upload the Law firms own consent form, provided it meets with Liz’s Consent Policy. NOTE: the ability to scan and digitise any forms that are uploaded and placed onto the portal must be made capable. Lawyers can review the email that is sent with the consent form, once they have filled it out and there is a tick box which they then tick and the email and consent form are sent to client.


10. The Next gate opens and the Lawyer is directed to the ‘Case Referrals & Instructions Workflow card.This has already been populated with the Client’s details and so the Lawyer just fills in their instructions and answers a few questions on this form. 

11. The Documents Library is the next workflow card and where the Lawyer can upload their in-house instruction form if necessary. Medical notes, documents, Letters, pictures and videos.

12. NOTE: Liz/Case Manager's will not be able to access the medical notes or confidential information of the Client until consent has been received!!!! So the system closes this part of the
portal off for Case Managers until consent has arrived. Lawyer’s will be red flagged about this on the system, so that they are aware.

13. The lawyer will have access to the portal with the Law firm specific pin, a username and password. They can check for status updates within the portal.

14. Once consent has been verified and returned to the portal, Liz’s automatic signature will be applied and the Lawyer can download this consent form for their case notes.

15. A Final completion email is then sent to the Lawyer.


SUMMARY:
Across the workflows I would like some visual messages to distract from boredom and
encourage inspiring an efficient and consistent workflow. See below:

Examples of Congratulatory Visual Messages
• Default Setting: Display visual confirmations after each step in the portal, such as:
- 🎉 “Congratulations! Step 1 Complete: Terms of Business Signed.”
- ✅ “Next Step: Make Payment.”