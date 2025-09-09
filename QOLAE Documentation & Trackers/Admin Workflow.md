Admin/Liz's - Case Managers'/Admin Workflow

1.  Liz reaches out to Law Firms through the Web, Telephone or email.  MARKETING/OUTREACH. She logs in to admin.qolae.com/AdminLogin page and logs in as admin with a password. There is an option to change password on this page. The page has the company logo on it as well.This page will be admin.qolae.com/AdminLogin and once logged in, takes the user to the QOLAE Admin Dashboard page.

2.  Liz/Admin user fills out the Lawyers Registration card (LawyersRegistrationForm) on QOLAE Admin Dashboard-Beta1, this page will be admin.qolae.com/LawyersRegistrationForm eventually. The fields/labels in this card are: Law Firm Name, Contact Name, Email and Phone number. 	Once these are filled out, then the “Generate Pin” button is clicked, which autogenerates a PIN number made up of the first letters of the Law Firm/Firms 	(minus LLP/company). The  “Register Law Firm” button is clicked which shows a pop up modal to confirm that the details have been registered and filtered to the next page, which is the Lawyers Tracking Database page. Then the “Go to Database” button once clicked takes the user to the LawyersTrackingDatabase/view page.There is also a "Back to Login" button at the top right of this Lawyers Registration Form which can take the user back to the AdminLogin page.

3.  The Lawyers Tracking Database is admin-qolae.com/LawyersTrackingDatabase or /LawyersTrackingDatabase/view. All the fields/labels will be completed on this page from the automated function of the previous Lawyers Registration card/page. The extra’s on this page/card are:
	Status: updates(dropdown menu showing - Pending,Follow-up-Required, Documents Ready, Email Sent,Completed - these last 3 will be automated and connected to the Checkboxes).
	Notes: (an add note and edit node modal that expands and collapses and also records the time and date of each note entry).
	Last modified:Timestamp under the notes box, for any interaction with this card. 

4.  	Once the Lawyers contact Liz to request her CV and Terms of Business, this sets Liz's/Admin Workflow in motion.

5.  	The Checkboxes:  
	“Ready to Generate Documents”: When this box is ticked it performs the following actions: 

	a). Auto-populates the form fields tailored to each Law Firm (from the TemplateTOB.pdf), populating the name of the Law firm and their representative, current date, Pin number, in the title page and 3 other pages (pages 19,20,21 & 22 of this document).

	b). Attaches the customised TOB.pdf to the Introductory email. 

	c). Adds the clickable PIN number/hyperlink to the Introductory Email and also 	hyperlinks the PIN on the Lawyers Tracking Database Card. And finally 

	d). Saves the tailored TOB.pdf to the /temp folder, which sits within the central-repository folder in the backend of this project.This ends the Ready to Generate Documents workflow.
	“Send Email”: When this Checkbox is ticked, the Introductory Email is sent with all 3 attached pdf documents off to the Law Firm’s representative.

	“Push to Central Repository”: When this Checkbox is ticked, the copy of the customised TOB.pdf is pushed into the /final-tob folder for API accessibility. And this workflow ends.


6. The “Preview Docs” button: shows the 3 documents in a drop down menu. Once Liz clicks on each of the documents, they each open in a modal window showing the documents as they are prior to ticking the first tick box "Ready to Generate Documents.” Once this Checkbox is ticked, the CV.pdf, CaseStudies.pdf and TOB.pdf is added to the Introductory Email. And once the  Preview Docs button is clicked this time,  the  “Terms of Business” shows a customised version of the TOB.pdf  with it’s automatically populated information in the form fields. 

	The “Preview Email” button shows the Introductory Email when first opened without ticking the first Checkbox. Once the “Ready to Generate Documents,” is ticked and the Preview Email button is ticked again to check, the Introductory Email shows all the documents attached and the PIN numbers within the email, now hyperlinked in blue. This Introductory Email can be edited and opens out in modal that allows for editing and saving. So an Edit and Save Button will be visible at the top/bottom of this modal canvas. 

7.	Once the customised TOB.pdf has been generated and reviewed, then Liz ticks the the Send Email checkbox, which sends off the Email with the attached documents from the /temp folder and then Liz ticks the “Push to Central Repository” Checkbox to push the copy of the tailored TOB.pdf file from the /temp folder into the 	/final-tob folder (also within the central-repository folder) to be API accessible to the Lawyers-Dashboard in the future workflow. All api endpoint codebase and stack will be maintained - in api.qolae.com/ and for this part of the workflow in api.qolae.com/central-repository/final-tob/TOB_<pin>.pdf).

	This ensures secure archival and future access without introducing complexity into the main workflow.

8.  	The CV, TOB and Case Studies along with an Introductory letter are sent to the Law firm once the 'Send Email' box is ticked.

9.  	The “Push to Central Repository” Checkbox ends the Admin Workflow. Liz uses the Lawyers Tracking Database to follow up as necessary.

10. 	When the Lawyers decide to engage Liz & QOLAE, then they click on the link within the email and commence their Lawyer's workflow. The email link directs them to the lawyers.qolae.com/login - this is a separate workflow and currently in progress with QOLAE-Lawyers-Dashboard.




LAWYERS WORKFLOW STEPS


1.  The lawyers request CV and  Terms of Business. Liz also adds Case Studies.

2. 	Introductory Email sent to them once box is ticked in Liz’s Lawyer Tracking	 Database workflow.

3. 	Lawyer decides to engage Liz and clicks on ‘clickable link’ in the introductory email where the pin number is highlighted within the email.

4. 	This link takes Lawyer to the QOLAE Login portal for a 2way/multi-factor login 	process. Will need to consider how the PIN number can be automatically applied here and to the workspace that the Lawyer will be working in. The PIN will be their own identification number and will be added to their invoices in the future. 






SUMMARY OF WHAT LIZ WOULD LIKE TO SEE HAPPENING WITHIN THE LAWYERS TRACKING DATABASE PAGE/WORKSPACE.

I would like a Workspace Dashboard page that shows a large heading title with Lawyers Tracking Database visible and left aligned at the top of the page, in purple # 693382  with Baskerville Font text. 

At the top right of this page, there will be a “Back to Registration” button in blue with white text. I’m undecided about the “Search/Question” box I think this can be placed at the top of the page too. The Database cards will appear on this workspace automatically and I would like a ‘bell’ sound to also resonate as this Workspace opens. I’m unsure whether a DB system such as PostgreSQL may be prudent to work alongside this as the rest of my Online Portal will need this feature anyway. How this works with an aesthetically elegantly designed Database Card, I’m unsure of at this time. Each Database Card will be stored in a ‘Library stack” which is visible on the workspace and each Database Card can be dragged and dropped into the main workspace for working on solely.Once all the above workflow is finally complete, a celebratory sound and raining icons will show on the Workspace. 