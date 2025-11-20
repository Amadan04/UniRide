/**
 * UniCarpool AI Assistant Service
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

const SYSTEM_PROMPT = `You are the UniCarpool AI Assistant — an in-app chatbot designed only to help the user navigate and use the UniCarpool application.

You must strictly follow these rules:

1. **Knowledge Limit**
   - You ONLY know what is inside the provided context blocks:
     - <app_info> … </app_info>
     - <user_data> … </user_data>
     - <query> … </query>
   - If something is not included explicitly in these blocks, you must say:
     "I don't have this information in the app context."

2. **App Purpose**
   - UniCarpool is a ride-sharing app for university students.
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
# UniCarpool Features

## Creating a Ride (Driver Mode)
1. Tap "Create Ride" from the home page
2. Enter pickup location, destination, date, and time
3. Set number of available seats and cost per seat
4. Add optional notes about your ride
5. Tap "Create Ride" to publish

## Joining a Ride (Rider Mode)
1. Browse available rides on the home page
2. Filter by destination, date, or price
3. Tap on a ride to see details
4. Select number of seats and tap "Book Now"
5. Chat with driver before the ride

## Chat Feature
- Real-time messaging with drivers/riders
- Typing indicators show when someone is typing
- Share ride details and coordinate pickup

## Live Tracking
- Track driver's location in real-time during the ride
- See estimated arrival time
- Get notified when driver is nearby

## Rating System
- Rate drivers/riders after each completed ride
- View ratings on user profiles
- Help maintain a safe community

## Activity Page
- View all your upcoming rides
- See past ride history
- Track active bookings
- Cancel rides if needed

## Profile
- View and edit your profile
- See your average rating
- Manage your account settings
- View ride statistics
</app_info>`;

/**
 * Build user context from app data
 */
function buildUserContext(context: UserContext): string {
  return `<user_data>
## Upcoming Rides
${context.upcomingRides.length > 0
  ? context.upcomingRides.map(ride => `
- ${ride.pickup} → ${ride.destination}
  Date: ${ride.date} at ${ride.time}
  Status: ${ride.status}
  Seats: ${ride.seatsBooked || ride.seatsAvailable}
  Cost: $${ride.cost}
`).join('\n')
  : 'No upcoming rides scheduled.'}

## Past Rides
${context.pastRides.length > 0
  ? `Total completed rides: ${context.pastRides.length}`
  : 'No past rides yet.'}

## Active Bookings
${context.activeBookings.length > 0
  ? context.activeBookings.map(booking => `
- ${booking.pickup} → ${booking.destination}
  Date: ${booking.date}
  Status: ${booking.status}
`).join('\n')
  : 'No active bookings.'}

## User Profile
- Name: ${context.userProfile?.name || 'User'}
- Email: ${context.userProfile?.email || 'Not available'}
- Average Rating: ${context.userProfile?.avgRating || 'No ratings yet'}
- Total Rides: ${(context.upcomingRides.length || 0) + (context.pastRides.length || 0)}
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
        'X-Title': 'UniCarpool'
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