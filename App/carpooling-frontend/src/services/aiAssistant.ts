/**
 * UniRide AI Assistant Service
 *
 * Integrates with OpenRouter API to provide in-app chat assistance
 * using GPT-4 with context-aware responses.
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface UserContext {
  upcomingRides: any[];
  pastRides: any[];
  activeBookings: any[];
  userProfile: any;
}

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `You are the UniRide AI Assistant — an in-app chatbot designed only to help the user navigate and use the UniRide application.

You must strictly follow these rules:

1. **Knowledge Limit**
   - You ONLY know what is inside the provided context blocks:
     - <app_info> … </app_info>
     - <user_data> … </user_data>
     - <query> … </query>
   - If something is not included explicitly in these blocks, you must say:
     "I don't have this information in the app context."

2. **App Purpose**
   - UniRide is a ride-sharing app for university students.
   - You can help users with:
     - Creating rides
     - Viewing ride history
     - Understanding driver mode and rider mode
     - Asking about their upcoming rides
     - Asking about schedules
     - Understanding how the app works

3. **User Data**
   - The <user_data> block will contain:
     - User's rides
     - User's schedules
     - Ride statuses
   - You must use ONLY that data when answering questions.

4. **No External Knowledge**
   - Do NOT use internet knowledge.
   - Do NOT guess.
   - Do NOT invent features or data.
   - If the information is missing, say you don't have it.

5. **Style Rules**
   - Be polite and friendly.
   - Keep responses short and helpful.
   - If the user asks for something inside the app, explain step-by-step.
   - If the user asks for something outside app scope, gently decline.

Always base your answer ONLY on <app_info> and <user_data>.`;

const APP_INFO = `<app_info>
# UniRide Features

## Creating a Ride (Driver Mode)
1. Tap "Create Ride" from the home page
2. Enter pickup location, destination, date, and time
3. **Multi-Pickup Support**: Add multiple pickup points along your route for flexible passenger pickup
4. Set number of available seats and cost per seat
5. Add optional notes about your ride
6. Tap "Create Ride" to publish

## Joining a Ride (Rider Mode)
1. Browse available rides on the home page
2. **Choose Your Pickup Point**: Select from multiple pickup locations when available
3. Filter by destination, date, or price
4. Tap on a ride to see details
5. Select number of seats and tap "Book Now"
6. Chat with driver before the ride

## Class Schedule Integration
- Upload your class timetable image or add classes manually
- System automatically tags rides with schedule compatibility:
  - 🟢 **After Classes**: Ride is after all your classes
  - 🟡 **Between Classes**: Ride is during a break
  - 🟡 **Close to Class Time**: Ride is within 30 minutes of a class
  - 🔴 **Conflicts With Class**: Ride overlaps with your class time
- Helps you avoid booking rides during class hours

## Chat Feature
- Real-time messaging with drivers/riders in ride-specific chat rooms
- Typing indicators show when someone is typing
- Share ride details and coordinate pickup
- System messages for important ride updates

## Live Tracking & Navigation
- **Real-time driver location**: Track driver's current position during active rides
- **Multi-stop routing**: Optimized route that visits all passenger pickup points
- **Live map view**: Interactive map showing driver location and pickup points
- **ETA updates**: See estimated arrival time for each pickup location
- Access tracking from "/tracking" page during active rides

## Carpool Score & Gamification System
- **Earn Points**: Get carpool points for every completed ride
  - Drivers: 15 points per ride + 5 points per passenger
  - Riders: 10 points per ride
- **Badge System**: Unlock achievement badges:
  - 🏆 Road Warrior, Eco Champion, Social Butterfly, Rating Star, Early Bird
  - Community Hero, Distance Master, Savings Champion, Perfect Streak, Night Owl
- **Weekly Leaderboard**: Compete with other users, top 10 shown on leaderboard page
- **Profile Stats**: View your total points, badges earned, and leaderboard rank

## Rating System
- Rate drivers/riders after each completed ride (1-5 stars)
- **One rating per ride**: You can only rate each ride once
- View ratings on user profiles
- Average rating displayed on profile and ride cards
- Helps maintain a safe and reliable community

## Activity Page
- View all your upcoming rides
- See past ride history
- Track active bookings
- Rate completed rides
- Cancel rides if needed

## Profile
- View and edit your profile information
- See your average rating and total ratings count
- **View Carpool Score**: See your total points and current rank
- **Badge Collection**: Display all unlocked badges
- Manage your account settings
- View ride statistics
</app_info>`;

/**
 * Build user context from app data
 */
function buildUserContext(context: UserContext): string {
  const userRole = context.userProfile?.role || 'user';
  const isDriver = userRole === 'driver';
  const isRider = userRole === 'rider';

  return `<user_data>
## User Profile
- Name: ${context.userProfile?.name || 'User'}
- Email: ${context.userProfile?.email || 'Not available'}
- Role: ${userRole.toUpperCase()} ${isDriver ? '(Creates and offers rides to others)' : '(Books rides from drivers)'}
- Average Rating: ${context.userProfile?.avgRating || 'No ratings yet'}
- Total Rides: ${(context.upcomingRides.length || 0) + (context.pastRides.length || 0)}

${isDriver ? `## Upcoming Rides (As Driver - Rides I'm Offering)` : `## Upcoming Rides (As Driver)`}
${context.upcomingRides.length > 0
  ? context.upcomingRides.map(ride => `
- ${ride.pickup} → ${ride.destination}
  Date: ${ride.date} at ${ride.time}
  Status: ${ride.status}
  Available Seats: ${ride.seatsAvailable}
  Cost per Seat: $${ride.cost}
  ${isDriver ? '(I am driving this ride)' : ''}
`).join('\n')
  : isDriver ? 'No rides currently offered.' : 'No rides created.'}

${isDriver ? `## Past Rides (As Driver)` : `## Past Rides`}
${context.pastRides.length > 0
  ? `Total completed rides as driver: ${context.pastRides.length}`
  : 'No past rides yet.'}

${isRider ? `## Active Bookings (As Rider - Rides I've Booked)` : `## Active Bookings (As Rider)`}
${context.activeBookings.length > 0
  ? context.activeBookings.map(booking => `
- ${booking.pickup} → ${booking.destination}
  Date: ${booking.date}
  Status: ${booking.status}
  Seats Booked: ${booking.seatsBooked}
  ${isRider ? '(I am a passenger on this ride)' : ''}
`).join('\n')
  : isRider ? 'No active bookings. Browse available rides to book one!' : 'No bookings.'}

## Important Notes
${isDriver ? `
- You are a DRIVER, so you CREATE rides and offer them to riders.
- When the user asks about "my rides", they mean rides they are DRIVING.
- When the user asks about "bookings", they mean riders who booked their rides.
` : `
- You are a RIDER, so you BOOK rides from drivers.
- When the user asks about "my rides", they mean rides they have BOOKED as a passenger.
- You cannot create rides - only drivers can do that.
`}
</user_data>`;
}

/**
 * Send message to AI Assistant
 */
export async function sendMessage(
  userMessage: string,
  context: UserContext,
  conversationHistory: Message[] = []
): Promise<string> {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    const userContext = buildUserContext(context);
    const queryMessage = `${APP_INFO}\n\n${userContext}\n\n<query>\n${userMessage}\n</query>`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: queryMessage }
    ];

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'UniRide'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Sorry, I could not process your request.';
  } catch (error) {
    console.error('AI Assistant error:', error);
    throw error;
  }
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}