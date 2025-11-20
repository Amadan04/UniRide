//user_scenarios

User Scenario 1: 
user registration and Login; 
US1; As a student, I want to register in the application with my university email, so that only university students are verified to use the App 
Acceptance Criteria: 
User must have a "sign-up" page, when they enter their email, and it ends with a university email and a strong password, the user will receive a verification message 

US2: As a user, I want to choose either to be a driver or a rider or both. 
Acceptance Criteria: Role selection is required on first login and can be changed at any time. 
US3: As a user, I want to log in quickly and securely so I can access my account.
Acceptance Criteria:
Valid email and password login; invalid shows an error.
Forgot password; send a reset link to my university email

User Scenario 2 "Ride Creation (Driver)":
US4: as a driver that I can post a ride with destination, Date/time, and starting point, and how many seats are available, so the passengers can see and book.
Acceptance Criteria:
required fields: Start, Destination, Date, and time (Future rides) 
, seats (>1)
-after posting, the ride appears in "Available rides" with seats shown.

US5: As a driver, I want to receive a notification when someone books a ride, and I can either accept or decline. 
Acceptance Criteria: When a booking request is created, the driver receives an in-app notification. The driver can either accept or decline the request 



User Scenario 3 Ride booking "Passenger" :
US6: As a passenger, I want to see available rides that match my destination and so I can choose whatever ride I want.
Acceptance Criteria: I can filter the destination and time window
results show the driver name and details like seats left, time, and estimated price.  

US7: As a passenger, I want to receive a confirmation message when the driver accepts my request. 
Acceptance Criteria: request is blocked when seats = 0
Rider sees status: pending > either confirmed or declined.

US8: As a passenger, I want to have the ability to cancel the ride 
Acceptance Criteria: cancellation is allowed up to X minutes befroe start..Driver is notified of the cancellation 

US9: AS a passenger, I want to see driver details like name, university ID, car typ,e and number. 
Acceptance Criteria:
show driver first name, University ID, Car type/color/palte number 
and rating 

User Scenario 4: Safety & Verification:
US10: As a female passenger, I expect to have a chiose to choose to booka  ride with females only to feel safe and comfortable.
Acceptance Criteria: A Female-only toggle filiter results to rides posted by verified female drivers
only riders who selected females rides will able to book theses rides.

US11; AS a user, I want to see driver's University ID and license to make sure that the driver I am going with is from the university and I can ride with. 
Acceptance Criteria:
Driver upload ID + license 
verified badge appers on drivers profile/ ride cards.

User Scenario 5 "Communication and Notification":
US12: As a user, I want to have chat inside the app to communicate with the driver
Acceptance Criteria: chats open only after a booking request exists.
unacceptable content in chats can be reported.

US13: As a user, I want to receive a message when the ride is confirmed or canceled.
Acceptance Criteria: Accept/Decline/Cancel, sender and receiver will get in-app notifications. 


